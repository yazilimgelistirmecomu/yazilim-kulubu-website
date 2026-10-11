import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { resolveRgb } from '@/utils/themeColor';

export function BlockchainBackground({ colorHex = 'var(--brand-primary)' }: { colorHex?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Parse color
    const colorRGB = resolveRgb(colorHex);

    // Particles array
    const particlesArray: Particle[] = [];
    const numberOfParticles = Math.min(window.innerWidth / 20, 80); // Increased density

    // Mouse position
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 150
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
      }

      draw() {
        if (!ctx) return;
        const s = this.size * 2; // scale up a bit for cubes

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.strokeStyle = `rgba(${colorRGB}, 0.8)`;
        ctx.fillStyle = `rgba(${colorRGB}, 0.1)`;
        ctx.lineWidth = 1;

        // Draw isometric hexagon (outer boundary of cube)
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.866, -s * 0.5);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.lineTo(-s * 0.866, -s * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Draw inner Y lines to complete the 3D cube illusion
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, s); // center to bottom
        ctx.moveTo(0, 0);
        ctx.lineTo(s * 0.866, -s * 0.5); // center to top-right
        ctx.moveTo(0, 0);
        ctx.lineTo(-s * 0.866, -s * 0.5); // center to top-left
        ctx.stroke();

        ctx.restore();
      }

      update() {
        // Bounce off edges
        if (this.x > canvas!.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas!.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        // Mouse interaction
        if (mouse.x != null && mouse.y != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;

            const directionX = forceDirectionX * force * 2;
            const directionY = forceDirectionY * force * 2;

            this.x -= directionX;
            this.y -= directionY;
          }
        }

        // Move particle
        this.x += this.directionX;
        this.y += this.directionY;

        this.draw();
      }
    }

    const init = () => {
      particlesArray.length = 0;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = (Math.random() * 2) + 1.5;
        const x = Math.random() * (canvas.width - size * 2) + size * 2;
        const y = Math.random() * (canvas.height - size * 2) + size * 2;
        const directionX = (Math.random() * 1.5) - 0.75;
        const directionY = (Math.random() * 1.5) - 0.75;

        particlesArray.push(new Particle(x, y, directionX, directionY, size));
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    };

    const connect = () => {
      let opacityValue = 1;

      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const distance =
            ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

          if (distance < (canvas.width / 8) * (canvas.height / 8)) {
            opacityValue = 1 - (distance / 25000);
            if (!ctx) return;
            ctx.strokeStyle = `rgba(${colorRGB}, ${opacityValue * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [theme, colorHex]); // Re-run effect when theme or color changes

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.75 }}
    />
  );
}
