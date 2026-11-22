import lightModeSvg from "../assets/lightMode.svg";
import darkModeSvg from "../assets/darkMode.svg";
import spanishLightSvg from "../assets/spanishLight.svg";
import spanishDarkSvg from "../assets/spanishDark.svg";
import englishLightSvg from "../assets/englishLight.svg";
import englishDarkSvg from "../assets/englishDark.svg";

import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export const Header: React.FC = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const currentLanguage = i18n.resolvedLanguage as 'en' | 'es';
    setSelectedLanguage(currentLanguage);
  }, []);

  const handleChangeLanguage = (language: 'en' | 'es') => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
  };

  const getCurrentLanguageSvg = (): string => {
    if (selectedLanguage === 'en') {
      return darkMode ? spanishLightSvg : spanishDarkSvg;
    }
    else {
      return darkMode ? englishLightSvg : englishDarkSvg;
    }
  }

  return (
    <header className="mb-4 sm:mb-6 border-b border-neutral-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl w-full mx-auto">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
        {t('Header.title')}
      </h1>
      <p className="md:w-xl mx-auto text-justify dark:text-neutral-400 text-neutral-700 mt-2 text-sm">
        {t('Header.description')}
      </p>
      <div className="flex justify-end">
        <button className="me-2 cursor-pointer" onClick={toggleTheme}>
          <img 
            src={darkMode ? lightModeSvg : darkModeSvg} 
            alt={darkMode ? "Light mode" : "Dark mode"}
          />
        </button>
        <button className="cursor-pointer" onClick={() => handleChangeLanguage(selectedLanguage === 'en' ? 'es' : 'en')}>
          <img 
            src={getCurrentLanguageSvg()} 
            alt={selectedLanguage === 'en' ? 'English' : 'Spanish'}
          />
        </button>
      </div>
    </header>
  );
}