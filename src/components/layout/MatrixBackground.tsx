import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { resolveRgb } from '@/utils/themeColor';

export function MatrixBackground({ colorHex = 'var(--brand-primary)' }: { colorHex?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Characters for the matrix rain
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~'.split('');
    const fontSize = 28; // Increased from 16 to reduce columns
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    // Initialize drop positions
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      const isDark = document.documentElement.classList.contains('dark');

      // Semi-transparent background to create trail effect (increased fade for less noise)
      ctx.fillStyle = isDark ? 'rgba(11, 18, 48, 0.1)' : 'rgba(243, 244, 246, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parse hex color to rgb
      const rgb = resolveRgb(colorHex);

      // Set text color and font
      // In light mode, make text almost solid so it stands out against white background
      ctx.fillStyle = isDark ? `rgba(${rgb}, 0.55)` : `rgba(${rgb}, 0.95)`;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = characters[Math.floor(Math.random() * characters.length)];

        // Draw character (add sparsity by randomly skipping some draws)
        if (Math.random() > 0.3) {
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        // Reset drop to top randomly to create staggered effect (make them longer to reset)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        }

        // Move drop down
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 75); // Slowed down from 33ms to 75ms for relaxed flow

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme, colorHex]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40 dark:opacity-60"
    />
  );
}
