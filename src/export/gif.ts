const FRAME_DELAY = 8;

function packCodes(codes: readonly [number, number][]): number[] {
  const bytes: number[] = [];
  let accumulator = 0;
  let bitCount = 0;
  for (const [code, width] of codes) {
    accumulator |= code << bitCount;
    bitCount += width;
    while (bitCount >= 8) {
      bytes.push(accumulator & 255);
      accumulator >>>= 8;
      bitCount -= 8;
    }
  }
  if (bitCount > 0) bytes.push(accumulator & 255);
  return bytes;
}

function encodeLzw(indices: Uint8Array): number[] {
  const clearCode = 256;
  const endCode = 257;
  let codeSize = 9;
  let nextCode = 258;
  let dictionary = new Map<number, number>();
  const codes: [number, number][] = [[clearCode, codeSize]];

  if (indices.length === 0) {
    codes.push([endCode, codeSize]);
    return packCodes(codes);
  }

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const pixel = indices[i];
    const key = prefix * 256 + pixel;
    const found = dictionary.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }

    codes.push([prefix, codeSize]);
    if (nextCode < 4096) {
      dictionary.set(key, nextCode++);
      if (nextCode > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      codes.push([clearCode, codeSize]);
      dictionary = new Map<number, number>();
      codeSize = 9;
      nextCode = 258;
    }
    prefix = pixel;
  }
  codes.push([prefix, codeSize], [endCode, codeSize]);
  return packCodes(codes);
}

function packLzwSubBlocks(data: readonly number[]): number[] {
  const result: number[] = [];
  for (let start = 0; start < data.length; start += 255) {
    const length = Math.min(255, data.length - start);
    result.push(length, ...data.slice(start, start + length));
  }
  result.push(0);
  return result;
}

export function makeGif(
  frames: readonly Uint8ClampedArray[],
  width: number,
  height: number,
  transparent: boolean,
): Blob {
  const bytes: number[] = [];
  const writeByte = (value: number): void => {
    bytes.push(value & 255);
  };
  const writeWord = (value: number): void => {
    writeByte(value);
    writeByte(value >> 8);
  };
  const writeString = (value: string): void => {
    for (let i = 0; i < value.length; i++) writeByte(value.charCodeAt(i));
  };

  writeString("GIF89a");
  writeWord(width);
  writeWord(height);
  writeByte(0xf7);
  writeByte(0);
  writeByte(0);
  for (let index = 0; index < 256; index++) {
    if (index >= 254) {
      writeByte(255);
      writeByte(255);
      writeByte(255);
      continue;
    }
    const red = (index >> 5) & 7;
    const green = (index >> 2) & 7;
    const blue = index & 3;
    writeByte(Math.round((red * 255) / 7));
    writeByte(Math.round((green * 255) / 7));
    writeByte(Math.round((blue * 255) / 3));
  }

  writeByte(0x21);
  writeByte(0xff);
  writeByte(0x0b);
  writeString("NETSCAPE2.0");
  writeByte(0x03);
  writeByte(0x01);
  writeWord(0);
  writeByte(0);

  for (const pixels of frames) {
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < indices.length; i++) {
      const offset = i * 4;
      if (transparent && pixels[offset + 3] < 128) {
        indices[i] = 255;
      } else {
        const red = pixels[offset] >> 5;
        const green = pixels[offset + 1] >> 5;
        const blue = pixels[offset + 2] >> 6;
        const index = (red << 5) | (green << 2) | blue;
        indices[i] = index === 255 ? 254 : index;
      }
    }

    writeByte(0x21);
    writeByte(0xf9);
    writeByte(0x04);
    writeByte(transparent ? 0x05 : 0x04);
    writeWord(FRAME_DELAY);
    writeByte(255);
    writeByte(0);

    writeByte(0x2c);
    writeWord(0);
    writeWord(0);
    writeWord(width);
    writeWord(height);
    writeByte(0);
    writeByte(8);
    for (const byte of packLzwSubBlocks(encodeLzw(indices))) {
      writeByte(byte);
    }
  }
  writeByte(0x3b);
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
