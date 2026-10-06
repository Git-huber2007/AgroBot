import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export interface AILoadingPanelProps {
  title?: string;
  tips?: string[];
  className?: string;
}

const DEFAULT_TIPS = [
  'Fetching live 7-day Open-Meteo weather forecast...',
  'Analyzing crop growth stage and thermal units...',
  'Balancing soil test nutrients with crop requirements...',
  'Synthesizing IPM cultural and biological treatment options...',
  'Cross-checking with national agronomic guidelines...',
  'Translating advice into plain non-technical language...',
];

export const AILoadingPanel: React.FC<AILoadingPanelProps> = ({
  title = 'Generating Agronomic Advice...',
  tips = DEFAULT_TIPS,
  className = '',
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [tips]);

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white border border-stone-200 shadow-card ${className}`}
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-leaf-100 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-leaf-600 animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 p-1 bg-sun-400 rounded-full text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-stone-900 font-display mb-2">{title}</h3>
      <div className="h-6 flex items-center justify-center">
        <p className="text-sm font-medium text-stone-600 animate-fadeIn key={currentTipIndex}">
          {tips[currentTipIndex]}
        </p>
      </div>

      <div className="w-48 bg-stone-100 rounded-full h-1.5 mt-6 overflow-hidden">
        <div className="bg-leaf-600 h-1.5 rounded-full animate-[shimmer_1.5s_infinite] w-2/3" />
      </div>
    </div>
  );
};
