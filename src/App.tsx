import { useRef, useState, type ChangeEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { removerConfig } from './config/removerConfig';
import './App.css'

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
}

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>({ isProcessing: false, progress: 0, stage: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selected file must be an image.');
      return;
    }

    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);

    const imageUrl = URL.createObjectURL(file);
    setOriginalImage(imageUrl);
    setProcessedImage(null);
    processImage(file);
  };

  const processImage = async (file: File) => {
    setStatus({ isProcessing: true, progress: 0, stage: 'Initializing engine...' });

    try {
      const blob = await removeBackground(file, {
        ...removerConfig,
        progress: (key: string, current: number, total: number) => {
          const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
          setStatus({ isProcessing: true, progress: percentage, stage: key });
        }
      });

      const resultUrl = URL.createObjectURL(blob);
      setProcessedImage(resultUrl);
    }
    catch (error) {
      console.error('Background removal failed:', error);
      alert('Processing failed. Check console for details.');
    }
    finally {
      setStatus({ isProcessing: false, progress: 100, stage: 'complete '});
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const anchor = document.createElement('a');
    anchor.href = processedImage;
    anchor.download = 'removed-background.png';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center">
        <header className="max-w-4xl w-full mb-4 text-center">
          <h1 className="text-3-xl font-bold tracking-tight">Client-Side Background Remover</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            In-browser inference using WebAssembly. No data uploaded to external servers.
          </p>
        </header>

        <main className="max-w-4xl w-flex flex-col items-center gap-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="text-center">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={status.isProcessing} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {status.isProcessing ? 'Processing...' : 'Upload Image'}
            </button>
          </div>

          {status.isProcessing && (
            <div className="w-full max-w-md bg-neutral-800 p-4 rounded-lg border border-neutral-700">
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
              <div
                className="w-full h-80 flex items-center justify-center rounded overflow-hidden"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #1f1f1f 25%, transparent 25%), linear-gradient(-45deg, #1f1f1f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f1f1f 75%), linear-gradient(-45deg, transparent 75%, #1f1f1f 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#141414'
                }}
              >
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
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
                >
                  Download PNG
                </button>
              )}
            </div>
          </div>

        </main>
      </div>
    </>
  )
}

export default App
