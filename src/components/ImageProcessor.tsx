import uploadImg from '../assets/upload.svg';
import downloadImg from '../assets/download.svg';
import processImg from '../assets/process.svg';

import { type Config } from "@imgly/background-removal";
import { useCallback, useRef, useState } from "react";
import { PROCESS_MODES, type PROCESS_MODE } from "../constants/processors";
import { STORED_DEVICE_NAME, STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { DEVICES, FORMATS, MODELS, TYPES, type DEVICE_TYPES, type FORMAT_TYPES, type MODEL_TYPES } from "../constants/types";
import { useModal } from "../context/ModalContext";
import { checkWebGPUSupport } from '../utils/checkWebGPUSupport';
import { getBaseConfig } from '../utils/getBaseConfig';
import { useGlobalPaste } from '../hooks/useGlobalPaste';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
};

interface ProcessingConfig {
  configuration: Config;
  type: string;
};

export const ImageProcessor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>({ isProcessing: false, progress: 0, stage: 'idle' });
  const [file, setFile] = useState<File | undefined>();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { openModal } = useModal();

  const handlePastedFile = useCallback((file: File) => handleFile(file), []);
  useGlobalPaste(handlePastedFile)

  const handleFile = async (file: File) => {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactive if leaving the parent container, not entering a child node
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

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
      const blob = await targetFunction(file, config.configuration);
      setProcessedImage(URL.createObjectURL(blob));
    }
    catch (err: unknown) {
      console.error('Processing failed:', err);
      openModal({ title: 'Background removal failed!', message: `${err}` });
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
      config.configuration.proxyToWorker = config.configuration.device !== 'gpu';
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
    <main className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".png, .jpg, .jpeg, .webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
            e.target.value = ''; // Reset input so selecting the same file again triggers onChange
          }
        }}
      />

      {!originalImage ? (
        /* Initial Empty Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-white bg-neutral-800/60'
              : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/40'
          }`}
        >
          <p className="text-sm font-medium pointer-events-none">
            Click, drag & drop, or press Ctrl+V to paste
          </p>
        </div>
      ) : (
        /* Active Comparison Workspace */
        <div className="w-full space-y-6">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`min-w-0 border rounded-lg p-4 transition-colors cursor-pointer relative group flex flex-col ${
                isDragging
                  ? 'border-white border-dashed bg-neutral-800/50'
                  : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
              }`}
            >
              <div className="flex justify-between items-center mb-2 pointer-events-none">
                <span className="text-xs text-neutral-400 font-mono">SOURCE</span>
                <span className="text-[11px] text-neutral-500 font-mono group-hover:text-neutral-300 transition-colors hidden sm:inline">
                  Replace
                </span>
              </div>

              <div className="relative aspect-square w-full bg-neutral-950 rounded overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className={`absolute inset-0 w-full h-full object-contain p-2 pointer-events-none transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
                />

                {/* Drag Overlay Indicator */}
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 pointer-events-none">   
                    <img src={uploadImg} alt="Upload" className="h-8 w-8 mb-2"/>
                    <span className="text-xs font-mono text-white">Drop to replace</span>
                  </div>
                )}
              </div>
            </div>

            {/* RESULT Container */}
            <div className="min-w-0 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-400 font-mono">RESULT</span>
              </div>

              <div id="divProcessedResult" className="relative aspect-square w-full rounded overflow-hidden">
                {status.isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80">
                    <p className="text-xs font-mono text-neutral-400">Processing...</p>
                  </div>
                )}

                {processedImage && !status.isProcessing && (
                  <img src={processedImage} alt="Processed" className="absolute inset-0 w-full h-full object-contain p-2"/>
                )}
              </div>
            </div>
          </div>

          {/* Output buttons */}
          {processedImage && (
            <div className="flex justify-center">
              <button
                onClick={() => { if (file) processImage(file) }}
                disabled={status.isProcessing}
                className="inline-flex items-center gap-1 me-2 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <img src={processImg} alt="Process" className="w-5 h-5"/>
                <span>Process Again</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={status.isProcessing}
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <img src={downloadImg} alt="Download" className="w-5 h-5"/>
                <span>Download Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}