import uploadImg from '../assets/upload.svg';
import downloadImg from '../assets/download.svg';
import processImg from '../assets/process.svg';

import { type Config } from "@imgly/background-removal";
import { useRef, useState, type ChangeEvent } from "react";
import { PROCESS_MODES, type PROCESS_MODE } from "../constants/processors";
import { STORED_DEVICE_NAME, STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { DEVICES, FORMATS, MODELS, TYPES, type DEVICE_TYPES, type FORMAT_TYPES, type MODEL_TYPES } from "../constants/types";
import { useModal } from "../context/ModalContext";
import { checkWebGPUSupport } from '../utils/checkWebGPUSupport';
import { getBaseConfig } from '../utils/getBaseConfig';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
}

interface ProcessingConfig {
  configuration: Config;
  type: string;
}

export const ImageProcessor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>({ isProcessing: false, progress: 0, stage: 'idle' });
  const [file, setFile] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { openModal } = useModal();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setFile(file);

    if (!await validateImageSignature(file)) {
      openModal({ title: 'Alert!', message: 'Selected file must be an image (.png, .jpeg or .webp).' });
      return;
    }

    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);

    const imageUrl = URL.createObjectURL(file);
    setOriginalImage(imageUrl);
    setProcessedImage(null);
    processImage(file);
  };

  const validateImageSignature = async (file: File): Promise<string | null> => {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const hex = Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    // Checking if PNG
    if (hex.startsWith('89 50 4E 47')) {
      return 'image/png';
    }

    // Checking if JPEG
    if (hex.startsWith('FF D8 FF')) {
      return 'image/jpeg';
    }

    // Checking if WebP
    const isRiff = hex.slice(0, 11) === '52 49 46 46';
    const isWebp = hex.slice(24, 35) === '57 45 42 50';
    if (isRiff && isWebp) {
      return 'image/webp';
    }

    return null;
  }
  
  const processImage = async (file: File) => {
    setStatus({ isProcessing: true, progress: 0, stage: 'Initializing engine...' });
    const config = await getConfig();

    try {
      const targetFunction = PROCESS_MODES[config.type as PROCESS_MODE];
      const resultBlob = await targetFunction(file, config.configuration);
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
    }
    catch (error) {
      console.error('Processing failed:', error);
      openModal({ title: 'Background removal failed!', message: `${error}` });
    }
    finally {
      setStatus({ isProcessing: false, progress: 100, stage: 'complete' });
    }
  };

  const getConfig = async (): Promise<ProcessingConfig> => {
    const config: ProcessingConfig = {
      configuration: {
        ...getBaseConfig(),
        output: {
          format: 'image/png',
          quality: 0.8
        }
      },
      type: 'background'
    };
  
    const storedModel = localStorage.getItem(STORED_MODEL_NAME);
    if (storedModel && MODELS.has(storedModel)) {
      config.configuration.model = storedModel as MODEL_TYPES;
    }

    const storedType = localStorage.getItem(STORED_TYPE_NAME);
    if (storedType && TYPES.has(storedType)) {
      config.type = storedType;
    }

    const storedFormat = localStorage.getItem(STORED_FORMAT_NAME);
    if (storedFormat && FORMATS.has(storedFormat)) {
      config.configuration.output!.format = storedFormat as FORMAT_TYPES;
    }

    const storedDevice = localStorage.getItem(STORED_DEVICE_NAME);
    if (storedDevice && DEVICES.has(storedDevice)) {
      config.configuration.device = await checkWebGPUSupport() ? storedDevice as DEVICE_TYPES : 'cpu';
    }
      
    const storedQuality = localStorage.getItem(STORED_QUALITY_NAME);
    if (storedQuality && !isNaN(Number(storedQuality))) {
      config.configuration.output!.quality = Number(storedQuality);
    }

    return config;
  };
  
  const handleDownload = () => {
    if (!processedImage) return;

    const anchor = document.createElement('a');
    anchor.href = processedImage;

    const storedFormat = localStorage.getItem(STORED_FORMAT_NAME);
    let imageFormat = 'png';

    if (storedFormat && FORMATS.has(storedFormat)) {
      imageFormat = storedFormat.split("/")[1];
    }

    anchor.download = `removed-background.${imageFormat}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <main className="max-w-4xl w-flex flex-col items-center gap-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".png, .jpg, .jpeg, .webp"
        className="hidden"
      />

      <div className="text-center">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={status.isProcessing} 
          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          <img src={uploadImg} alt="Upload" className="w-5 h-5"/>
          <span>{status.isProcessing ? 'Processing...' : 'Upload Image'}</span>
        </button>
        {originalImage && (
          <button
            onClick={() => { if (file) processImage(file) }}
            disabled={status.isProcessing}
            className="inline-flex items-center gap-1 ms-2 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <img src={processImg} alt="Process" className="w-5 h-5"/>
            <span>Process Again</span>
          </button>
        )}
      </div>

      {status.isProcessing && (
        <div className="flex-grow bg-neutral-800 p-4 mt-4 rounded-lg border border-neutral-700 ">
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>{status.stage}</span>
            <span>{status.progress}%</span>
          </div>
          <div className="w-full bg-neutral-700 h-2 rounded-full overflow-hidden">
            <div className={`bg-blue-500 h-full transition-all duration-150 w-[${status.progress}%]`}/>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
        <div className="flex flex-col items-center border border-neutral-800 rounded-lg p-4 bg-neutral-950">
          <h2 className="text-sm font-semibold text-neutral-400 mb-3">Original</h2>
          <div className="w-full h-80 flex items-center justify-center bg-neutral-900 rounded overflow-hidden">
            {originalImage ? (
              <img
                src={originalImage}
                alt="Original"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-neutral-600 text-xs">No image selected</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center border border-neutral-800 rounded-lg p-4 bg-neutral-950">
          <h2 className=" text-sm font-semibold text-neutral-400 mb-3">Processed Result</h2>
          <div id="divProcessedResult" className="w-full h-80 flex items-center justify-center rounded overflow-hidden">
            {processedImage ? (
              <img
                src={processedImage}
                alt="Background removed"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-neutral-600 text-xs">
                {status.isProcessing ? 'Removing background...' : 'Awaiting input'}
              </span>
            )}
          </div>

          {processedImage && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 mt-4 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
            >
              <img src={downloadImg} alt="Download" className="w-5 h-5"/>
              <span>Download Image</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}