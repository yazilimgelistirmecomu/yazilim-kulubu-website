import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  href?: string;
  asLink?: boolean;
  target?: string;
  rel?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  href,
  asLink = false,
  target,
  rel,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-dynamic font-bold btn-interactive focus-ring';
  
  const variantClasses = {
    primary: 'bg-[var(--brand-primary)] text-[var(--brand-text)] hover:bg-[var(--brand-hover)] hover:shadow-lg hover:shadow-[var(--brand-primary)]/20',
    secondary: 'bg-transparent border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 hover:border-[var(--brand-hover)]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
    destructive: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-[15px]',
    lg: 'px-8 py-4 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (asLink && href) {
    return (
      <Link to={href} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target={target || "_blank"} rel={rel || "noopener noreferrer"}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
