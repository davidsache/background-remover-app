import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { ImageProcessor } from './components/ImageProcessor';
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center">
      <Header/>
      <Settings/>
      <ImageProcessor/>
    </div>
  );
}

export default App