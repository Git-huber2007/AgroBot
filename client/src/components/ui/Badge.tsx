import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'leaf' | 'sun' | 'soil' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'leaf',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    leaf: 'bg-leaf-50 text-leaf-800 border-leaf-200',
    sun: 'bg-sun-50 text-sun-900 border-sun-200',
    soil: 'bg-soil-100 text-soil-900 border-soil-300',
    red: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    gray: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide uppercase',
  };

  return (
    <span
      className={`inline-flex items-center justify-center border ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
