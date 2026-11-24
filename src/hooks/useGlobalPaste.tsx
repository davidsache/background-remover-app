import { useEffect } from "react";

/**
 * Allows images pasting.
 * @param onImageReceived Received image. 
 */
export function useGlobalPaste(onImageReceived: (file: File) => void) {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i=0; i<items.length; i++) {
        const item = items[i];

        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          
          if (file) {
            event.preventDefault();
            onImageReceived(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageReceived]);
}