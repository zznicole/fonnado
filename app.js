(() => {
  "use strict";

  const stage = document.getElementById("photoStage");
  const canvas = document.getElementById("preview");
  const ctx = canvas.getContext("2d");
  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadButton");
  const replaceButton = document.getElementById("replaceButton");
  const placeholder = document.getElementById("placeholder");
  const photoInfo = document.getElementById("photoInfo");
  const liveBadge = document.getElementById("liveBadge");
  const zoomInput = document.getElementById("zoom");
  const zoomReadout = document.getElementById("zoomReadout");
  const exportButton = document.getElementById("exportButton");
  const exportNote = document.getElementById("exportNote");
  const errorMessage = document.getElementById("errorMessage");

  const GIF_WIDTH = 160;
  const FRAME_COUNT = 16;
  const FRAME_DELAY = 8;
  const styles = {
    breathe: "Soft breathe",
    float: "Little float",
    glow: "Warm glow",
  };

  let photo = null;
  let photoUrl = null;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let animationStyle = "breathe";
  let shape = "circle";
  let background = "#f2eee6";
  let dragPoint = null;
  let lastFrameTime = 0;
  let frameNumber = 0;

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }

  function drawImage(context, size, phase) {
    if (!photo) return;

    const wave = Math.sin(phase * Math.PI * 2);
    let motionScale = 1;
    let motionY = 0;
    let brightness = 1;
    let saturation = 1;

    if (animationStyle === "breathe") {
      motionScale = 1 + (0.035 * (1 - Math.cos(phase * Math.PI * 2))) / 2;
    } else if (animationStyle === "float") {
      motionY = wave * size * 0.025;
      motionScale = 1.025;
    } else {
      brightness = 1.015 + (0.045 * (1 + wave)) / 2;
      saturation = 1.04 + (0.08 * (1 + wave)) / 2;
    }

    context.clearRect(0, 0, size, size);
    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, size, size);
    }

    context.save();
    if (shape === "circle") {
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.clip();
    }

    const scale =
      Math.max(size / photo.naturalWidth, size / photo.naturalHeight) *
      zoom *
      motionScale;
    const imageWidth = photo.naturalWidth * scale;
    const imageHeight = photo.naturalHeight * scale;
    const x = (size - imageWidth) / 2 + (offsetX * size) / canvas.width;
    const y =
      (size - imageHeight) / 2 + (offsetY * size) / canvas.height + motionY;

    context.filter = `brightness(${brightness}) saturate(${saturation})`;
    context.drawImage(photo, x, y, imageWidth, imageHeight);
    context.filter = "none";
    if (animationStyle === "glow") {
      const gradient = context.createRadialGradient(
        size * 0.2,
        size * 0.08,
        0,
        size * 0.2,
        size * 0.08,
        size * 0.92,
      );
      gradient.addColorStop(
        0,
        `rgba(255, 230, 185, ${0.11 + (0.07 * (1 + wave)) / 2})`,
      );
      gradient.addColorStop(1, "rgba(255, 230, 185, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    }
    context.restore();
  }

  function animate(timestamp) {
    if (timestamp - lastFrameTime >= 45) {
      lastFrameTime = timestamp;
      frameNumber = (frameNumber + 1) % FRAME_COUNT;
      drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function clampPosition() {
    if (!photo) return;
    const scale =
      Math.max(
        canvas.width / photo.naturalWidth,
        canvas.height / photo.naturalHeight,
      ) * zoom;
    const maxX = Math.max(0, (photo.naturalWidth * scale - canvas.width) / 2);
    const maxY = Math.max(0, (photo.naturalHeight * scale - canvas.height) / 2);
    offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
    offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
  }

  function loadPhoto(file) {
    clearError();
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("That file isn't an image. Choose a JPG, PNG, or WebP photo.");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      showError("We couldn't open that image. Try choosing a different photo.");
    };
    image.onload = () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = nextUrl;
      photo = image;
      zoom = 1;
      offsetX = 0;
      offsetY = 0;
      zoomInput.value = "1";
      zoomReadout.textContent = "1.0×";
      placeholder.hidden = true;
      canvas.style.display = "block";
      liveBadge.style.display = "flex";
      replaceButton.hidden = false;
      exportButton.disabled = false;
      photoInfo.textContent = `${file.name} · ${image.naturalWidth} × ${image.naturalHeight}`;
      drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
    };
    image.src = nextUrl;
  }

  uploadButton.addEventListener("click", () => fileInput.click());
  replaceButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (event) => {
    loadPhoto(event.target.files[0]);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) =>
    stage.addEventListener(eventName, (event) => {
      event.preventDefault();
      stage.classList.add("is-dragging");
    }),
  );
  ["dragleave", "drop"].forEach((eventName) =>
    stage.addEventListener(eventName, (event) => {
      event.preventDefault();
      stage.classList.remove("is-dragging");
    }),
  );
  stage.addEventListener("drop", (event) =>
    loadPhoto(event.dataTransfer.files[0]),
  );

  document.querySelectorAll("[data-style]").forEach((button) => {
    button.addEventListener("click", () => {
      animationStyle = button.dataset.style;
      document.querySelectorAll("[data-style]").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
    });
  });

  document.querySelectorAll("[data-shape]").forEach((button) => {
    button.addEventListener("click", () => {
      shape = button.dataset.shape;
      document.querySelectorAll("[data-shape]").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
    });
  });

  document.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      background = button.dataset.color;
      document.querySelectorAll("[data-color]").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
    });
  });

  zoomInput.addEventListener("input", () => {
    zoom = Number(zoomInput.value);
    zoomReadout.textContent = `${zoom.toFixed(1)}×`;
    clampPosition();
    drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!photo) return;
    canvas.setPointerCapture(event.pointerId);
    dragPoint = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragPoint) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = canvas.width / bounds.width;
    offsetX += (event.clientX - dragPoint.x) * ratio;
    offsetY += (event.clientY - dragPoint.y) * ratio;
    dragPoint = { x: event.clientX, y: event.clientY };
    clampPosition();
    drawImage(ctx, canvas.width, frameNumber / FRAME_COUNT);
  });
  canvas.addEventListener("pointerup", () => {
    dragPoint = null;
  });
  canvas.addEventListener("pointercancel", () => {
    dragPoint = null;
  });

  function packCodes(codes) {
    const bytes = [];
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

  function encodeLzw(indices) {
    const clearCode = 256;
    const endCode = 257;
    let codeSize = 9;
    let nextCode = 258;
    let dictionary = new Map();
    const codes = [[clearCode, codeSize]];

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
        dictionary = new Map();
        codeSize = 9;
        nextCode = 258;
      }
      prefix = pixel;
    }
    codes.push([prefix, codeSize], [endCode, codeSize]);
    return packCodes(codes);
  }

  function makeGif(frames, width, height, transparent) {
    const bytes = [];
    const writeByte = (value) => bytes.push(value & 255);
    const writeWord = (value) => {
      writeByte(value);
      writeByte(value >> 8);
    };
    const writeString = (value) => {
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
      const compressed = packLzwSubBlocks(encodeLzw(indices));
      for (const byte of compressed) writeByte(byte);
    }
    writeByte(0x3b);
    return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
  }

  function packLzwSubBlocks(data) {
    const result = [];
    for (let start = 0; start < data.length; start += 255) {
      const length = Math.min(255, data.length - start);
      result.push(length, ...data.slice(start, start + length));
    }
    result.push(0);
    return result;
  }

  function nextTask() {
    return new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  async function exportGif() {
    if (!photo) return;
    clearError();
    exportButton.disabled = true;
    exportButton.querySelector("span").textContent = "Making your image…";
    exportNote.textContent = "A little magic, just a moment";
    try {
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = GIF_WIDTH;
      frameCanvas.height = GIF_WIDTH;
      const frameContext = frameCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const frames = [];
      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        drawImage(frameContext, GIF_WIDTH, frame / FRAME_COUNT);
        frames.push(frameContext.getImageData(0, 0, GIF_WIDTH, GIF_WIDTH).data);
        await nextTask();
      }

      const gif = makeGif(
        frames,
        GIF_WIDTH,
        GIF_WIDTH,
        background === "transparent",
      );
      const link = document.createElement("a");
      const url = URL.createObjectURL(gif);
      const baseName =
        (photo.name || "image")
          .replace(/\.[^.]+$/, "")
          .replace(/[^\w-]+/g, "-") || "image";
      link.href = url;
      link.download = `${baseName}-animated.gif`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportNote.textContent = `Your ${styles[animationStyle].toLowerCase()} GIF is ready to share`;
    } catch (error) {
      console.error("Could not export animated image:", error);
      showError("We couldn't make the GIF this time. Please try again.");
      exportNote.textContent = "A looping GIF, ready to share";
    } finally {
      exportButton.disabled = false;
      exportButton.querySelector("span").textContent = "Make my animated image";
    }
  }
  exportButton.addEventListener("click", exportGif);
})();
