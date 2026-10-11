import { useCountdown } from '@/hooks/useCountdown';

export function EventCountdown({ date, className = 'mb-10' }: { date: string; className?: string }) {
  const countdown = useCountdown(date);
  return (
    <div className={className}>
      <div className="text-[10px] text-muted font-bold tracking-widest mb-3 font-mono">GERİ SAYIM</div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-[340px] sm:max-w-md">
        {[
          { label: 'GÜN', value: countdown.days },
          { label: 'SAAT', value: countdown.hours },
          { label: 'DAK', value: countdown.mins },
          { label: 'SAN', value: countdown.secs },
        ].map((unit) => (
          <div key={unit.label} className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center gap-1 bg-surface border border-default px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm">
            <span className="text-xl sm:text-2xl font-black font-mono text-primary">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-xs font-semibold text-muted font-mono">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
