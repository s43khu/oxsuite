'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'hacker';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-lg transition-all duration-300';
    
    const variants = {
      default: 'bg-black border border-green-500/30',
      elevated: 'bg-black border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.2)] hover:shadow-[0_0_30px_rgba(0,255,0,0.3)]',
      outlined: 'bg-transparent border-2 border-green-500',
      hacker: 'bg-black border-2 border-green-500 shadow-[0_0_15px_rgba(0,255,0,0.2)] hover:border-green-400 hover:shadow-[0_0_25px_rgba(0,255,0,0.4)]'
    };
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

