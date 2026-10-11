import { motion } from 'motion/react';

export function GlowingOrbsBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-page">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.3] dark:opacity-20 z-10" 
        style={{ 
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjYWFhIiBmaWxsLW9wYWNpdHk9IjAuNSIgLz4KPC9zdmc+')", 
          maskImage: 'linear-gradient(to bottom, white 20%, transparent 100%)', 
          WebkitMaskImage: 'linear-gradient(to bottom, white 20%, transparent 100%)' 
        }} 
      />
      
      {/* Orb 1: Primary Brand Color (Deep Purple) */}
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, -150, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full bg-[var(--brand-primary)] opacity-20 dark:opacity-30 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
      />
      
      {/* Orb 2: Secondary Brand Color (Light Blue) */}
      <motion.div
        animate={{
          x: [0, -150, 100, 0],
          y: [0, 150, -100, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full bg-[var(--brand-accent)] opacity-20 dark:opacity-30 blur-[150px] mix-blend-multiply dark:mix-blend-screen"
      />

      {/* Orb 3: Accent Color (Mid Blue) to give it a modern tech vibe */}
      <motion.div
        animate={{
          x: [0, 100, -150, 0],
          y: [0, 100, -50, 0],
          scale: [1, 1.3, 0.8, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full bg-[var(--brand-secondary)] opacity-10 dark:opacity-20 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
      />
    </div>
  );
}
