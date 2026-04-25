'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'px-2 py-0.5 text-xs': size === 'xs',
          'px-2.5 py-1 text-xs': size === 'sm',
          'px-3 py-1.5 text-sm': size === 'md',
          'px-4 py-2 text-base': size === 'lg',
        },
        {
          'bg-accent hover:bg-accent-emphasis border-transparent text-white':
            variant === 'primary',
          'bg-canvas-subtle hover:bg-canvas-overlay border-border text-fg':
            variant === 'secondary',
          'bg-danger-emphasis hover:bg-danger border-transparent text-white':
            variant === 'danger',
          'bg-transparent hover:bg-canvas-subtle border-transparent text-fg-muted hover:text-fg':
            variant === 'ghost',
          'bg-transparent border-border text-fg hover:border-accent-fg hover:text-accent-fg':
            variant === 'outline',
          'bg-[#2ea043] hover:bg-[#3fb950] border-transparent text-white':
            variant === 'success',
        },
        className
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
