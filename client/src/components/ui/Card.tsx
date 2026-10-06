import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'outline' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-white rounded-xl border border-stone-200/80 shadow-subtle',
    flat: 'bg-stone-50 rounded-xl border border-stone-200',
    outline: 'bg-transparent rounded-xl border border-stone-200',
    subtle: 'bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200 shadow-sm',
  };

  return (
    <div className={`${variants[variant]} p-5 transition-shadow ${className}`} {...props}>
      {children}
    </div>
  );
};
