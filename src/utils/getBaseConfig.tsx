import type { Config } from "@imgly/background-removal";

export const getBaseConfig = (): Config => {
  return {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    debug: false,
    model: 'isnet_fp16',
    device: 'cpu',
  };
};