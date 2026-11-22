import uploadSvg from '../assets/upload.svg';
import downloadSvg from '../assets/download.svg';
import processSvg from '../assets/process.svg';
import restartSvg from '../assets/restart.svg';

import { useCallback, useRef, useState } from "react";
import { PROCESS_MODES, type PROCESS_MODE } from "../constants/processors";
import { STORED_DEVICE_NAME, STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { DEVICES, FORMATS, MODELS, TYPES, type DEVICE_TYPES, type FORMAT_TYPES, type MODEL_TYPES } from "../constants/types";
import { useModal } from "../context/ModalContext";
import { checkWebGPUSupport } from '../utils/checkWebGPUSupport';
import { getBaseConfig } from '../utils/getBaseConfig';
import { useGlobalPaste } from '../hooks/useGlobalPaste';
import type { Config } from '@imgly/background-removal';
import { getBlobMetadata, type ImageMetadata } from '../utils/imageMetadata';
import { useTranslation } from 'react-i18next';

interface ProcessingConfig {
  configuration: Config;
  type: string;
}

export const ImageProcessor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [file, setFile] = useState<File | undefined>();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [resultMetadata, setResultMetadata] = useState<ImageMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { openModal } = useModal();
  const { t } = useTranslation();

  const handlePastedFile = useCallback((file: File) => handleFile(file), []);
  useGlobalPaste(handlePastedFile)

  const handleFile = async (file: File) => {
    if (!file) return;
    setFile(file);

    if (!await validateImageSignature(file)) {
      openModal({ title: t("Processor.alertTitle"), message: t("Processor.imageTypeError") });
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

  const handleRestart = () => {
    window.location.reload();
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
    const config = await getConfig();
    setIsProcessing(true);
    setResultMetadata(null);

    try {
      const targetFunction = PROCESS_MODES[config.type as PROCESS_MODE];
      const blob = await targetFunction(file, config.configuration);
      const meta = await getBlobMetadata(blob);

      setResultMetadata(meta);
      setProcessedImage(URL.createObjectURL(blob));
    }
    catch (err: unknown) {
      console.error(t("Processor.processingErrorTitle"), err);
      openModal({
        title: t("Processor.removalFailedTitle", { type: getRemovalType() }), 
        message: `${err}` 
      });
    }
    finally {
      setIsProcessing(false);
    }
  };

  const getRemovalType = (): string => {
    const storedType = localStorage.getItem(STORED_TYPE_NAME);
    if (storedType && TYPES.has(storedType)) {
      return t(`Settings.type${storedType.charAt(0).toUpperCase() + storedType.slice(1)}`)
    }

    return t("Settings.typeBackground");
  }

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
    <main className="mt-10 flex flex-col items-center justify-center max-w-2xl md:max-w-5xl w-full mx-auto">
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
          className={`w-full min-h-[120px] sm:min-h-[150px] lg:min-h-[250px] border-2 border-dashed rounded-xl p-6 sm:p-12 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
            isDragging
              ? 'dark:border-white border-dark dark:bg-neutral-800/60 bg-neutral-400/60'
              : 'border-neutral-700 hover:border-neutral-500 dark:bg-neutral-900/40 bg-neutral-300/40'
          }`}
        >
          <p className="text-sm sm:text-base font-medium pointer-events-none">
            {t("Processor.instructions")}
          </p>
        </div>
      ) : (
        /* Active Comparison Workspace */
        <div className="w-full space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`min-w-0 border rounded-xl p-3 sm:p-4 transition-colors cursor-pointer relative group flex flex-col ${
                isDragging
                  ? 'border-white border-dashed dark:bg-neutral-900/30 bg-neutral-400/50'
                  : 'dark:border-neutral-800 border-neutral-500 hover:border-neutral-600 dark:bg-neutral-950/30 bg-neutral-300/50'
              }`}
            >
              <div className="flex justify-between items-center mb-2 sm:mb-3 pointer-events-none gap-2">
                <span className="text-xs dark:text-neutral-400 font-mono tracking-wider">
                  {t("Processor.source")}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono group-hover:text-neutral-700 transition-colors truncate">
                  {t("Processor.replace")}
                </span>
              </div>

              <div className="relative w-full h-[300px] sm:h-[380px] md:h-[450px] lg:h-[550px] xl:h-[600px] bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={originalImage}
                  alt="Original"
                  className={`max-h-full max-w-full object-contain p-2 sm:p-4 pointer-events-none transition-opacity duration-200 ${isDragging ? 'opacity-25' : 'opacity-100'}`}
                />

                {/* Drag Overlay Indicator */}
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 pointer-events-none">   
                    <img src={uploadSvg} alt="Upload" className="h-8 w-8 mb-2 animate-bounce"/>
                    <span className="text-xs font-mono text-white">{t("Processor.dropReplace")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RESULT Container */}
            <div className="min-w-0 border dark:border-neutral-800 border-neutral-500 rounded-xl p-3 sm:p-4 transition-colors dark:bg-neutral-950/30 bg-neutral-300/50 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs dark:text-neutral-400 font-mono tracking-wider">
                  {t("Processor.result")}
                </span>
              </div>

              <div id="divProcessedResult" className="relative w-full h-[300px] sm:h-[380px] md:h-[450px] lg:h-[550px] xl:h-[600px] rounded-lg overflow-hidden flex items-center justify-center bg-neutral-950">
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm z-10">
                    <p className="text-xs sm:text-sm font-mono text-neutral-400">
                      {t("Processor.processing")}
                    </p>
                  </div>
                )}

                {processedImage && !isProcessing && (
                  <img 
                    src={processedImage} 
                    alt="Processed image" 
                    className="max-h-full max-w-full object-contain p-2 sm:p-4"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Output buttons */}
          {processedImage && (
            <>
              {resultMetadata && (
                <div className="flex justify-center items-center mb-3">
                  <span className="text-xs dark:text-neutral-400 font-mono tracking-wider me-2">
                    {t("Processor.result").toUpperCase()}:
                  </span>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-neutral-400">
                    <span className="px-1.5 py-0.5 dark:shadow-none shadow-sm/30 dark:bg-neutral-800 dark:text-neutral-200 bg-neutral-300 text-neutral-600 rounded transition-colors">
                      {resultMetadata.format}
                    </span>
                    <span className="px-1.5 py-0.5 dark:shadow-none shadow-sm/30 dark:bg-neutral-800 dark:text-neutral-200 bg-neutral-300 text-neutral-600 rounded transition-colors">
                      {resultMetadata.width} x {resultMetadata.height}
                    </span>
                    <span className="px-1.5 py-0.5 dark:shadow-none shadow-sm/30 dark:bg-neutral-800 dark:text-neutral-200 bg-neutral-300 text-neutral-600 rounded transition-colors">
                      {resultMetadata.sizeFormatted}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col justify-center sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  disabled={isProcessing}
                  className="inline-flex gap-1 px-3 py-2 dark:shadow-none shadow-sm/60 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
                >
                  <img src={restartSvg} alt="Restart" className="w-5 h-5"/>
                  <span>{t("Processor.restart")}</span>
                </button>
                <button
                  onClick={() => { if (file) processImage(file) }}
                  disabled={isProcessing}
                  className="inline-flex gap-1 px-3 py-2 dark:shadow-none shadow-sm/60 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
                >
                  <img src={processSvg} alt="Process" className="w-5 h-5"/>
                  <span>{t("Processor.processAgain")}</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="inline-flex gap-1 px-3 py-2 dark:shadow-none shadow-sm/60 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
                >
                  <img src={downloadSvg} alt="Download" className="w-5 h-5"/>
                  <span>{t("Processor.download")}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}