export const MODELS = new Set(['isnet', 'isnet_fp16', 'isnet_quint8']);
export const TYPES = new Set(['foreground', 'background', 'mask']);
export const FORMATS = new Set(['image/png', 'image/webp', 'image/jpeg']);
export const DEVICES = new Set(['cpu', 'gpu']);

export type MODEL_TYPES = "isnet" | "isnet_fp16" | "isnet_quint8" | undefined;
export type FORMAT_TYPES = "image/png" | "image/jpeg" | "image/webp" | "image/x-rgba8" | "image/x-alpha8" | undefined;
export type DEVICE_TYPES = 'cpu' | 'gpu' | undefined;