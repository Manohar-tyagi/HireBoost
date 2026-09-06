import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, AlertTriangle, RefreshCw, Copy, Check, Star, Clock, X, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulletImprovement { original: string; improved: string; reason: string; }
interface QuickWin { action: string; impact: string; timeToComplete: string; }

interface AnalysisData {
  overallScore: number;
  profileStrength: string;
  recruiterAppeal: number;
  searchAppearanceScore: number;
  sections: {
    headline: { current: string; score: number; issues: string[]; improved: string; explanation: string };
    about: { current: string; score: number; issues: string[]; improved: string; explanation: string; hookStrength: string };
    experience: { score: number; issues: string[]; bulletImprovements: BulletImprovement[] };
    skills: { score: number; topSkillsForRole: string[]; missingSkills: string[]; skillsToRemove: string[] };
  };
  keywordOptimization: { currentKeywords: string[]; missingKeywords: string[]; keywordDensityScore: number };
  quickWins: QuickWin[];
  optimizedHeadline: string;
  alternativeHeadlines: string[];
  profileBio: string;
  connectionStrategy: string;
  contentStrategy: string;
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.4 } }
});

export const LinkedInAnalyzer: React.FC = () => {
  const [tab, setTab] = useState<'paste' | 'manual'>('paste');
  const [profileText, setProfileText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [selectedHeadline, setSelectedHeadline] = useState('');
  const [doneWins, setDoneWins] = useState<Set<number>>(new Set());
  const [animatedScore, setAnimatedScore] = useState(0);
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Manual form fields
  const [manualHeadline, setManualHeadline] = useState('');
  const [manualAbout, setManualAbout] = useState('');
  const [manualJobTitle, setManualJobTitle] = useState('');
  const [manualJobDesc, setManualJobDesc] = useState('');
  const [manualTargetRole, setManualTargetRole] = useState('');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(field => field === field ? '' : ''), 2000);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      setManualSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (idx: number) => {
    setManualSkills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    const text = tab === 'paste' ? profileText : `Headline: ${manualHeadline}\nAbout: ${manualAbout}\nRecent Job Title: ${manualJobTitle}\nRecent Job Description: ${manualJobDesc}\nSkills: ${manualSkills.join(', ')}`;
    const role = tab === 'paste' ? targetRole : manualTargetRole;
    if (!text.trim() || !role.trim()) return;

    setIsAnalyzing(true); setError(false); setData(null); setAnimatedScore(0);
    try {
      const res = await fetch('/api/linkedin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText: text, targetRole: role }),
      });
      const d = await res.json();
      if (d.error) { setError(true); return; }
      setData(d);
      setSelectedHeadline(d.optimizedHeadline || '');
      // Animate score
      let cur = 0;
      const target = d.overallScore || 0;
      const step = Math.ceil(target / 60);
      const iv = setInterval(() => {
        cur += step;
        if (cur >= target) { setAnimatedScore(target); clearInterval(iv); }
        else setAnimatedScore(cur);
      }, 25);
    } catch { setError(true); }
    finally { setIsAnalyzing(false); }
  };

  const handleReset = () => { setData(null); setError(false); setProfileText(''); setTargetRole(''); setAnimatedScore(0); setDoneWins(new Set()); setSelectedHeadline(''); };

  const getScoreColor = (s: number) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
  const strengthConfig = (s: string) => {
    if (s === 'All-Star') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    if (s === 'Expert') return { color: '#4F8EF7', bg: 'rgba(79,142,247,0.15)' };
    if (s === 'Intermediate') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
  };

  const hookConfig = (h: string) => {
    if (h === 'Strong') return { color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
    if (h === 'Weak') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
  };

  const impactColor = (imp: string) => {
    if (imp === 'High') return { color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
    if (imp === 'Medium') return { color: '#4F8EF7', bg: 'rgba(79,142,247,0.15)' };
    return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
  };

  const renderStars = (score: number) => {
    const full = Math.round(score / 2);
    return (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={16} fill={i <= full ? '#F59E0B' : 'none'} color={i <= full ? '#F59E0B' : '#4B5563'} />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {!isAnalyzing && !data && !error && (
          <motion.div key="input" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold font-syne text-[#FFFFFF]">LinkedIn Profile Optimizer</h2>
              <p className="text-[16px] text-[#9CA3AF] leading-relaxed">Get found by recruiters for your target role</p>
            </div>
            <div className="md:col-span-3 bg-[#111827] border border-white/5 rounded-2xl p-7 space-y-5">
              {/* Inner tabs */}
              <div style={{ display: 'flex', gap: '0', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
                <button onClick={() => setTab('paste')}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    background: tab === 'paste' ? '#1F2937' : 'transparent', color: tab === 'paste' ? '#FFFFFF' : '#9CA3AF',
                    boxShadow: tab === 'paste' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
                  Paste Profile Text
                </button>
                <button onClick={() => setTab('manual')}
                  style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    background: tab === 'manual' ? '#1F2937' : 'transparent', color: tab === 'manual' ? '#FFFFFF' : '#9CA3AF',
                    boxShadow: tab === 'manual' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
                  Fill Manually
                </button>
              </div>

              {tab === 'paste' ? (
                <>
                  <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 500, marginBottom: '8px' }}>How to copy your LinkedIn profile:</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.8 }}>
                      <div>1. Go to your LinkedIn profile page</div>
                      <div>2. Press Ctrl+A to select all, then Ctrl+C to copy</div>
                      <div>3. Paste everything in the box below</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <textarea rows={8} placeholder="Paste your full LinkedIn profile text here..." value={profileText}
                      onChange={e => setProfileText(e.target.value)}
                      className="w-full input-field text-sm" style={{ minHeight: '200px', background: '#1F2937', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#F9FAFB', fontSize: '14px' }} />
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#9CA3AF' }}>{profileText.length} characters</div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Target Job Role</label>
                    <input type="text" placeholder="e.g. Product Manager, Data Scientist" value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                      className="w-full input-field text-sm" />
                  </div>
                  <button onClick={handleAnalyze} disabled={!profileText.trim() || !targetRole.trim()}
                    className={`w-full h-12 text-sm font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${profileText.trim() && targetRole.trim() ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                    <Sparkles size={16} /> Analyze My Profile
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Current Headline</label>
                    <input type="text" placeholder="e.g. Senior Software Engineer at Google" value={manualHeadline}
                      onChange={e => setManualHeadline(e.target.value)} className="w-full input-field text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">About / Summary</label>
                    <textarea rows={4} placeholder="Your LinkedIn About section..." value={manualAbout}
                      onChange={e => setManualAbout(e.target.value)} className="w-full input-field text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Most Recent Job Title</label>
                      <input type="text" placeholder="e.g. Staff Engineer" value={manualJobTitle}
                        onChange={e => setManualJobTitle(e.target.value)} className="w-full input-field text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Target Role</label>
                      <input type="text" placeholder="e.g. Product Manager" value={manualTargetRole}
                        onChange={e => setManualTargetRole(e.target.value)} className="w-full input-field text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Most Recent Job Description</label>
                    <textarea rows={3} placeholder="Describe your recent role..." value={manualJobDesc}
                      onChange={e => setManualJobDesc(e.target.value)} className="w-full input-field text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Your Top Skills</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {manualSkills.map((sk, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', borderRadius: '20px', padding: '4px 10px', fontSize: '12px' }}>
                          {sk}
                          <button onClick={() => handleRemoveSkill(i)} style={{ background: 'none', border: 'none', color: '#4F8EF7', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Type a skill and press Enter" value={skillInput}
                        onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill}
                        className="w-full input-field text-sm" />
                      <button onClick={() => { if (skillInput.trim()) { setManualSkills(prev => [...prev, skillInput.trim()]); setSkillInput(''); } }}
                        style={{ background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button onClick={handleAnalyze} disabled={!manualHeadline.trim() || !manualTargetRole.trim()}
                    className={`w-full h-12 text-sm font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${manualHeadline.trim() && manualTargetRole.trim() ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                    <Sparkles size={16} /> Analyze My Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-[#111827] border border-white/5 rounded-2xl p-12 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9]">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Analyzing your LinkedIn presence...</h3>
              <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">Scanning profile sections and optimizing for recruiter visibility.</p>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg, transparent, #0EA5E9, #0284C7, transparent)', borderRadius: '2px', animation: 'shimmer 1.2s ease-in-out infinite' }} />
            </div>
            <div className="space-y-3 w-full">
              {[1,2,3].map(i => (
                <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </motion.div>
        )}

        {error && !isAnalyzing && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-2xl p-12 max-w-lg mx-auto text-center space-y-4">
            <AlertTriangle size={32} color="#F59E0B" style={{ margin: '0 auto' }} />
            <div style={{ fontSize: '16px', color: '#F59E0B', fontWeight: 600 }}>Analysis failed — please try again</div>
            <button onClick={handleAnalyze} style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Retry
            </button>
            <button onClick={handleReset} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>Try a different profile</button>
          </motion.div>
        )}

        {data && !isAnalyzing && (
          <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* TOP SECTION: Score Header */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <motion.div custom={0} variants={stagger} initial="initial" animate="animate"
                style={{ flex: '1 1 200px', background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                  <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="80" cy="80" r="68" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="transparent" />
                    <circle cx="80" cy="80" r="68" stroke={getScoreColor(data.overallScore)} strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={2 * Math.PI * 68 * (1 - animatedScore / 100)}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '40px', color: '#FFFFFF', fontWeight: 700 }}>{animatedScore}<span style={{ fontSize: '18px' }}>%</span></span>
                    <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Profile Score</span>
                  </div>
                </div>
                {data.profileStrength && (
                  <div style={{ display: 'inline-block', marginTop: '8px', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: 600, background: strengthConfig(data.profileStrength).bg, color: strengthConfig(data.profileStrength).color }}>
                    {data.profileStrength}
                  </div>
                )}
              </motion.div>

              <motion.div custom={1} variants={stagger} initial="initial" animate="animate"
                style={{ flex: '1 1 200px', background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '48px', color: '#FFFFFF', fontWeight: 700 }}>{data.recruiterAppeal}<span style={{ fontSize: '24px', color: '#9CA3AF' }}>/10</span></div>
                {renderStars(data.recruiterAppeal)}
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>Recruiter Appeal</div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>{data.searchAppearanceScore}% Search Visibility</div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: '#0EA5E9', width: `${data.searchAppearanceScore}%` }} />
                  </div>
                </div>
              </motion.div>

              <motion.div custom={2} variants={stagger} initial="initial" animate="animate"
                style={{ flex: '1 1 200px', background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px', fontWeight: 500 }}>Quick Stats</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F8EF7', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#FFFFFF' }}>Keywords Found: <strong>{data.keywordOptimization?.currentKeywords?.length || 0}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#FFFFFF' }}>Keywords Missing: <strong>{data.keywordOptimization?.missingKeywords?.length || 0}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#FFFFFF' }}>Quick Wins: <strong>{data.quickWins?.length || 0} available</strong></span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* HEADLINE CARD */}
            {data.sections?.headline && (
              <motion.div custom={3} variants={stagger} initial="initial" animate="animate"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Headline</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: `${getScoreColor(data.sections.headline.score * 10)}22`, color: getScoreColor(data.sections.headline.score * 10) }}>
                    {data.sections.headline.score}/10
                  </span>
                </div>
                {data.sections.headline.issues.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    {data.sections.headline.issues.map((issue, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#EF4444', marginBottom: '2px' }}>⚠ {issue}</div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #EF4444', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>Current</div>
                    <div style={{ fontSize: '15px', color: '#D1D5DB' }}>{data.sections.headline.current || 'Not found'}</div>
                  </div>
                  <ArrowRight size={20} color="#4F8EF7" style={{ flexShrink: 0 }} />
                  <div style={{ background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid #10B981', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#10B981', textTransform: 'uppercase' }}>Optimized ✓</span>
                      <button onClick={() => handleCopy(selectedHeadline || data.optimizedHeadline, 'headline')}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>
                        {copiedField === 'headline' ? 'Copied! ✓' : 'Copy Headline'}
                      </button>
                    </div>
                    <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 500 }}>{selectedHeadline || data.optimizedHeadline}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>{data.sections.headline.explanation}</div>
                  </div>
                </div>
                {data.alternativeHeadlines && data.alternativeHeadlines.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>2 More Options:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {data.alternativeHeadlines.map((alt, i) => (
                        <button key={i} onClick={() => setSelectedHeadline(alt)}
                          style={{ background: selectedHeadline === alt ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)', border: selectedHeadline === alt ? '1px solid rgba(79,142,247,0.3)' : '1px solid rgba(255,255,255,0.1)', color: selectedHeadline === alt ? '#FFFFFF' : '#9CA3AF', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ABOUT SECTION CARD */}
            {data.sections?.about && (
              <motion.div custom={4} variants={stagger} initial="initial" animate="animate"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>About Section</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: `${getScoreColor(data.sections.about.score * 10)}22`, color: getScoreColor(data.sections.about.score * 10) }}>
                    {data.sections.about.score}/10
                  </span>
                  {data.sections.about.hookStrength && (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: hookConfig(data.sections.about.hookStrength).bg, color: hookConfig(data.sections.about.hookStrength).color }}>
                      {data.sections.about.hookStrength} Hook
                    </span>
                  )}
                </div>
                {data.sections.about.issues.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    {data.sections.about.issues.map((issue, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#EF4444', marginBottom: '4px' }}>
                        <AlertTriangle size={12} /> {issue}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#D1D5DB', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.sections.about.improved || data.profileBio}</div>
                </div>
                <button onClick={() => handleCopy(data.sections.about.improved || data.profileBio, 'about')}
                  style={{ marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {copiedField === 'about' ? <><Check size={14} /> Copied! ✓</> : <><Copy size={14} /> Copy Full About Section</>}
                </button>
              </motion.div>
            )}

            {/* EXPERIENCE CARD */}
            {data.sections?.experience?.bulletImprovements && data.sections.experience.bulletImprovements.length > 0 && (
              <motion.div custom={5} variants={stagger} initial="initial" animate="animate"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Experience Bullet Improvements</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: `${getScoreColor(data.sections.experience.score * 10)}22`, color: getScoreColor(data.sections.experience.score * 10) }}>
                    {data.sections.experience.score}/10
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.sections.experience.bulletImprovements.map((bi, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'line-through', marginBottom: '4px' }}>{bi.original}</div>
                      <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 500, marginBottom: '4px' }}>→ {bi.improved}</div>
                      <div style={{ fontSize: '12px', color: '#10B981' }}>{bi.reason}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SKILLS CARD */}
            {data.sections?.skills && (
              <motion.div custom={6} variants={stagger} initial="initial" animate="animate"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#4F8EF7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skills</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: `${getScoreColor(data.sections.skills.score * 10)}22`, color: getScoreColor(data.sections.skills.score * 10) }}>
                    {data.sections.skills.score}/10
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>✓ Keep</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.sections.skills.topSkillsForRole?.map((sk, i) => (
                        <span key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', borderRadius: '20px', padding: '4px 12px', fontSize: '12px' }}>{sk}</span>
                      ))}
                      {(!data.sections.skills.topSkillsForRole || data.sections.skills.topSkillsForRole.length === 0) && <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>No skills listed</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#4F8EF7', textTransform: 'uppercase', marginBottom: '8px' }}>+ Add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.sections.skills.missingSkills?.map((sk, i) => (
                        <span key={i} onClick={() => { toast.success(`"${sk}" added to your copy-paste list`); }}
                          style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', color: '#4F8EF7', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>{sk}</span>
                      ))}
                      {(!data.sections.skills.missingSkills || data.sections.skills.missingSkills.length === 0) && <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>None missing</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>− Remove</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.sections.skills.skillsToRemove?.map((sk, i) => (
                        <span key={i} style={{ background: 'rgba(156,163,175,0.1)', border: '1px solid rgba(156,163,175,0.2)', color: '#9CA3AF', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontStyle: 'italic', cursor: 'pointer' }}
                          title="These may be outdated for your target role">{sk}</span>
                      ))}
                      {(!data.sections.skills.skillsToRemove || data.sections.skills.skillsToRemove.length === 0) && <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>None to remove</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* QUICK WINS PANEL */}
            {data.quickWins && data.quickWins.length > 0 && (
              <motion.div custom={7} variants={stagger} initial="initial" animate="animate"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', color: '#FFFFFF', fontWeight: 700 }}>Quick Wins — Do These First</h3>
                </div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px' }}>Biggest impact with least effort</div>
                <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #0EA5E9, #0284C7)', width: `${(doneWins.size / data.quickWins.length) * 100}%', transition: 'width 0.3s'` as any }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{doneWins.size} of {data.quickWins.length} completed</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {data.quickWins.map((w, i) => {
                    const done = doneWins.has(i);
                    const ic = impactColor(w.impact);
                    return (
                      <div key={i} style={{ flex: '1 1 220px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', opacity: done ? 0.5 : 1 }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: ic.bg, color: ic.color }}>{w.impact}</span>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {w.timeToComplete}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#FFFFFF', lineHeight: 1.5, textDecoration: done ? 'line-through' : 'none', marginBottom: '10px' }}>{w.action}</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF', cursor: 'pointer' }}>
                          <input type="checkbox" checked={done} onChange={() => setDoneWins(prev => { const n = new Set(prev); done ? n.delete(i) : n.add(i); return n; })}
                            style={{ accentColor: '#10B981' }} />
                          Mark as done
                        </label>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* COPY-PASTE READY BOX */}
            <motion.div custom={8} variants={stagger} initial="initial" animate="animate"
              style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', color: '#FFFFFF', marginBottom: '20px' }}>Ready to Update Your Profile</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 500 }}>Optimized Headline</span>
                    <button onClick={() => handleCopy(selectedHeadline || data.optimizedHeadline, 'cp-headline')}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer' }}>
                      {copiedField === 'cp-headline' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', fontSize: '14px', color: '#D1D5DB' }}>
                    {selectedHeadline || data.optimizedHeadline}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 500 }}>New About Section</span>
                    <button onClick={() => handleCopy(data.sections?.about?.improved || data.profileBio, 'cp-about')}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer' }}>
                      {copiedField === 'cp-about' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', fontSize: '14px', color: '#D1D5DB', maxHeight: '120px', overflow: 'auto' }}>
                    {data.sections?.about?.improved || data.profileBio}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 500 }}>Skills to Add (comma separated)</span>
                    <button onClick={() => handleCopy((data.sections?.skills?.missingSkills || []).join(', '), 'cp-skills')}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer' }}>
                      {copiedField === 'cp-skills' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', fontSize: '14px', color: '#D1D5DB' }}>
                    {(data.sections?.skills?.missingSkills || []).join(', ') || 'No skills to add'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connection & Content Strategy */}
            {(data.connectionStrategy || data.contentStrategy) && (
              <motion.div custom={9} variants={stagger} initial="initial" animate="animate"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {data.connectionStrategy && (
                  <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Connection Strategy</div>
                    <div style={{ fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6 }}>{data.connectionStrategy}</div>
                  </div>
                )}
                {data.contentStrategy && (
                  <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Content Strategy</div>
                    <div style={{ fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6 }}>{data.contentStrategy}</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reset button */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
              <button onClick={handleReset}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', cursor: 'pointer' }}>
                <ChevronLeft size={16} /> Analyze Another Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
