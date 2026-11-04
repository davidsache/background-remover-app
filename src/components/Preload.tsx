import { preload, type Config } from "@imgly/background-removal";
import { useEffect, useRef, useState } from "react";
import { getBaseConfig } from "../utils/getBaseConfig";
import { useModal } from "../context/ModalContext";

interface PreloadProps {
  preloadFinished: () => void;
}

export const Preload: React.FC<PreloadProps> = ({ preloadFinished }) => {
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'loading' | 'ready' | 'error'>('idle');
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const hasTriggered = useRef<boolean>(false);
  const { openModal } = useModal();

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
      openModal({ title: 'Preload failed', message: `${err}` });
      console.error('Preload failed:', err);
    }
  };
  
  return (
    <div className={`flex flex-col text-center overflow-hidden transition-all duration-500 ease-in-out ${visible ? 'opacity-100 max-h-40 mb-4' : 'opacity-0 max-h-0 mb-0 pointer-events-none'}`}>
      <h2 className="mb-1">Cache Initialization</h2>
      <p 
        className={`text-yellow-500 ${preloadStatus === 'error' ? 'underline cursor-pointer hover:text-yellow-300' : ''}`} 
        onClick={() => { if (preloadStatus === 'error') handlePreload(); }}
      >
        {preloadStatus === 'idle' && 'Pre-warm Model Pipeline'}
        {preloadStatus === 'loading' && `Downloading Weight: ${preloadProgress}%`}
        {preloadStatus === 'ready' && 'Models Cached in Browser'}
        {preloadStatus === 'error' && 'Retry Preload'}
      </p>
    </div>    
  );
}