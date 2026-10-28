import { useEffect, useState } from "react";
import { STORED_FORMAT_NAME, STORED_MODEL_NAME, STORED_QUALITY_NAME, STORED_TYPE_NAME } from "../constants/storedValues";
import { FORMATS, MODELS, TYPES } from "../constants/types";

export const Settings: React.FC = () => {
  const [model, setModel] = useState<string>('isnet_fp16');
  const [type, setType] = useState<string>('background');
  const [format, setFormat] = useState<string>('image/png');
  const [quality, setQuality] = useState<number>(0.5);

  useEffect(() => {
    const storedModel = localStorage.getItem(STORED_MODEL_NAME);
    if (storedModel && MODELS.has(storedModel)) {
      setModel(storedModel);
    }
    
    const storedType = localStorage.getItem(STORED_TYPE_NAME);
    if (storedType && TYPES.has(storedType)) {
      setType(storedType);
    }

    const storedFormat = localStorage.getItem(STORED_FORMAT_NAME);
    if (storedFormat && FORMATS.has(storedFormat)) {
      setFormat(storedFormat);
    }

    const storedQuality = localStorage.getItem(STORED_QUALITY_NAME);
    if (storedQuality && !isNaN(Number(storedQuality))) {
      setQuality(Number(storedQuality));
    }
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
    <div className="flex flex-row mb-3">
      <div>
        <label className="block text-center" htmlFor="model">Model</label>
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
        <label className="block text-center" htmlFor="type">Type</label>
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
        <label className="block text-center" htmlFor="format">Format</label>
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
        <label className="block text-center" htmlFor="quality">Quality</label>
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
  );
}