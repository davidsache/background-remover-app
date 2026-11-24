import type { Config } from "@imgly/background-removal";

/**
 * Returns the base configuration.
 * @returns Object with the base processor configuration.
 */
export const getBaseConfig = (): Config => {
  return {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    debug: false,
    model: 'isnet_fp16',
    device: 'cpu',
  };
};