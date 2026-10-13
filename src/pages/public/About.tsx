import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useState, useEffect } from 'react';
import { BlockchainBackground } from '@/components/layout/BlockchainBackground';
import { MatrixBackground } from '@/components/layout/MatrixBackground';
import { supabase } from '@/api/config';

interface BranchData {
  name: string;
  image: string;
  cmd: string;
  descLines: string[];
  tech: string[];
  color: string;
  colorBg: string;
  darkInvert?: boolean;
}

const branchesData: BranchData[] = [
  {
    name: 'Web Geliştirme',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    cmd: '$ kollar --info --web',
    descLines: [
      '> Kol : Web Geliştirme',
      '> Frontend ve Backend mimarileri tasarlıyoruz.',
      '> Gerçek ürünler geliştirip canlıya alıyoruz.'
    ],
    tech: ['React', 'Node.js', 'Next.js', 'TypeScript', 'PostgreSQL'],
    color: 'var(--branch-web)',
    colorBg: 'color-mix(in srgb, var(--branch-web) 13%, transparent)',
  },
  {
    name: 'Mobil Geliştirme',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg',
    cmd: '$ kollar --info --mobile',
    descLines: [
      '> Kol : Mobil Geliştirme',
      '> iOS ve Android cross-platform uygulamalar.',
      '> Uygulama marketlerinde yer alacak projeler üretiyoruz.'
    ],
    tech: ['Flutter', 'Dart', 'Swift', 'Kotlin', 'Firebase'],
    color: 'var(--branch-mobile)',
    colorBg: 'color-mix(in srgb, var(--branch-mobile) 13%, transparent)',
  },
  {
    name: 'Oyun Geliştirme',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg',
    cmd: '$ kollar --info --game',
    descLines: [
      '> Kol : Oyun Geliştirme',
      '> 2D ve 3D dünyalar inşa ediyoruz.',
      '> Game Jam maratonlarında çalışan prototipler üretiyoruz.'
    ],
    tech: ['Unity', 'C#', 'Blender', 'Unreal Engine', 'C++'],
    color: 'var(--branch-game)',
    colorBg: 'color-mix(in srgb, var(--branch-game) 13%, transparent)',
    darkInvert: true,
  },
  {
    name: 'Blockchain',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/solidity/solidity-original.svg',
    cmd: '$ kollar --info --chain',
    descLines: [
      '> Kol : Blockchain',
      '> Akıllı sözleşmeler, DeFi, DAO yapıları.',
      '> Merkeziyetsiz sistemler inşa ediyoruz.'
    ],
    tech: ['Solidity', 'Ethereum', 'Web3.js', 'Hardhat'],
    color: 'var(--branch-blockchain)',
    colorBg: 'color-mix(in srgb, var(--branch-blockchain) 13%, transparent)',
    darkInvert: true,
  },
];

function TypewriterText({ text, delay = 0, onComplete }: { text: string, delay?: number, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return <span>{displayedText}</span>;
}

function TerminalInner({ branch }: { branch: BranchData }) {
  const [linesRevealed, setLinesRevealed] = useState(0);

  return (
    <div className="flex flex-col justify-between h-full flex-1">
      <div>
        {/* Command Line */}
        <div className="mb-6 text-muted">
          <span className="text-[var(--brand-primary)] font-bold mr-2">$</span>
          <TypewriterText text={branch.cmd} delay={0} onComplete={() => setLinesRevealed(1)} />
        </div>

        {/* Description Lines */}
        <div className="space-y-4 mb-8 min-h-[110px]">
          {branch.descLines.map((line, idx) => (
            <div key={idx} className="text-primary font-medium tracking-wide leading-relaxed">
              {linesRevealed > idx && (
                <TypewriterText
                  text={line}
                  delay={100}
                  onComplete={() => setLinesRevealed(prev => Math.max(prev, idx + 2))}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <motion.div
        className="flex flex-wrap gap-3 mt-auto pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: linesRevealed > branch.descLines.length ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {branch.tech.map(tech => (
          <span
            key={tech}
            className="px-3 py-1.5 text-xs font-mono border border-default bg-surface text-muted rounded-md cursor-default"
          >
            {tech}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TerminalContent({ branch }: { branch: BranchData }) {
  return (
    <div className="w-full bg-[var(--terminal-bg)] rounded-xl border border-default shadow-xl overflow-hidden flex flex-col transition-colors duration-300">
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-3 bg-[var(--terminal-bar)] border-b border-default transition-colors duration-300">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[var(--color-danger)] border border-black/10 dark:border-transparent"></div>
          <div className="w-3 h-3 rounded-full bg-[var(--color-warning)] border border-black/10 dark:border-transparent"></div>
          <div className="w-3 h-3 rounded-full bg-[var(--color-success)] border border-black/10 dark:border-transparent"></div>
        </div>
        <div className="text-xs font-mono text-muted tracking-widest uppercase transition-opacity duration-300">
          {branch.name}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-8 md:p-10 font-mono text-sm md:text-base text-left flex-1 transition-colors duration-300 min-h-[330px] md:min-h-[370px] flex flex-col">
        <TerminalInner key={branch.name} branch={branch} />
      </div>
    </div>
  );
}

export function BranchesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeBranch = branchesData[activeIndex];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % branchesData.length);
    }, 10000);  // terminalin tam halinin ekranda ne kadar süre kalacağı
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="relative py-16 px-4 sm:px-8 lg:px-20 bg-surface border-y border-default overflow-hidden transition-colors duration-500">

      {/* Dynamic Backgrounds Per Branch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          {/* 1. Web: Matrix / Code Rain */}
          {activeBranch.name.includes('Web') && (
            <div className="absolute inset-0 opacity-40">
              <MatrixBackground colorHex={activeBranch.color} />
            </div>
          )}

          {/* 2. Mobil: Glassmorphism Floating Orbs */}
          {activeBranch.name.includes('Mobil') && (
            <>
              <motion.div
                animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0], scale: [1, 1.1, 0.9, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-[40%_60%_70%_30%] mix-blend-multiply dark:mix-blend-screen opacity-40 dark:opacity-20 blur-[80px]"
                style={{ backgroundColor: activeBranch.color }}
              />
              <motion.div
                animate={{ x: [0, -100, 100, 0], y: [0, 100, -100, 0], scale: [1, 0.9, 1.1, 1] }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-[60%_40%_30%_70%] mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-15 blur-[100px]"
                style={{ backgroundColor: activeBranch.color }}
              />
              <motion.div
                animate={{ x: [0, 50, -50, 0], y: [0, 50, -50, 0], scale: [0.8, 1.1, 0.9, 0.8] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-20 dark:opacity-10 blur-[90px]"
                style={{ backgroundColor: activeBranch.color }}
              />
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')" }}
              />
            </>
          )}

          {/* 3. Oyun: 3D Cyberpunk Neon Grid */}
          {activeBranch.name.includes('Oyun') && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center" style={{ perspective: '800px' }}>
              <div
                className="absolute top-[40%] w-[200%] h-[150%] opacity-20 dark:opacity-40"
                style={{
                  transformOrigin: 'top center',
                  transform: 'rotateX(75deg)',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                }}
              >
                {/* GPU Accelerated translateY for buttery smooth infinite scroll */}
                <motion.div
                  animate={{ y: [0, 50] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0"
                  style={{
                    top: '-50px',
                    height: 'calc(100% + 50px)',
                    backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${activeBranch.color} 38%, transparent) 2px, transparent 2px), linear-gradient(to bottom, color-mix(in srgb, ${activeBranch.color} 38%, transparent) 2px, transparent 2px)`,
                    backgroundSize: '50px 50px',
                  }}
                />
              </div>
            </div>
          )}

          {/* 4. Blockchain: Connected Nodes Network */}
          {activeBranch.name.includes('Blockchain') && (
            <div className="absolute inset-0 opacity-60">
              <BlockchainBackground colorHex={activeBranch.color} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-[960px] mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Kollarımız</h2>
        </div>

        {/* Centered and enlarged terminal */}
        <div
          className="w-full max-w-2xl mx-auto flex flex-col items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <TerminalContent branch={branchesData[activeIndex]} />
        </div>

        {/* Indicator Dots */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {branchesData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${idx === activeIndex
                ? 'w-8 bg-[var(--brand-primary)]'
                : 'w-2.5 bg-[var(--border-strong)] hover:bg-[var(--text-subtle)]'
                }`}
              aria-label={`Slayt ${idx + 1}`}
            />
          ))}
        </div>

        <div className="mt-10 sm:mt-16 flex justify-center">
          <Button asLink href="/ekibimiz" variant="secondary" className="rounded-dynamic border-default">
            Tüm Ekibi Gör <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function About() {
  const [aboutData, setAboutData] = useState({
    title: 'Sıralarda Değil, Projelerde Büyüyoruz.',
    mission: 'Yazılım Geliştirme Kulübü, kod yazmanın sadece dersliklerde değil, bir ekip ruhuyla ve gerçek projelerle öğrenileceğine inanan öğrenciler tarafından kuruldu. Amacımız; kendi ufak projelerinden ulusal yarışmalara kadar uzanan bu yolda, beraber üretecek ekip arkadaşı bulmakta zorlanan herkesi tek bir çatı altında toplamak.',
    target: 'Bugün 800’e yakın üyemizle; Oyun Geliştirme, Web, Mobil ve Blockchain kollarında sadece teoriyi değil, pratiği konuşuyoruz. ÇOMÜ’nün teknik potansiyelini Game Jam’ler, Hackathon’lar ve workshoplarla sokağa, teknoparklara ve yarışma arenalarına taşıyoruz.',
    vision: 'Bizler sadece öğrenmiyoruz; Çanakkale’den küresel teknoloji dünyasına uzanacak bir topluluğun temellerini beraber atıyoruz.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200'
  });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) return;
      if (data && data.length > 0) {
        const settingsMap: any = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        setAboutData(prev => ({
          title: settingsMap['about_title'] || prev.title,
          mission: settingsMap['about_mission'] || prev.mission,
          target: settingsMap['about_target'] || prev.target,
          vision: settingsMap['about_vision'] || prev.vision,
          imageUrl: settingsMap['about_image_url'] || prev.imageUrl
        }));
      }
    } catch (e) {
      console.error("About data fetch error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-page transition-colors duration-300">
      {/* Who We Are Section */}
      <section className="pt-28 pb-16 px-4 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 tracking-tight">{aboutData.title}</h2>
            <div className="space-y-5 text-base sm:text-lg text-muted leading-relaxed font-medium">
              <p className="whitespace-pre-line">
                <span className="font-mono text-[var(--brand-primary)] font-bold mr-2">[misyon]</span>
                {aboutData.mission}
              </p>
              <p className="whitespace-pre-line">
                <span className="font-mono text-[var(--brand-primary)] font-bold mr-2">[hedef]</span>
                {aboutData.target}
              </p>
              <p className="whitespace-pre-line">
                <span className="font-mono text-[var(--brand-primary)] font-bold mr-2">[vizyon]</span>
                {aboutData.vision}
              </p>
            </div>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative group w-full max-w-md mx-auto lg:max-w-none"
          >
            <div className="relative aspect-[4/3] rounded-dynamic overflow-hidden border border-default shadow-dynamic bg-surface">
              <img
                src={aboutData.imageUrl}
                alt="Hakkımızda Ekip Görseli"
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-page/80 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      <BranchesSection />
    </div>
  );
}