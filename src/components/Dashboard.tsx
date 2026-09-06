import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileEdit,
  MessageSquare,
  PenTool,
  HelpCircle,
  AlertTriangle,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Video,
  Linkedin,
} from 'lucide-react';
import { ThreeCanvas } from './ThreeCanvas';
import { HowItWorksModal } from './HowItWorksModal';

const ResumeAnalyzer = React.lazy(() => import('./ResumeAnalyzer').then(m => ({ default: m.ResumeAnalyzer })));
const MockInterview = React.lazy(() => import('./MockInterview').then(m => ({ default: m.MockInterview })));
const WritingEnhancer = React.lazy(() => import('./WritingEnhancer').then(m => ({ default: m.WritingEnhancer })));
const LinkedInAnalyzer = React.lazy(() => import('./LinkedInAnalyzer').then(m => ({ default: m.LinkedInAnalyzer })));
const ResumeBuilder = React.lazy(() => import('./ResumeBuilder'));

const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`shimmer rounded-xl ${className}`} />
);

const ResumeSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
    <ShimmerBlock className="h-10 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6">
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="h-24 w-full" />
        <ShimmerBlock className="h-32 w-full" />
      </div>
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6">
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="h-12 w-full" />
        <ShimmerBlock className="h-12 w-full" />
        <ShimmerBlock className="h-12 w-full" />
      </div>
    </div>
  </div>
);

const InterviewSkeleton: React.FC = () => (
  <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
    <ShimmerBlock className="h-10 w-1/3 mx-auto" />
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
      <ShimmerBlock className="h-6 w-1/4" />
      <ShimmerBlock className="h-4 w-3/4" />
      <ShimmerBlock className="h-4 w-1/2" />
      <ShimmerBlock className="h-12 w-1/3" />
    </div>
  </div>
);

const WritingSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
    <ShimmerBlock className="h-10 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
        <ShimmerBlock className="h-6 w-1/3" />
        <ShimmerBlock className="h-48 w-full" />
      </div>
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
        <ShimmerBlock className="h-6 w-1/3" />
        <ShimmerBlock className="h-48 w-full" />
      </div>
    </div>
  </div>
);

const BuilderSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
    <ShimmerBlock className="h-10 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6">
        <ShimmerBlock className="h-6 w-full" />
        <ShimmerBlock className="h-12 w-full" />
        <ShimmerBlock className="h-12 w-full" />
        <ShimmerBlock className="h-32 w-full" />
      </div>
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6">
        <ShimmerBlock className="h-6 w-1/2" />
        <ShimmerBlock className="h-48 w-full" />
        <ShimmerBlock className="h-24 w-full" />
      </div>
    </div>
  </div>
);

const LinkedInSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
    <ShimmerBlock className="h-10 w-1/4" />
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6">
      <ShimmerBlock className="h-6 w-1/2" />
      <ShimmerBlock className="h-24 w-full" />
      <ShimmerBlock className="h-32 w-full" />
    </div>
  </div>
);

const staggerHero = (i: number) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] } },
});

export const Dashboard: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'home' | 'resume' | 'interview' | 'writing' | 'builder' | 'linkedin'>('home');
  const [showBanner, setShowBanner] = useState(true);
  const [apiStatus, setApiStatus] = useState<'loading' | 'simulated' | 'live'>('loading');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const scoreSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (!scoreAnimated || matchScore >= 87) return;
    const iv = setInterval(() => setMatchScore(p => {
      if (p >= 87) { clearInterval(iv); return 87; }
      return p + 1;
    }), 15);
    return () => clearInterval(iv);
  }, [scoreAnimated, matchScore]);

  useEffect(() => {
    fetch('/api/mode')
      .then(res => res.json())
      .then(data => setApiStatus(data.mode === 'live' ? 'live' : 'simulated'))
      .catch(() => setApiStatus('simulated'));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const heroHeight = heroRef.current?.offsetHeight ?? window.innerHeight;
      setScrolledPastHero(window.scrollY > heroHeight - 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!scoreSectionRef.current || prefersReduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScoreAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(scoreSectionRef.current);
    return () => observer.disconnect();
  }, [prefersReduced]);

  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const n = isMobile ? 20 : 60;
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; color: string }[] = [];

    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.15,
        opacity: Math.random() * 0.25 + 0.1,
        color: Math.random() > 0.5 ? '#4F8EF7' : '#A78BFA',
      });
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReduced]);

  const handleNavClick = (tool: 'home' | 'resume' | 'interview' | 'writing' | 'builder' | 'linkedin') => {
    setActiveTool(tool);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToTools = () => {
    toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cardConfig = [
    {
      id: 'resume' as const,
      gradient: 'gradient-banner-resume',
      accent: '#4F8EF7',
      darker: '#3B6FD4',
      orbColor: '#4F8EF7',
      icon: FileText,
      tag: 'Most Popular',
      title: 'Resume Analyzer',
      desc: 'Upload your resume (PDF/DOCX) and a target position. Get match score updates, missing skill diagnostics, and direct bullet point rewrites.',
      btn: 'Analyze My Resume',
    },
    {
      id: 'interview' as const,
      gradient: 'gradient-banner-interview',
      accent: '#A78BFA',
      darker: '#7C5BD4',
      orbColor: '#A78BFA',
      icon: MessageSquare,
      tag: null,
      title: 'Mock Interview',
      desc: 'Configure target roles and difficulty levels. Engage in a 7-question interview flow with individual answer grading and a final scorecard.',
      btn: 'Start Interview',
    },
    {
      id: 'writing' as const,
      gradient: 'gradient-banner-writing',
      accent: '#10B981',
      darker: '#059669',
      orbColor: '#10B981',
      icon: PenTool,
      tag: null,
      title: 'Writing Enhancer',
      desc: 'Optimize professional emails, cover letters, or LinkedIn pitches. Get a side-by-side diff showing tone and clarity improvements.',
      btn: 'Enhance My Writing',
    },
    {
      id: 'builder' as const,
      gradient: 'gradient-banner-builder',
      accent: '#60A5FA',
      darker: '#3B82F6',
      orbColor: '#60A5FA',
      icon: FileEdit,
      tag: 'New',
      title: 'Resume Builder',
      desc: 'Build a professional resume from scratch or enhance your existing one. Download as a clean PDF instantly.',
      btn: 'Build My Resume →',
    },
    {
      id: 'linkedin' as const,
      gradient: 'gradient-banner-linkedin',
      accent: '#0EA5E9',
      darker: '#0284C7',
      orbColor: '#0EA5E9',
      icon: Linkedin,
      tag: null,
      title: 'LinkedIn Optimizer',
      desc: 'Get your LinkedIn profile found by recruiters. Section-by-section AI optimization with ready-to-copy improvements.',
      btn: 'Optimize Profile →',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] relative font-inter overflow-x-hidden w-full">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />
      </div>

      {/* Dot grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-dot-grid" />

      {/* Subtle noise texture */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-noise opacity-[0.03]" />

      {/* Diagonal gradient lines */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(79,142,247,0.06)" strokeWidth="0.5" />
          <line x1="20%" y1="0" x2="100%" y2="80%" stroke="rgba(167,139,250,0.04)" strokeWidth="0.5" />
          <line x1="0" y1="30%" x2="80%" y2="100%" stroke="rgba(79,142,247,0.05)" strokeWidth="0.5" />
          <line x1="60%" y1="0" x2="100%" y2="40%" stroke="rgba(16,185,129,0.03)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Floating particle canvas */}
      <canvas id="particle-canvas" className="fixed inset-0 pointer-events-none z-0" />

      {/* Simulation banner */}
      {apiStatus === 'simulated' && showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(245,158,11,0.08)] border-b border-[rgba(245,158,11,0.15)] px-6 py-[10px] text-center text-sm text-[#F59E0B] font-medium flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 mx-auto">
            <AlertTriangle size={16} />
            ⚡ Simulation Mode — Add GEMINI_API_KEY for live AI
          </span>
          <button onClick={() => setShowBanner(false)} className="hover:text-[#F59E0B]/80 cursor-pointer flex-shrink-0" aria-label="Dismiss banner">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navbar */}
      <header
        className={`fixed left-0 right-0 z-40 h-16 transition-all duration-300 ${
          scrolledPastHero || activeTool !== 'home'
            ? 'navbar-blur border-b border-white/5'
            : 'bg-transparent border-b border-transparent'
        } ${apiStatus === 'simulated' && showBanner ? 'top-[42px]' : 'top-0'}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div onClick={() => handleNavClick('home')} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles className="text-white" size={16} />
            </div>
            <span className="text-[22px] font-bold font-syne tracking-tight text-[#F9FAFB]">
              Hire<span className="text-gradient">Boost</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {cardConfig.map(c => (
              <button
                key={c.id}
                onClick={() => handleNavClick(c.id)}
                className="relative text-sm font-medium transition-colors duration-200 cursor-pointer pb-1"
                style={{ color: activeTool === c.id ? '#F9FAFB' : '#9CA3AF' }}
              >
                {c.id === 'resume' ? 'Resume Check' : c.id === 'interview' ? 'Mock Interview' : c.id === 'writing' ? 'Writing Check' : 'LinkedIn'}
                {activeTool === c.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.darker})` }} />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setIsHowItWorksOpen(true)} className="text-sm font-medium text-[#9CA3AF] hover:text-[#F9FAFB] flex items-center gap-1.5 cursor-pointer transition-colors">
              <HelpCircle size={16} /> How it works
            </button>
            <div className="flex items-center gap-2 px-[10px] py-1 rounded-full border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'live' ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
              <span className="text-xs font-semibold text-[#9CA3AF]">● {apiStatus === 'live' ? 'Live' : 'Simulated'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/5 rounded-full border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'live' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
              <span className="text-[10px] font-semibold text-[#9CA3AF]">{apiStatus === 'live' ? 'Live' : 'Sim'}</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-[#9CA3AF] hover:text-[#F9FAFB] bg-white/5 rounded-lg border border-white/5 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed left-0 w-full md:hidden navbar-blur border-b border-white/5 overflow-hidden z-30 ${apiStatus === 'simulated' && showBanner ? 'top-[90px]' : 'top-16'}`}
          >
            <div className="px-6 py-8 flex flex-col gap-5">
              {cardConfig.map(c => (
                <button key={c.id} onClick={() => handleNavClick(c.id)} className="text-left text-base font-semibold py-2 text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer">
                  {c.id === 'resume' ? 'Resume Check' : c.id === 'interview' ? 'Mock Interview' : c.id === 'writing' ? 'Writing Check' : c.id === 'builder' ? 'Resume Builder' : 'LinkedIn'}
                </button>
              ))}
              <div className="h-px bg-white/5 my-2" />
              <button onClick={() => { setIsHowItWorksOpen(true); setIsMobileMenuOpen(false); }} className="text-left text-base font-semibold py-2 text-[#9CA3AF] hover:text-[#F9FAFB] flex items-center gap-2 cursor-pointer">
                <HelpCircle size={18} /> How it works
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTool === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* ===== HERO SECTION ===== */}
              <section ref={heroRef} className="scroll-section relative overflow-hidden" style={{ minHeight: '100vh' }}>
                <div className="absolute inset-0 z-0">
                  <ThreeCanvas activeSlide={0} />
                </div>
                <div className="absolute inset-0 pointer-events-none z-[1] bg-grid-overlay" />
                <div className="absolute inset-0 z-[2] flex items-center justify-center px-4 md:px-12">
                  <div className="max-w-5xl text-center space-y-8">
                    <motion.span
                      custom={0}
                      variants={staggerHero}
                      initial="initial"
                      animate="animate"
                      className="text-[11px] font-bold tracking-[0.25em] text-[#4F8EF7] uppercase block"
                    >
                      AI-POWERED CAREER PLATFORM
                    </motion.span>
                    <h1 className="text-[44px] md:text-[80px] font-[800] font-syne text-[#F9FAFB] leading-[1.1] tracking-tight text-shadow-hero">
                      {"Your Career,\nUpgraded.".split('\n').map((line, li) => (
                        <span key={li} className="block">
                          {line.split(' ').map((word, wi) => (
                            <motion.span
                              key={`${li}-${wi}`}
                              custom={1 + li * 10 + wi}
                              variants={staggerHero}
                              initial="initial"
                              animate="animate"
                              className="inline-block mr-[0.15em]"
                            >
                              {word}{' '}
                            </motion.span>
                          ))}
                        </span>
                      ))}
                    </h1>
                    <motion.p
                      custom={3}
                      variants={staggerHero}
                      initial="initial"
                      animate="animate"
                      className="text-lg md:text-xl text-[#9CA3AF] max-w-[520px] mx-auto leading-relaxed"
                    >
                      Know exactly where you stand — before you apply.
                    </motion.p>
                    <motion.div
                      custom={4}
                      variants={staggerHero}
                      initial="initial"
                      animate="animate"
                      className="flex flex-col items-center gap-6 pt-4"
                    >
                      <button
                        onClick={jumpToTools}
                        className="btn-primary text-base flex items-center gap-2 cta-glow group"
                      >
                        Jump to Tools <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                      </button>
                      <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] animate-pulse">
                        Scroll Down to Explore
                      </span>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* ===== SHOWCASE 1: RESUME ===== */}
              <section ref={scoreSectionRef} className="scroll-section">
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4 md:px-12">
                  <motion.div
                    initial={{ opacity: 0, x: -80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="space-y-6 order-2 md:order-1"
                  >
                    <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 border-l-4 border-[#4F8EF7] relative overflow-hidden">
                      <div className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] bg-[#4F8EF7]/[0.06] rounded-full blur-[40px]" />
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-[#4F8EF7] px-2.5 py-1 bg-[#4F8EF7]/10 rounded-full uppercase">Resume Profile</span>
                        <span className="text-xs text-[#9CA3AF]">Jane Doe — Sr. Frontend Engineer</span>
                      </div>
                      <div className="space-y-3 text-xs text-[#9CA3AF]">
                        <div className="p-2.5 bg-gray-900/60 rounded-lg border border-white/5 line-through decoration-[#EF4444] opacity-60">
                          - Built web interfaces using HTML, CSS and Javascript.
                        </div>
                        <div className="p-2.5 bg-[#4F8EF7]/5 rounded-lg border border-[#4F8EF7]/20 text-[#F9FAFB] font-semibold">
                          + Architected responsive React apps with TypeScript, boosting performance by 24%.
                        </div>
                        <div className="p-2.5 bg-gray-900/60 rounded-lg border border-white/5 line-through decoration-[#EF4444] opacity-60">
                          - Worked with team to deliver projects on time.
                        </div>
                        <div className="p-2.5 bg-[#4F8EF7]/5 rounded-lg border border-[#4F8EF7]/20 text-[#F9FAFB] font-semibold">
                          + Led cross-functional delivery of 3 major features, reducing time-to-market by 30%.
                        </div>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex items-center gap-6 border-l-4 border-[#10B981]"
                    >
                      <div className="relative w-[90px] h-[90px] flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="45" cy="45" r="36" className="stroke-gray-800" strokeWidth="6" fill="transparent" />
                          <circle cx="45" cy="45" r="36" className="stroke-[#4F8EF7]" strokeWidth="6" fill="transparent"
                            strokeDasharray={2 * Math.PI * 36}
                            strokeDashoffset={2 * Math.PI * 36 * (1 - matchScore / 100)}
                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold font-syne text-[#F9FAFB]">{matchScore}%</span>
                          <span className="text-[7px] text-[#9CA3AF] uppercase tracking-wider">Score</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#F9FAFB] font-syne">Job Match Score</h4>
                        <p className="text-xs text-[#9CA3AF] leading-relaxed mt-1">Your resume scores 87% against Senior Frontend Engineer roles.</p>
                      </div>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="order-1 md:order-2 space-y-6"
                  >
                    <h2 className="text-[32px] md:text-[52px] font-bold font-syne text-[#F9FAFB] leading-tight">
                      Does your resume speak the{' '}
                      <span className="text-[#4F8EF7]">language of the job?</span>
                    </h2>
                    <p className="text-base md:text-lg text-[#9CA3AF] leading-relaxed max-w-md">
                      AI reads your resume against any job description and tells you exactly what's missing.
                    </p>
                  </motion.div>
                </div>
              </section>

              {/* ===== SHOWCASE 2: INTERVIEW ===== */}
              <section className="scroll-section">
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4 md:px-12">
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6"
                  >
                    <h2 className="text-[36px] md:text-[56px] font-bold font-syne text-[#F9FAFB] leading-tight">
                      {"Answer like you've done this before.".split(' ').map((word, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className={`inline-block mr-[0.3em] ${word === "Answer" ? 'text-[#A78BFA]' : ''}`}
                        >
                          {word}
                        </motion.span>
                      ))}
                      <br />
                      <span className="text-[#A78BFA]">done this before.</span>
                    </h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-base md:text-lg text-[#9CA3AF] leading-relaxed"
                    >
                      AI-generated questions. Instant feedback on your content, tone, and delivery.
                    </motion.p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="bg-[#111827] border border-white/5 rounded-[20px] overflow-hidden shadow-[0_0_40px_rgba(167,139,250,0.2)] relative max-w-sm w-full">
                      <div className="bg-gray-900/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] ml-2">AI Interviewer</span>
                        </div>
                        <span className="text-[10px] text-[#9CA3AF] bg-[#A78BFA]/10 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          00:42
                        </span>
                      </div>
                      <div className="py-8 flex flex-col items-center justify-center bg-gray-950/20 gap-4">
                        <div className="w-[72px] h-[72px] rounded-full bg-[rgba(167,139,250,0.1)] flex items-center justify-center border border-[rgba(167,139,250,0.2)]">
                          <Video className="text-[#A78BFA]" size={28} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">REC</span>
                          <span className="text-[10px] text-[#9CA3AF] font-mono">00:42</span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] italic text-center px-6">"Tell me about a time you optimized a complex system..."</p>
                      </div>
                      <div className="bg-gray-950/60 px-4 py-4 border-t border-white/5 flex justify-center gap-6">
                        {[Video, Video, Video].map((Icon, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#9CA3AF]">
                            <Icon size={14} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex items-end justify-center gap-[2px] h-8 w-48"
                    >
                      {[0.6,0.3,0.8,0.4,0.2,0.9,0.5,0.7,0.3,0.8,0.4,0.6,0.9,0.3,0.7,0.5].map((v, i) => (
                        <div
                          key={i}
                          className="w-[4px] bg-[#A78BFA] rounded-full"
                          style={{
                            height: `${v * 100}%`,
                            animation: `waveform ${0.6 + v * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.08}s`,
                            transformOrigin: 'bottom',
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </section>

              {/* ===== SHOWCASE 3: WRITING ===== */}
              <section className="scroll-section">
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4 md:px-12">
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-4 order-2 md:order-1"
                  >
                    <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6 relative">
                      <span className="text-[10px] font-bold tracking-widest text-[#9CA3AF] px-2 py-0.5 bg-white/5 rounded-full uppercase">Original</span>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed mt-3 font-mono">
                        <span className="line-through decoration-[#EF4444]/50">Hey, I am interested in the job. I saw your post. Here is my resume.</span>
                        <br />
                        <span className="line-through decoration-[#EF4444]/50">Let me know if we can talk.</span>
                      </p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)] rounded-2xl p-6 relative shadow-[0_0_30px_rgba(16,185,129,0.06)]"
                    >
                      <span className="text-[10px] font-bold tracking-widest text-[#10B981] px-2 py-0.5 bg-[rgba(16,185,129,0.1)] rounded-full uppercase">Enhanced ✓</span>
                      <p className="text-xs text-[#F9FAFB] leading-relaxed mt-3 font-mono">
                        Dear Hiring Manager,<br /><br />
                        I am writing to express my strong interest in the role. With my background in full-stack architecture, I am eager to discuss how I can contribute to your projects.
                      </p>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="order-1 md:order-2 space-y-6"
                  >
                    <h2 className="text-[36px] md:text-[56px] font-bold font-syne text-[#F9FAFB] leading-tight">
                      Write emails that{' '}
                      <span className="text-[#10B981]">get replies.</span>
                    </h2>
                    <p className="text-base md:text-lg text-[#9CA3AF] leading-relaxed">
                      Paste any professional writing. Get an AI-polished version with every change explained.
                    </p>
                  </motion.div>
                </div>
              </section>

              {/* ===== TOOL PICKER ===== */}
              <section ref={toolsRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[#4F8EF7] uppercase block">
                    YOUR CAREER TOOLKIT
                  </span>
                  <h2 className="text-[36px] md:text-[56px] font-bold font-syne text-[#F9FAFB] tracking-tight leading-[1.15]">
                    What would you like to <br />work on today?
                  </h2>
                  <p className="text-base md:text-lg text-[#9CA3AF] leading-relaxed max-w-xl mx-auto">
                    Three AI-powered tools to help you land the role.
                  </p>
                  <div className="mx-auto h-[2px] w-[120px] rounded-full bg-gradient-to-r from-[#4F8EF7] to-[#A78BFA]" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                  {cardConfig.map((c, ci) => {
                    const Icon = c.icon;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: ci * 0.1 }}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleNavClick(c.id)}
                        className="bg-[#111827] border border-white/5 rounded-[20px] overflow-hidden cursor-pointer group flex flex-col transition-all duration-250"
                        style={{ width: '100%', maxWidth: '370px', minHeight: '340px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = c.accent;
                          e.currentTarget.style.boxShadow = `0 0 0 1px ${c.accent}, 0 20px 60px rgba(0,0,0,0.5)`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
                        }}
                      >
                        <div className={`${c.gradient} h-[140px] flex items-center justify-center relative overflow-hidden`}>
                          <div
                            className="w-20 h-20 rounded-full absolute opacity-60"
                            style={{ background: c.orbColor, filter: 'blur(30px)' }}
                          />
                          <Icon size={36} className="text-white relative z-10" />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          {c.tag && (
                            <span
                              className="inline-block px-[10px] py-[3px] rounded-full text-[11px] font-semibold mb-3 w-fit"
                              style={{
                                background: 'rgba(79,142,247,0.12)',
                                color: c.accent,
                                border: '1px solid rgba(79,142,247,0.2)',
                              }}
                            >
                              {c.tag}
                            </span>
                          )}
                          <h3 className="text-[22px] font-bold font-syne text-[#F9FAFB]">{c.title}</h3>
                          <p className="text-sm text-[#9CA3AF] leading-relaxed mt-2 flex-1">{c.desc}</p>
                          <button
                            className="w-full mt-5 text-sm font-semibold text-white rounded-[10px] py-[11px] px-5 border-none flex items-center justify-center gap-2 cursor-pointer group/btn"
                            style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.darker})` }}
                            onClick={e => { e.stopPropagation(); handleNavClick(c.id); }}
                          >
                            {c.btn} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="max-w-7xl mx-auto px-4 md:px-8 py-10 w-full"
              style={{ paddingTop: '5rem' }}
            >
              <div className="mb-6">
                <button onClick={() => handleNavClick('home')} className="btn-ghost text-xs font-semibold px-4 py-2 cursor-pointer">
                  ← Back to Dashboard
                </button>
              </div>
              <Suspense fallback={activeTool === 'resume' ? <ResumeSkeleton /> : activeTool === 'interview' ? <InterviewSkeleton /> : activeTool === 'writing' ? <WritingSkeleton /> : activeTool === 'builder' ? <BuilderSkeleton /> : <LinkedInSkeleton />}>
                {activeTool === 'resume' ? <ResumeAnalyzer /> : activeTool === 'interview' ? <MockInterview /> : activeTool === 'writing' ? <WritingEnhancer /> : activeTool === 'builder' ? <ResumeBuilder /> : <LinkedInAnalyzer />}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12 bg-gray-950/40 text-center text-xs text-[#9CA3AF] relative z-10">
        <p>&copy; {new Date().getFullYear()} HireBoost AI Platform. All rights reserved.</p>
      </footer>

      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
    </div>
  );
};
