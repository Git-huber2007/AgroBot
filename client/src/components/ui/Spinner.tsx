import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <Loader2 className={`animate-spin text-leaf-600 ${sizes[size]} ${className}`} />
      {label && <span className="text-sm text-stone-600 font-medium">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
};
