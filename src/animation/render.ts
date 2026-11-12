import type { EditorState } from "../domain/types.js";

export function drawImage(
  context: CanvasRenderingContext2D,
  size: number,
  phase: number,
  state: EditorState,
  previewWidth: number,
  previewHeight: number,
): void {
  const { photo, animationStyle, background, shape, zoom, offsetX, offsetY } =
    state;
  if (!photo) return;

  const wave = Math.sin(phase * Math.PI * 2);
  let motionScale = 1;
  let motionY = 0;
  let motionX = 0;
  let rotation = 0;
  let brightness = 1;
  let saturation = 1;
  let hueRotation = 0;

  if (animationStyle === "breathe") {
    motionScale = 1 + (0.035 * (1 - Math.cos(phase * Math.PI * 2))) / 2;
  } else if (animationStyle === "float") {
    motionY = wave * size * 0.025;
    motionScale = 1.025;
  } else if (animationStyle === "glow") {
    brightness = 1.015 + (0.045 * (1 + wave)) / 2;
    saturation = 1.04 + (0.08 * (1 + wave)) / 2;
  } else if (animationStyle === "sway") {
    motionX = wave * size * 0.025;
    motionScale = 1.04;
  } else if (animationStyle === "wiggle") {
    rotation = wave * 0.035;
    motionScale = 1.08;
  } else if (animationStyle === "color-shift") {
    hueRotation = phase * 360;
    saturation = 1.25;
  } else if (animationStyle === "pop") {
    const bounce = Math.max(0, Math.sin(phase * Math.PI * 4));
    motionScale = 1 + 0.12 * bounce;
    motionY = -size * 0.045 * bounce;
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
  if (rotation !== 0) {
    context.translate(size / 2, size / 2);
    context.rotate(rotation);
    context.translate(-size / 2, -size / 2);
  }

  const scale =
    Math.max(size / photo.naturalWidth, size / photo.naturalHeight) *
    zoom *
    motionScale;
  const imageWidth = photo.naturalWidth * scale;
  const imageHeight = photo.naturalHeight * scale;
  const x = (size - imageWidth) / 2 + (offsetX * size) / previewWidth + motionX;
  const y =
    (size - imageHeight) / 2 + (offsetY * size) / previewHeight + motionY;

  context.filter = `brightness(${brightness}) saturate(${saturation}) hue-rotate(${hueRotation}deg)`;
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
  } else if (animationStyle === "rainbow-glow") {
    const hue = phase * 360;
    const centerX = size * (0.5 + 0.28 * Math.cos(phase * Math.PI * 2));
    const centerY = size * (0.5 + 0.28 * Math.sin(phase * Math.PI * 2));
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      size * 0.8,
    );
    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.32)`);
    gradient.addColorStop(0.55, `hsla(${hue + 110}, 100%, 70%, 0.16)`);
    gradient.addColorStop(1, `hsla(${hue + 220}, 100%, 70%, 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  context.restore();
}
