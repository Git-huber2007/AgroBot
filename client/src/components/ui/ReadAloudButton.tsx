import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useTranslation } from 'react-i18next';

export interface ReadAloudButtonProps {
  text: string;
  lang?: string;
  className?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  lang = 'en',
  className = '',
}) => {
  const { isSpeaking, isSupported, speak, stop } = useSpeech();
  const { t } = useTranslation();

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (isSpeaking) {
          stop();
        } else {
          speak(text, lang);
        }
      }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors min-h-[44px] ${
        isSpeaking
          ? 'bg-leaf-100 text-leaf-800 border-leaf-300 animate-pulse'
          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
      } ${className}`}
      aria-label={isSpeaking ? t('common.stopReading', 'Stop Reading') : t('common.readAloud', 'Read Aloud')}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4 text-leaf-700" />
          <span>{t('common.stopReading', 'Stop Reading')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-leaf-600" />
          <span>{t('common.readAloud', 'Read Aloud')}</span>
        </>
      )}
    </button>
  );
};
