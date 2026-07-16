'use client';

import React from 'react';

const variants = {
  default: 'bg-foreground text-background hover:bg-foreground/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-foreground/20 bg-background hover:bg-foreground/5',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-foreground/5',
  link: 'text-foreground underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';
  const variantStyles = variants[variant] || variants.default;
  const sizeStyles = sizes[size] || sizes.default;

  const combined = `${baseStyles} ${variantStyles} ${sizeStyles} ${className}`.trim();

  if (asChild) {
    return React.cloneElement(props.children, {
      className: `${props.children.props.className || ''} ${combined}`,
    });
  }

  return <button className={combined} {...props} />;
}
