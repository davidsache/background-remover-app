import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { ImageProcessor } from './components/ImageProcessor';
import { ModalProvider } from './context/ModalContext';
import { Preload } from './components/Preload';
import { useEffect, useState } from 'react';
import { STORED_THEME_NAME } from './constants/storedValues';
import { ThemeContext } from './context/ThemeContext';
import './App.css'

function App() {
  const [showPreload, setShowPreload] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORED_THEME_NAME);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialModeIsDark = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);

    setDarkMode(initialModeIsDark);

    if (initialModeIsDark) {
      document.documentElement.classList.add('dark');
    }
    else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORED_THEME_NAME, 'dark');
    }
    else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORED_THEME_NAME, 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ModalProvider>
        <div className="min-h-screen dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-200 text-neutral-800 p-8 flex flex-col items-center">
          <Header/>
          {showPreload && <Preload preloadFinished={() => setShowPreload(false)}/>}
          <Settings/>
          <ImageProcessor/>
        </div>
      </ModalProvider>
    </ThemeContext.Provider>
  );
}

export default App