import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  children, 
  ...props 
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md shadow-brand-primary/20',
    secondary: 'bg-surface-raised text-text-primary hover:bg-surface-elevated border border-border-strong',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
    glass: 'bg-surface-glass backdrop-blur-md border border-border-subtle text-text-primary hover:bg-white/10 hover:border-border-strong'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  // Tailwind is not strictly used yet, but we will use style equivalents or rely on some utility classes if present, otherwise inline styles for the custom css variables.
  // Wait, the project doesn't seem to have Tailwind configured. Let's use standard CSS modules or classes that we define in globals, or inline variables for now.
  
  // Since we rely on globals.css, let's map the variants to standard CSS classes and we can define them in globals.css.
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
