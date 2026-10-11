import { useEffect, useState } from 'react';

const ZERO = { days: 0, hours: 0, mins: 0, secs: 0 };

/** Verilen tarihe kalan süre; saniyede bir güncellenir, unmount'ta temizlenir. */
export function useCountdown(target?: string | Date | null) {
  const [countdown, setCountdown] = useState(ZERO);

  useEffect(() => {
    if (!target) {
      setCountdown(ZERO);
      return;
    }
    const targetMs = new Date(target).getTime();
    const update = () => {
      const diff = targetMs - Date.now();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        });
      } else {
        setCountdown(ZERO);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return countdown;
}
