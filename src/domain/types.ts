export const ANIMATION_STYLES = {
  breathe: "Soft breathe",
  float: "Little float",
  glow: "Warm glow",
  sway: "Gentle sway",
  wiggle: "Playful wiggle",
  pop: "Little pop",
  "color-shift": "Color shift",
  "rainbow-glow": "Rainbow glow",
} as const;

export type AnimationStyle = keyof typeof ANIMATION_STYLES;
export type Shape = "circle" | "square";

export const BACKGROUNDS = [
  "#f2eee6",
  "#dce8df",
  "#dfe7f1",
  "#efdfe1",
  "#e6e1f1",
  "transparent",
] as const;

export type Background = (typeof BACKGROUNDS)[number];

export interface EditorState {
  photo: HTMLImageElement | null;
  photoUrl: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  animationStyle: AnimationStyle;
  shape: Shape;
  background: Background;
  dragPoint: { x: number; y: number } | null;
  lastFrameTime: number;
  frameNumber: number;
}

export function isAnimationStyle(
  value: string | undefined,
): value is AnimationStyle {
  return value !== undefined && Object.hasOwn(ANIMATION_STYLES, value);
}

export function isShape(value: string | undefined): value is Shape {
  return value === "circle" || value === "square";
}

export function isBackground(value: string | undefined): value is Background {
  return BACKGROUNDS.some((background) => background === value);
}
