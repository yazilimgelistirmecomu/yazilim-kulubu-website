import { WifiOff, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface DatabaseErrorProps {
  message?: string;
  onRetry: () => void;
}

export function DatabaseError({ message, onRetry }: DatabaseErrorProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-16 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)] flex items-center justify-center mb-6 border border-[var(--color-danger)]/20 shadow-[0_0_20px_color-mix(in_srgb,var(--color-danger)_10%,transparent)]">
        <WifiOff className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-primary mb-3">Bağlantı Sorunu</h3>
      <p className="text-muted text-sm leading-relaxed mb-8">
        {message || "Veritabanı sunucusuyla bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."}
      </p>
      <Button onClick={onRetry} variant="primary" size="md" className="rounded-xl shadow-dynamic font-bold px-6">
        <RotateCcw className="w-4 h-4 mr-2 animate-pulse" />
        Yeniden Dene
      </Button>
    </div>
  );
}
