import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES } from '@cropsage/shared';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = APP_LANGUAGES.find((l) => l.code === i18n.language) || APP_LANGUAGES[0]!;

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('cropsage_language', code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Change language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 transition-colors min-h-[44px]"
      >
        <Globe className="w-4 h-4 text-stone-500 shrink-0" />
        <span className="hidden xs:inline">{currentLang.nativeName}</span>
        <span className="xs:hidden">{currentLang.code.toUpperCase()}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-floating border border-stone-200 py-1.5 z-40 animate-fadeIn">
          <div className="px-3 py-1 text-xs font-semibold uppercase text-stone-400">
            Language / भाषा
          </div>
          <div className="max-h-60 overflow-y-auto">
            {APP_LANGUAGES.map((l) => {
              const isSelected = i18n.language.startsWith(l.code);
              return (
                <button
                  key={l.code}
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors ${
                    isSelected ? 'font-semibold text-leaf-700 bg-leaf-50/50' : 'text-stone-700'
                  }`}
                >
                  <div>
                    <p className="leading-tight">{l.nativeName}</p>
                    <p className="text-xs text-stone-400">{l.name}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-leaf-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
