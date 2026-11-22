import { preload, type Config } from "@imgly/background-removal";
import { useEffect, useRef, useState } from "react";
import { getBaseConfig } from "../utils/getBaseConfig";
import { useModal } from "../context/ModalContext";
import { useTranslation } from "react-i18next";

interface PreloadProps {
  preloadFinished: () => void;
}

export const Preload: React.FC<PreloadProps> = ({ preloadFinished }) => {
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'loading' | 'ready' | 'error'>('idle');
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const hasTriggered = useRef<boolean>(false);
  const { openModal } = useModal();
  const { t } = useTranslation();

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    handlePreload();
  }, []);

  useEffect(() => {
    if (preloadStatus === 'ready') {
      const fadeTimer = setTimeout(() => setVisible(false), 5000);
      const unmountTimer = setTimeout(() => preloadFinished(), 5500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [preloadStatus]);

  const handlePreload = async () => {
    setPreloadStatus('loading');
    setPreloadProgress(0);

    const config: Config = {
      ...getBaseConfig(),
      progress: (_key: string, current: number, total: number) => {
        if (total > 0) {
          const percent = Math.round((current / total) * 100);
          setPreloadProgress(percent);
        }
      },
    };

    try {
      await preload(config);
      setPreloadStatus('ready');
    }
    catch (err) {
      setPreloadStatus('error');
      openModal({ title: t("Preload.failedTitle"), message: `${err}` });
      console.error(t("Preload.failedTitle"), err);
    }
  };
  
  return (
    <div className={`flex flex-col text-center overflow-hidden transition-all duration-500 ease-in-out ${visible ? 'opacity-100 max-h-40 mb-4' : 'opacity-0 max-h-0 mb-0 pointer-events-none'}`}>
      <h2 className="mb-1 font-bold text-lg">{t("Preload.title")}</h2>
      <p 
        className={`dark:text-yellow-500 text-blue-500 font-bold transition-colors ${preloadStatus === 'error' ? 'underline cursor-pointer hover:text-yellow-300' : ''}`} 
        onClick={() => { if (preloadStatus === 'error') handlePreload(); }}
      >
        {preloadStatus === 'idle' && t("Preload.idle")}
        {preloadStatus === 'loading' && `${t("Preload.loading")} ${preloadProgress}%`}
        {preloadStatus === 'ready' && t("Preload.ready")}
        {preloadStatus === 'error' && t("Preload.error")}
      </p>
    </div>    
  );
}