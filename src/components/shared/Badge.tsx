import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'brand' | 'web' | 'mobile' | 'game' | 'blockchain' | 'member' | 'neutral';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'brand', children, className = '' }: BadgeProps) {
  const variantClasses = {
    brand: 'text-[var(--brand-primary)] border-l-[var(--brand-primary)] bg-[var(--brand-primary)]/5',
    web: 'text-[var(--branch-web)] border-l-[var(--branch-web)] bg-[var(--branch-web)]/5',
    mobile: 'text-[var(--branch-mobile)] border-l-[var(--branch-mobile)] bg-[var(--branch-mobile)]/5',
    game: 'text-[var(--branch-game)] border-l-[var(--branch-game)] bg-[var(--branch-game)]/5',
    blockchain: 'text-[var(--branch-blockchain)] border-l-[var(--branch-blockchain)] bg-[var(--branch-blockchain)]/5',
    member: 'text-[var(--brand-secondary)] border-l-[var(--brand-secondary)] bg-[var(--brand-secondary)]/5',
    neutral: 'text-muted border-l-default bg-surface'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-transparent border-l-2 text-[10px] font-bold uppercase tracking-widest font-mono shadow-sm backdrop-blur-sm ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
