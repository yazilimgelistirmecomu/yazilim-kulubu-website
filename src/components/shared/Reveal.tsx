import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** Kaydırınca beliren hafif giriş (mevcut kartlardaki fade + 20px yukarı kayma). Bir kez çalışır. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
