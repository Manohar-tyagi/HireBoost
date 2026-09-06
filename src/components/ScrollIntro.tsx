import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, Video } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThreeCanvas } from './ThreeCanvas';

gsap.registerPlugin(ScrollTrigger);

interface ScrollIntroProps {
  onEnterDashboard: () => void;
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] } },
});

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const ScrollIntro: React.FC<ScrollIntroProps> = ({ onEnterDashboard }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: 'top top',
        end: `+=${window.innerHeight * 5}`,
        snap: { snapTo: [0, 0.25, 0.5, 0.75, 1], duration: 0.5, ease: 'power2.inOut' },
        onUpdate: (s) => {
          const idx = Math.round(s.progress * 4);
          if (idx !== prevRef.current) {
            prevRef.current = idx;
            setActiveSlide(idx);
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (activeSlide === 1) {
      setMatchScore(0);
      const iv = setInterval(() => setMatchScore(p => p >= 87 ? (clearInterval(iv), 87) : p + 1), 10);
      return () => clearInterval(iv);
    }
  }, [activeSlide]);

  const resp = (d: number, m: number) => `text-${m}px md:text-${d}px`;

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-[#0A0F1E]">
      <ThreeCanvas activeSlide={activeSlide} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-grid-overlay" />

      {/* Color orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#4F8EF7]/[0.06] blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#A78BFA]/[0.06] blur-[100px] pointer-events-none z-0" />

      {/* Skip */}
      <button
        onClick={onEnterDashboard}
        className="fixed top-6 right-8 z-50 px-5 py-2.5 btn-ghost text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer glow-glow"
        aria-label="Skip Intro"
      >
        Skip <ChevronRight size={14} />
      </button>

      {/* Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              activeSlide === i
                ? 'w-[10px] h-[10px] bg-[#4F8EF7] shadow-[0_0_12px_#4F8EF7]'
                : 'w-[6px] h-[6px] bg-[rgba(255,255,255,0.3)]'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 w-full h-full flex items-center justify-center px-4 md:px-12 z-10 ${
            activeSlide === 0 ? '' : ''
          }`}
        >
          {/* ===== SLIDE 1: HERO ===== */}
          {activeSlide === 0 && (
            <div className="max-w-5xl text-center z-10 space-y-8 relative">
              <motion.span
                custom={0} variants={stagger} initial="initial" animate="animate"
                className="text-[11px] font-bold tracking-[0.25em] text-[#4F8EF7] uppercase block"
              >
                AI-POWERED CAREER PLATFORM
              </motion.span>
              <h1 className="text-[44px] md:text-[80px] font-[800] font-syne text-[#F9FAFB] leading-[1.1] tracking-tight">
                {"Your Career,\nUpgraded.".split('\n').map((line, li) => (
                  <span key={li} className="block">
                    {line.split(' ').map((word, wi) => (
                      <motion.span
                        key={`${li}-${wi}`}
                        custom={1 + li * 10 + wi}
                        variants={stagger}
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
                custom={3} variants={stagger} initial="initial" animate="animate"
                className="text-lg md:text-xl text-[#9CA3AF] max-w-[520px] mx-auto leading-relaxed"
              >
                Know exactly where you stand — before you apply.
              </motion.p>
              <motion.div
                custom={4} variants={stagger} initial="initial" animate="animate"
                className="flex flex-col items-center gap-6 pt-4"
              >
                <button
                  onClick={onEnterDashboard}
                  className="px-8 py-[14px] btn-primary text-base flex items-center gap-2 cta-glow group"
                >
                  Get Started{' '}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] animate-pulse">
                  Scroll Down to Explore
                </span>
              </motion.div>
            </div>
          )}

          {/* ===== SLIDE 2: RESUME ANALYZER ===== */}
          {activeSlide === 1 && (
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
              <motion.div
                initial={{ opacity: 0, x: -80 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="space-y-6 order-2 md:order-1"
              >
                {/* Mock resume card */}
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
                {/* Score */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
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
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="order-1 md:order-2 space-y-6"
              >
                <h2 className="text-[32px] md:text-[52px] font-bold font-syne text-[#F9FAFB] leading-tight">
                  Does your resume speak the <br />
                  <span className="text-[#4F8EF7]">language of the job?</span>
                </h2>
                <p className="text-base md:text-lg text-[#9CA3AF] leading-relaxed max-w-md">
                  AI reads your resume against any job description and tells you exactly what's missing.
                </p>
              </motion.div>
            </div>
          )}

          {/* ===== SLIDE 3: MOCK INTERVIEW ===== */}
          {activeSlide === 2 && (
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-[36px] md:text-[56px] font-bold font-syne text-[#F9FAFB] leading-tight">
                  {"Answer like you've done this before.".split(' ').map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-base md:text-lg text-[#9CA3AF] leading-relaxed"
                >
                  AI-generated questions. Instant feedback on your content, tone, and delivery.
                </motion.p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -60 }}
                animate={{ opacity: 1, y: 0 }}
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
                {/* Waveform */}
                <div className="flex items-end justify-center gap-[2px] h-8 w-48">
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
                </div>
              </motion.div>
            </div>
          )}

          {/* ===== SLIDE 4: WRITING ENHANCER ===== */}
          {activeSlide === 3 && (
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4 order-2 md:order-1"
              >
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6 relative"
                >
                  <span className="text-[10px] font-bold tracking-widest text-[#9CA3AF] px-2 py-0.5 bg-white/5 rounded-full uppercase">Original</span>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed mt-3 font-mono">
                    <span className="line-through decoration-[#EF4444]/50">Hey, I am interested in the job. I saw your post. Here is my resume.</span>
                    <br />
                    <span className="line-through decoration-[#EF4444]/50">Let me know if we can talk.</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
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
                animate={{ opacity: 1, x: 0 }}
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
          )}

          {/* ===== SLIDE 5: CTA ===== */}
          {activeSlide === 4 && (
            <div className="max-w-4xl text-center space-y-8 z-10 relative">
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-[44px] md:text-[80px] font-[800] font-syne text-[#F9FAFB] tracking-tight leading-[1.1]"
              >
                Ready to <span className="text-gradient">stand out?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-[#9CA3AF] max-w-xl mx-auto leading-relaxed"
              >
                Join thousands upgrading their career with HireBoost.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex flex-col items-center gap-6"
              >
                <button
                  onClick={onEnterDashboard}
                  className="px-10 py-[18px] btn-primary text-lg flex items-center gap-2.5 shadow-[0_0_60px_rgba(79,142,247,0.4)] hover:shadow-[0_0_80px_rgba(79,142,247,0.6)] transition-shadow"
                >
                  Start Your Assessment <ChevronRight size={20} />
                </button>
                <div className="flex flex-wrap justify-center gap-8 mt-2">
                  {['No signup required', 'Results in seconds', '100% free to try'].map((tag, i) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + i * 0.12 }}
                      className="flex items-center gap-2 text-sm text-[#9CA3AF] font-medium"
                    >
                      <CheckCircle2 className="text-[#10B981]" size={16} />
                      <span>{tag}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
