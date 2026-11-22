import { useEffect, useState } from "react";
import { STORED_DEVICE_NAME, STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { DEVICES, FORMATS, MODELS, TYPES } from "../constants/types";
import { checkWebGPUSupport } from "../utils/checkWebGPUSupport";
import { useModal } from "../context/ModalContext";
import { useTranslation } from "react-i18next";

export const Settings: React.FC = () => {
  const [model, setModel] = useState<string>('isnet_fp16');
  const [type, setType] = useState<string>('background');
  const [format, setFormat] = useState<string>('image/png');
  const [quality, setQuality] = useState<number>(0.5);
  const [GPUSupported, setGPUSupported] = useState<boolean>(false);
  const [device, setDevice] = useState<string>('cpu');
  const { openModal } = useModal();
  const { t } = useTranslation();

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
    <div className="flex flex-row gap-1 flex-wrap mb-3 md:flex-nowrap">
      <div className="flex flex-col grow mt-2 md:mt-0">
        <label 
          className="w-fit m-auto cursor-pointer hover:underline dark:hover:text-yellow-200 hover:text-cyan-800" 
          htmlFor="model"
          onClick={() => openModal({ title: t("Settings.modelInfoTitle"), message: t("Settings.modelInfo") })}
        >
          {t("Settings.model")}
        </label>
        <select 
          id="model" 
          onChange={(e) => handleModelChange(e.target.value)}
          className="dark:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-500 hover:border-slate-400 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
          value={model}
        >
          <option value="isnet">{t("Settings.modelLarge")}</option>
          <option value="isnet_fp16">{t("Settings.modelMedium")}</option>
          <option value="isnet_quint8">{t("Settings.modelSmall")}</option>
        </select>
      </div>

      <div className="flex flex-col grow mt-2 md:mt-0">
        <label 
          className="w-fit m-auto cursor-pointer hover:underline dark:hover:text-yellow-200 hover:text-cyan-800" 
          htmlFor="type"
          onClick={() => openModal({ title: t("Settings.typeInfoTitle"), message: t("Settings.typeInfo") })}
        >
            {t("Settings.type")}
          </label>
        <select 
          id="type" 
          onChange={(e) => handleTypeChange(e.target.value)}
          className="dark:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-500 hover:border-slate-400 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
          value={type}
        >
          <option value="foreground">{t("Settings.typeForeground")}</option>
          <option value="background">{t("Settings.typeBackground")}</option>
          <option value="mask">{t("Settings.typeMask")}</option>
        </select>
      </div>

      <div className="flex flex-col grow mt-2 md:mt-0">
        <label 
          className="w-fit m-auto cursor-pointer hover:underline dark:hover:text-yellow-200 hover:text-cyan-800" 
          htmlFor="format"
          onClick={() => openModal({ title: t("Settings.formatInfoTitle"), message: t("Settings.formatInfo") })}
        >
          {t('Settings.format')}
        </label>
        <select 
          id="format" 
          onChange={(e) => handleFormatChange(e.target.value)}
          className="dark:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-500 hover:border-slate-400 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
          value={format}
        >
          <option value="image/png">PNG</option>
          <option value="image/webp">WEBP</option>
          <option value="image/jpeg">JPEG</option>
        </select>
      </div>

      <div className="flex flex-col grow mt-2 md:mt-0">
        <label 
          className="w-fit m-auto cursor-pointer hover:underline dark:hover:text-yellow-200 hover:text-cyan-800" 
          htmlFor="device"
          onClick={() => openModal({ title: t("Settings.deviceInfoTitle"), message: t("Settings.deviceInfo") })}
        >
          {t("Settings.device")}
        </label>
        <select 
          id="device" 
          disabled={!GPUSupported}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="dark:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-500 hover:border-slate-400 p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
          value={device}
        >
          <option value="cpu">CPU (WASM)</option>
          <option value="gpu">GPU (WebGPU)</option>
        </select>
      </div>

      <div className="flex flex-col grow mt-2 md:mt-0">
        <label 
          className="w-fit m-auto cursor-pointer hover:underline dark:hover:text-yellow-200 hover:text-cyan-800" 
          htmlFor="quality"
          onClick={() => openModal({ title: t("Settings.qualityInfoTitle"), message: t("Settings.qualityInfo") })}
        >
          {t('Settings.quality')}
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
          className="dark:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-500 hover:border-slate-400  p-2 mt-1 text-center text-sm rounded-md cursor-pointer"
        />
      </div>
    </div>
  );
}