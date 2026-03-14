import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'purple' | 'blue' | 'merged';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        size === 'sm' ? 'px-1.5 py-0 text-xs' : 'px-2.5 py-0.5 text-xs',
        {
          'bg-canvas-subtle text-fg-muted border-border': variant === 'default',
          'bg-success-muted text-success-fg border-success': variant === 'success',
          'bg-danger-muted text-danger-fg border-danger': variant === 'danger',
          'bg-warning-muted text-warning-fg border-warning': variant === 'warning',
          'bg-purple/20 text-purple-fg border-purple/50': variant === 'purple',
          'bg-accent-muted text-accent-fg border-accent/50': variant === 'blue',
          'bg-purple/30 text-purple-fg border-purple/60': variant === 'merged',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
