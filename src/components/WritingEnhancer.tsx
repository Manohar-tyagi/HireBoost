import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, ChevronLeft, Copy, Sparkles, HelpCircle, ClipboardCheck, Languages, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChangeItem { type: 'Clarity' | 'Tone' | 'Professionalism' | 'Grammar' | 'Conciseness' | 'Structure' | 'Impact'; original: string; improved: string; explanation: string; }
interface EnhancementResults {
  enhancedText: string;
  subjectLine: string | null;
  readabilityScore: { before: number; after: number };
  toneAnalysis: { before: string; after: string };
  wordCountComparison: { before: number; after: number };
  changes: ChangeItem[];
  topImprovement: string;
  writingTips: string[];
}

const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
  Clarity:        { bg: 'rgba(79,142,247,0.15)', text: '#4F8EF7', border: 'rgba(79,142,247,0.3)' },
  Tone:           { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
  Professionalism:{ bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  Grammar:        { bg: 'rgba(16,185,129,0.15)', text: '#10B981', border: 'rgba(16,185,129,0.3)' },
  Conciseness:    { bg: 'rgba(236,72,153,0.15)', text: '#EC4899', border: 'rgba(236,72,153,0.3)' },
  Structure:      { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
  Impact:         { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
};

export const WritingEnhancer: React.FC = () => {
  const [type, setType] = useState('Professional Email');
  const [goal, setGoal] = useState('');
  const [text, setText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<EnhancementResults | null>(null);
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true); setResults(null); setCopied(false); setDisplayedText('');
    const lt = toast.loading("Optimizing your text...");
    try {
      const res = await fetch('/api/enhance-writing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, goal, text }),
      });
      toast.dismiss(lt);
      if (!res.ok) { const err = await res.json(); throw new Error(err.details || "Failed to enhance."); }
      const data = await res.json();
      setResults(data);
      let idx = 0;
      const iv = setInterval(() => {
        idx++;
        setDisplayedText(data.enhancedText.slice(0, idx));
        if (idx >= data.enhancedText.length) clearInterval(iv);
      }, 15);
      toast.success("Writing enhanced successfully!");
    } catch (err: any) { toast.error(err.message || "Failed to optimize."); }
    finally { setIsEnhancing(false); }
  };

  const handleCopy = () => {
    if (!results) return;
    navigator.clipboard.writeText(results.enhancedText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => { setResults(null); setText(''); setGoal(''); setCopied(false); setDisplayedText(''); };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {!isEnhancing && !results && (
          <motion.div key="input" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold font-syne text-[#FFFFFF]">Writing Enhancer</h2>
              <p className="text-xs md:text-sm text-[#D1D5DB] leading-relaxed">Clear communication drives conversions and replies. Our writing enhancer polishes your outreach drafts, executive messages, and reports.</p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-[#9CA3AF]">
                <HelpCircle className="text-[#4F8EF7] flex-shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <span className="font-bold text-[#F9FAFB] block font-syne uppercase">Optional Goal Details</span>
                  <p className="leading-relaxed">Add a specific goal like "Schedule a demo" or "Follow up after interview" to align tone matrices.</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 bg-[#111827] border border-white/5 rounded-2xl p-7 space-y-5">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 space-y-2">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Writing Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full input-field text-sm">
                    <option value="Professional Email">Professional Email</option>
                    <option value="Cover Letter">Cover Letter</option>
                    <option value="LinkedIn Message">LinkedIn Outreach</option>
                    <option value="Business Report">Business Report</option>
                    <option value="General Paragraph">General Paragraph</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Target Goal</label>
                  <input type="text" placeholder="e.g. Schedule meeting" value={goal} onChange={e => setGoal(e.target.value)} className="w-full input-field text-sm" />
                </div>
              </div>
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Original Text</label>
                  <span className="text-[10px] text-[#9CA3AF]">{text.length} characters</span>
                </div>
                <textarea rows={6} placeholder="Paste your cover letter, email, or message draft here..." value={text} onChange={e => setText(e.target.value)} className="w-full input-field text-sm" style={{ minHeight: '180px' }} />
              </div>
              <button onClick={handleEnhance} disabled={!text.trim()} className={`w-full h-12 text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${text.trim() ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                <Sparkles size={16} /> Enhance My Writing
              </button>
            </div>
          </motion.div>
        )}

        {isEnhancing && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#111827] border border-white/5 rounded-2xl p-12 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
            <div className="scanner-line" />
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
              <Languages size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Refactoring Draft Phrasing...</h3>
              <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">Optimizing syntactic structures and aligning semantic goals.</p>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] border border-white/5 rounded-2xl px-6 py-4 border-l-4 border-[#10B981]">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold tracking-widest text-[#10B981] uppercase">Enhancement Complete</span>
                <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Optimized {type}</h3>
              </div>
              <span className="text-xs text-[#9CA3AF] bg-white/5 px-3 py-1 rounded-full">Goal: {goal || 'General Improvement'}</span>
            </div>

            {/* Top Improvement Callout */}
            {results.topImprovement && (
              <div className="bg-[rgba(79,142,247,0.08)] border border-[rgba(79,142,247,0.2)] rounded-2xl p-5 flex items-start gap-3">
                <TrendingUp size={20} className="text-[#4F8EF7] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider">Top Improvement</span>
                  <p className="text-sm text-[#D1D5DB] mt-0.5">{results.topImprovement}</p>
                </div>
              </div>
            )}

            {/* Subject Line (for emails) */}
            {results.subjectLine && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">Subject:</span>
                <span className="text-sm text-[#F9FAFB] font-medium">{results.subjectLine}</span>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.readabilityScore && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Readability</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#EF4444]">{results.readabilityScore.before}</span>
                    <ArrowRight size={14} className="text-[#9CA3AF]" />
                    <span className="text-sm font-bold text-[#10B981]">{results.readabilityScore.after}</span>
                  </div>
                </div>
              )}
              {results.toneAnalysis && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#9CA3AF]">Tone</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#EF4444] bg-[rgba(239,68,68,0.12)] px-2 py-0.5 rounded-full">{results.toneAnalysis.before}</span>
                    <ArrowRight size={14} className="text-[#9CA3AF]" />
                    <span className="text-[11px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full">{results.toneAnalysis.after}</span>
                  </div>
                </div>
              )}
              {results.wordCountComparison && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#9CA3AF]">Word Count</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#EF4444]">{results.wordCountComparison.before}</span>
                    <ArrowRight size={14} className="text-[#9CA3AF]" />
                    <span className="text-sm font-bold text-[#10B981]">{results.wordCountComparison.after}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0f1218] border border-[rgba(239,68,68,0.15)] rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-[#9CA3AF] px-2 py-0.5 bg-white/5 rounded-full uppercase">Original</span>
                </div>
                <p className="text-[15px] text-[#9CA3AF] leading-relaxed font-mono flex-1">{text}</p>
              </div>
              <div className="bg-[#0a1812] border border-[rgba(16,185,129,0.2)] rounded-2xl p-6 flex flex-col shadow-[0_0_30px_rgba(16,185,129,0.06)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-[#10B981] px-2 py-0.5 bg-[rgba(16,185,129,0.1)] rounded-full uppercase">Enhanced ✓</span>
                  <button onClick={handleCopy} className="px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.2)] text-[#10B981] text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer">
                    {copied ? <><ClipboardCheck size={12} /> Copied! ✓</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p className="text-[15px] text-[#F0F4FF] leading-relaxed font-mono flex-1">
                  {displayedText}
                  {displayedText.length < results.enhancedText.length && <span className="typewriter-cursor" />}
                </p>
              </div>
            </div>

            {/* Changes with original/improved */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
              <h4 className="text-base font-semibold font-syne text-[#FFFFFF] border-b border-white/5 pb-3">What Changed & Why</h4>
              <div className="space-y-3">
                {results.changes.map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.08 }}
                    className="flex flex-col gap-2 p-[14px] bg-[rgba(255,255,255,0.02)] rounded-xl border-l-[3px] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    style={{ borderLeftColor: badgeColors[item.type]?.text || '#9CA3AF' }}>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ background: badgeColors[item.type]?.bg, color: badgeColors[item.type]?.text, borderColor: badgeColors[item.type]?.border }}>
                        {item.type}
                      </span>
                    </div>
                    {item.original && item.improved && (
                      <div className="space-y-1">
                        <p className="text-[12px] text-[#6B7280] line-through">{item.original}</p>
                        <p className="text-[13px] text-[#F0F4FF] font-medium">→ {item.improved}</p>
                      </div>
                    )}
                    <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{item.explanation}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Writing Tips */}
            {results.writingTips && results.writingTips.length > 0 && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold font-syne text-[#FFFFFF] border-b border-white/5 pb-3">Writing Tips</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {results.writingTips.map((tip, i) => (
                    <div key={i} className="rounded-xl p-4 bg-[rgba(79,142,247,0.04)] border border-[rgba(79,142,247,0.1)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center text-[10px] font-bold text-[#4F8EF7]">{i + 1}</span>
                      </div>
                      <p className="text-[12px] text-[#D1D5DB] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button onClick={handleReset} className="px-6 py-3 btn-ghost text-xs font-semibold flex items-center gap-2 cursor-pointer">
                <ChevronLeft size={16} /> Enhance Another Draft
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};