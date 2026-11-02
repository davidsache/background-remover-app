import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { ImageProcessor } from './components/ImageProcessor';
import { ModalProvider } from './context/ModalContext';
import { Preload } from './components/Preload';
import { useState } from 'react';
import './App.css'

function App() {
  const [showPreload, setShowPreload] = useState<boolean>(true);

  return (
    <ModalProvider>
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center">
        <Header/>
        {showPreload && <Preload preloadFinished={() => setShowPreload(false)}/>}
        <Settings/>
        <ImageProcessor/>
      </div>
    </ModalProvider>
  );
}

export default App