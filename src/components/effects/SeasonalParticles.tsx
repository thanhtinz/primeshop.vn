import { useEffect, useRef, useState } from 'react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  emoji?: string;
  image?: HTMLImageElement;
}

type ParticleType = 'snow' | 'hearts' | 'leaves' | 'stars' | 'confetti' | 'sakura' | 'fireworks' | 'none';

const particleEmojis: Record<ParticleType, string[]> = {
  snow: ['❄️', '❅', '❆', '✧'],
  hearts: ['❤️', '💕', '💖', '💗', '💓'],
  leaves: ['🍂', '🍁', '🍃', '🌿'],
  stars: ['⭐', '✨', '💫', '🌟'],
  confetti: ['🎉', '🎊', '✨', '🎈'],
  sakura: ['🌸', '💮', '🌺', '✿'],
  fireworks: ['🎆', '🎇', '✨', '💥'],
  none: [],
};

export function SeasonalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  
  const { data: particleSettings } = useSiteSetting('seasonal_particles');
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [particleType, setParticleType] = useState<ParticleType>('none');
  const [particleCount, setParticleCount] = useState(50);
  const [particleSpeed, setParticleSpeed] = useState(1);
  const [customImage, setCustomImage] = useState<string>('');
  const customImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (particleSettings && typeof particleSettings === 'object' && !Array.isArray(particleSettings)) {
      const settings = particleSettings as Record<string, unknown>;
      setIsEnabled(Boolean(settings.enabled) || false);
      setParticleType((settings.type as ParticleType) || 'none');
      setParticleCount(Number(settings.count) || 50);
      setParticleSpeed(Number(settings.speed) || 1);
      setCustomImage((settings.customImage as string) || '');
    }
  }, [particleSettings]);

  // Load custom image
  useEffect(() => {
    if (customImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        customImageRef.current = img;
      };
      img.onerror = () => {
        customImageRef.current = null;
      };
      img.src = customImage;
    } else {
      customImageRef.current = null;
    }
  }, [customImage]);

  useEffect(() => {
    if (!isEnabled || particleType === 'none') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

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

    // Initialize particles
    const emojis = particleEmojis[particleType];
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 20 + 16,
      speedX: (Math.random() - 0.5) * particleSpeed * 2,
      speedY: Math.random() * particleSpeed * 2 + 1,
      opacity: Math.random() * 0.4 + 0.6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 3,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX * particleSpeed;
        particle.y += particle.speedY * particleSpeed;
        particle.rotation += particle.rotationSpeed;

        // Add sway for some particle types
        if (particleType === 'snow' || particleType === 'leaves' || particleType === 'sakura') {
          particle.x += Math.sin(particle.y * 0.01) * 0.5;
        }

        // Reset particle when it goes off screen
        if (particle.y > canvas.height) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        
        // Use custom image if available, otherwise use emoji
        if (customImageRef.current) {
          const imgSize = particle.size * 1.5;
          ctx.drawImage(customImageRef.current, -imgSize/2, -imgSize/2, imgSize, imgSize);
        } else {
          ctx.font = `${particle.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(particle.emoji || '❄️', 0, 0);
        }
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isEnabled, particleType, particleCount, particleSpeed, customImage]);

  if (!isEnabled || particleType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none w-full h-full"
      style={{ 
        mixBlendMode: 'normal',
        zIndex: 9999
      }}
    />
  );
}
