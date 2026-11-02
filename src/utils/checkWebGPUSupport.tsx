/**
 * Hardware capability detection utility.
 * @returns Whether WebGPU is supported or not.
 */
export const checkWebGPUSupport = async (): Promise<boolean> => {
  if (!('gpu' in navigator)) return false;

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  }
  catch {
    return false;
  }
};