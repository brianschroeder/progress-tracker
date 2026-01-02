import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-soft hover:shadow-medium';
  
  const variants = {
    default: 'bg-accent text-white hover:bg-accent-light',
    outline: 'border-2 border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
    success: 'bg-success text-white hover:bg-success/90',
    warning: 'bg-warning text-white hover:bg-warning/90',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
