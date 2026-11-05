import { useEffect, useState } from "react";
import { STORED_DEVICE_NAME, STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { DEVICES, FORMATS, MODELS, TYPES } from "../constants/types";
import { checkWebGPUSupport } from "../utils/checkWebGPUSupport";
import { useModal } from "../context/ModalContext";

export const Settings: React.FC = () => {
  const INFO_TEXTS: Map<string, string> = new Map([
    [STORED_MODEL_NAME, "Selects the quantization level of the IS-Net segmentation model:\n\n• large: Maximum alpha-matte accuracy highest RAM usage and slowest initial download.\n\n• medium: Half-precision weights virtually identical visual output to 'large' at half the download size.\n\n• small: Quantized weights; fastest download and lowest memory footprint, with minor edge artifacts on fine details like hair."],
    [STORED_TYPE_NAME, "Controls which pixel data is written into the output image:\n\n• foreground: Keeps the detected subject and sets background pixels to transparent (alpha = 0).\n\n• background: Inverts the alpha matte, removing the subject (alpha = 0) and keeping only the background pixels.\n\n• mask: Discards RGB color data from the source image and outputs the raw grayscale segmentation map (white for foreground, black for background)"],
    [STORED_FORMAT_NAME, "Determines the MIME encoding of the returned Blob:\n\n• png: Lossless compression with full alpha channel support.\n\n• webp: Lossy or lossless compression with alpha channel support; produces significantly smaller file sizes than PNG.\n\n• jpeg: Lossy format without alpha support (transparent areas render black)."],
    [STORED_DEVICE_NAME, "Selects the ONNX Runtime execution provider: \n\n• cpu: Executes inference using WebAssembly (wasm).\n\n• gpu: Attempts hardware acceleration via WebGPU. If the user's browser or GPU does not support WebGPU, the library falls back to cpu."],
    [STORED_QUALITY_NAME, "Specifies the compression quality ratio passed to the encoder."]
  ]);
  
  const [model, setModel] = useState<string>('isnet_fp16');
  const [type, setType] = useState<string>('background');
  const [format, setFormat] = useState<string>('image/png');
  const [quality, setQuality] = useState<number>(0.5);
  const [GPUSupported, setGPUSupported] = useState<boolean>(false);
  const [device, setDevice] = useState<string>('cpu');
  const { openModal } = useModal();

  useEffect(() => {
    const storedModel = localStorage.getItem(STORED_MODEL_NAME);
    if (storedModel && MODELS.has(storedModel)) setModel(storedModel);
    
    const storedType = localStorage.getItem(STORED_TYPE_NAME);
    if (storedType && TYPES.has(storedType)) setType(storedType);

    const storedFormat = localStorage.getItem(STORED_FORMAT_NAME);
    if (storedFormat && FORMATS.has(storedFormat)) setFormat(storedFormat);

    const storedDevice = localStorage.getItem(STORED_DEVICE_NAME);
    if (storedDevice && DEVICES.has(storedDevice)) setDevice(storedDevice);

    const storedQuality = localStorage.getItem(STORED_QUALITY_NAME);
    if (storedQuality && !isNaN(Number(storedQuality))) setQuality(Number(storedQuality));
  }, []);

  useEffect(() => {
    const checkGPUSupport = async () => {
      setGPUSupported(await checkWebGPUSupport());
    }

    checkGPUSupport();
  }, []);

  const handleModelChange = (value: string) => {
    if (!MODELS.has(value)) return;

    setModel(value);
    localStorage.setItem(STORED_MODEL_NAME, value);
  }

  const handleTypeChange = (value: string) => {
    if (!TYPES.has(value)) return;

    setType(value);
    localStorage.setItem(STORED_TYPE_NAME, value);
  }

  const handleFormatChange = (value: string) => {
    if (!FORMATS.has(value)) return;

    setFormat(value);
    localStorage.setItem(STORED_FORMAT_NAME, value);
  }

  const handleDeviceChange = (value: string) => {
    if (!DEVICES.has(value)) return;

    if (!GPUSupported) {
      setDevice('cpu');
      localStorage.setItem(STORED_DEVICE_NAME, 'cpu');
      return;
    }

    setDevice(value);
    localStorage.setItem(STORED_DEVICE_NAME, value);
  }

  const handleQualityChange = (value: string) => {
    if (value === '') {
      setQuality(0);
      return;
    }

    const number = Number(value);
    if (!isNaN(number) && number >= 0 && number <= 1) {
      setQuality(number);
      localStorage.setItem(STORED_QUALITY_NAME, number.toString());
    }
  }

  const handleQualityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  return (
    <>
      <div className="flex flex-row mb-3">
        <div>
          <label 
            className="block text-center cursor-pointer hover:underline hover:text-yellow-200" 
            htmlFor="model"
            onClick={() => openModal({ title: 'Model information', message: INFO_TEXTS.get(STORED_MODEL_NAME) ?? "" })}
          >
            Model
          </label>
          <select 
            id="model" 
            onChange={(e) => handleModelChange(e.target.value)}
            className="bg-slate-700 border border-slate-500 hover:border-slate-400 hover:bg-slate-600 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
            value={model}
          >
            <option value="isnet">isnet (large)</option>
            <option value="isnet_fp16">isnet_fp16 (medium)</option>
            <option value="isnet_quint8">isnet_quint8 (small)</option>
          </select>
        </div>

        <div className="ms-4">
          <label 
            className="block text-center cursor-pointer hover:underline hover:text-yellow-200" 
            htmlFor="type"
            onClick={() => openModal({ title: 'Type information', message: INFO_TEXTS.get(STORED_TYPE_NAME) ?? "" })}
          >
              Type
            </label>
          <select 
            id="type" 
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-slate-700 border border-slate-500 hover:border-slate-400 hover:bg-slate-600 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
            value={type}
          >
            <option value="foreground">Foreground</option>
            <option value="background">Background</option>
            <option value="mask">Mask</option>
          </select>
        </div>

        <div className="ms-4">
          <label 
            className="block text-center cursor-pointer hover:underline hover:text-yellow-200" 
            htmlFor="format"
            onClick={() => openModal({ title: "Format information", message: INFO_TEXTS.get(STORED_FORMAT_NAME) ?? "" })}
          >
            Format
          </label>
          <select 
            id="format" 
            onChange={(e) => handleFormatChange(e.target.value)}
            className="bg-slate-700 border border-slate-500 hover:border-slate-400 hover:bg-slate-600 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
            value={format}
          >
            <option value="image/png">PNG</option>
            <option value="image/webp">WEBP</option>
            <option value="image/jpeg">JPEG</option>
          </select>
        </div>

        <div className="ms-4">
          <label 
            className="block text-center cursor-pointer hover:underline hover:text-yellow-200" 
            htmlFor="device"
            onClick={() => openModal({ title: "Device information", message: INFO_TEXTS.get(STORED_DEVICE_NAME) ?? "" })}
          >
            Device
          </label>
          <select 
            id="device" 
            disabled={!GPUSupported}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="bg-slate-700 border border-slate-500 hover:border-slate-400 hover:bg-slate-600 disabled:bg-slate-400 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
            value={device}
          >
            <option value="cpu">CPU (WASM)</option>
            <option value="gpu">GPU (WebGPU)</option>
          </select>
        </div>

        <div className="ms-4">
          <label 
            className="block text-center cursor-pointer hover:underline hover:text-yellow-200" 
            htmlFor="quality"
            onClick={() => openModal({ title: "Quality information", message: INFO_TEXTS.get(STORED_QUALITY_NAME) ?? "" })}
          >
            Quality
          </label>
          <input 
            id="quality" 
            type="number" 
            min="0" 
            max="1" 
            step="0.1" 
            value={quality}
            onKeyDown={handleQualityKeyDown}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="bg-slate-700 border border-slate-500 hover:border-slate-400 hover:bg-slate-600 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
          />
        </div>
      </div>
    </>
  );
}