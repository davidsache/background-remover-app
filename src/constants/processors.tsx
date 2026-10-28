import { removeBackground, removeForeground, segmentForeground } from "@imgly/background-removal";

export const PROCESS_MODES = {
  foreground: removeForeground,
  background: removeBackground,
  mask: segmentForeground
} as const;

export type PROCESS_MODE = keyof typeof PROCESS_MODES;