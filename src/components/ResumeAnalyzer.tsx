import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Trash2, CheckCircle, AlertCircle, AlertTriangle, XCircle, Lightbulb, ChevronLeft, Sparkles, X, Cpu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { JobScraper } from './JobScraper';
import { ATSSimulator } from './ATSSimulator';

interface ScoreBreakdown {
  skillsRelevance: number;
  experienceRelevance: number;
  keywordsMatch: number;
  educationCerts: number;
}
interface MissingSkill { skill: string; reason: string; priority: string; }
interface Recommendation { tip: string; impact: string; category: string; }
interface NextSteps {
  thisWeek: string[];
  thisMonth: string[];
  beforeApplying: string[];
}
interface AnalysisResults {
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  recommendations: Recommendation[];
  overallVerdict: string;
  verdictType: string;
  nextSteps?: NextSteps;
  parsedText?: string;
}

export const ResumeAnalyzer: React.FC = () => {
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [jobRoleHighlight, setJobRoleHighlight] = useState(false);
  const [activeTab, setActiveTab] = useState<'match' | 'ats'>('match');
  const [resumeText, setResumeText] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) { setFile(acceptedFiles[0]); toast.success("Resume uploaded successfully!"); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    multiple: false,
    onDropRejected: () => toast.error("Invalid file. Please upload a PDF or DOCX file under 5MB."),
  });

  const handleRemoveFile = (e: React.MouseEvent) => { e.stopPropagation(); setFile(null); };

  const handleAnalyze = async () => {
    if (!file || !jobRole.trim()) return;
    setIsAnalyzing(true); setResults(null); setAnimatedScore(0);
    const formData = new FormData();
    formData.append('resume', file); formData.append('jobRole', jobRole);
    if (jobDescription) formData.append('jobDescription', jobDescription);
    const lt = toast.loading("Analyzing your resume against the target role...");
    try {
      const res = await fetch('/api/analyze-resume', { method: 'POST', body: formData });
      toast.dismiss(lt);
      if (!res.ok) { const ed = await res.json(); throw new Error(ed.details || "Failed to analyze resume."); }
      const data = await res.json();
      setResults(data);
      if (data.parsedText) setResumeText(data.parsedText);
      setActiveTab('match');
      toast.success("Resume analysis complete!");
    } catch (err: any) { toast.error(err.message || "Something went wrong."); }
    finally { setIsAnalyzing(false); }
  };

  useEffect(() => {
    if (!results) return;
    setAnimatedScore(0);
    const target = results.matchScore;
    let cur = 0;
    const step = Math.ceil(target / 60);
    const iv = setInterval(() => {
      cur += step;
      if (cur >= target) { setAnimatedScore(target); clearInterval(iv); }
      else setAnimatedScore(cur);
    }, 25);
    return () => clearInterval(iv);
  }, [results]);

  const handleJobExtracted = (data: { jobTitle: string; company: string; description: string; location: string }) => {
    if (data.jobTitle) {
      setJobRole(data.jobTitle);
      setJobRoleHighlight(true);
      setTimeout(() => setJobRoleHighlight(false), 1500);
    }
    if (data.description) setJobDescription(data.description);
  };

  const handleReset = () => { setResults(null); setJobRole(''); setJobDescription(''); setFile(null); setResumeText(''); setActiveTab('match'); };

  const scoreColor = (score: number) => {
    if (score >= 75) return { stroke: '#10B981', text: '#10B981', label: 'Excellent match! Your resume contains the core keywords required.', bg: 'rgba(16,185,129,0.05)' };
    if (score >= 50) return { stroke: '#F59E0B', text: '#F59E0B', label: 'Moderate compatibility. Adding suggested skills will boost ATS score.', bg: 'rgba(245,158,11,0.05)' };
    return { stroke: '#EF4444', text: '#EF4444', label: 'Low compatibility. Refactoring is highly recommended.', bg: 'rgba(239,68,68,0.05)' };
  };

  const verdictConfig = (type: string) => {
    if (type === 'Strong Match') return { border: '#10B981', bg: 'rgba(16,185,129,0.08)', color: '#10B981', icon: AlertCircle };
    if (type === 'Moderate Match') return { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', icon: AlertTriangle };
    return { border: '#EF4444', bg: 'rgba(239,68,68,0.08)', color: '#EF4444', icon: XCircle };
  };

  const priorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'high') return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
    if (p === 'medium') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
  };

  const [showBars, setShowBars] = useState(false);
  useEffect(() => { if (results) { const t = setTimeout(() => setShowBars(true), 200); return () => clearTimeout(t); } }, [results]);

  const breakdownLabels = ['Skills Relevance', 'Experience', 'Keywords', 'Education'];
  const breakdownKeys: (keyof ScoreBreakdown)[] = ['skillsRelevance', 'experienceRelevance', 'keywordsMatch', 'educationCerts'];
  const breakdownMax = [40, 30, 20, 10];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {!isAnalyzing && !results && (
          <motion.div key="input" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold font-syne text-[#FFFFFF]">ATS Compatibility Checker</h2>
              <p className="text-xs md:text-sm text-[#D1D5DB] leading-relaxed">Applicant Tracking Systems screen out up to 75% of resumes before a human recruiter ever sees them. Pasting your target role and uploading your resume allows our AI system to analyze:</p>
              <ul className="space-y-2.5 text-xs text-[#D1D5DB]">
                {['Missing technical & soft skills keywords', 'Formatting & quantitative measurements', 'Action-verb phrasing suggestions'].map(item => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle className="text-[#4F8EF7] flex-shrink-0" size={14} /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3 bg-[#111827] border border-white/5 rounded-2xl p-7 space-y-5">
              <JobScraper onJobExtracted={handleJobExtracted} />
              <div className="space-y-2">
                <label htmlFor="job-role" className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Target Job Position</label>
                <input id="job-role" type="text" placeholder="e.g. Senior Frontend Engineer at Stripe" value={jobRole} onChange={e => setJobRole(e.target.value)}
                  className="w-full input-field text-sm transition-all duration-300"
                  style={jobRoleHighlight ? { borderColor: '#10B981' } : undefined} />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#E5E7EB] uppercase tracking-wider">Upload Resume</label>
                {!file ? (
                  <div {...getRootProps()} className={`border-2 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${isDragActive ? 'border-solid border-[#4F8EF7] bg-[rgba(79,142,247,0.06)] scale-[1.01]' : 'border-dashed border-[rgba(79,142,247,0.3)] hover:border-[#4F8EF7] bg-[rgba(79,142,247,0.02)]'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud size={32} className="text-[#4F8EF7]" />
                    <div className="text-center space-y-1">
                      <p className="text-[15px] text-[#9CA3AF]">Drop your resume here</p>
                      <p className="text-xs text-[rgba(156,163,175,0.6)]">PDF or DOCX · Max 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#F9FAFB] truncate">{file.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveFile} className="p-1 hover:bg-white/5 rounded-md text-[#9CA3AF] hover:text-[#EF4444] transition-colors cursor-pointer" aria-label="Remove file">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleAnalyze} disabled={!file || !jobRole.trim()} className={`w-full h-12 text-sm font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${file && jobRole.trim() ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                <Sparkles size={16} /> Analyze My Resume
              </button>
            </div>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#111827] border border-white/5 rounded-2xl p-12 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden min-h-[300px]">
            <div className="scanner-line" />
            <div className="w-16 h-16 rounded-full bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center text-[#4F8EF7]">
              <FileText size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Reading your resume...</h3>
              <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">Extracting typography, mapping text keywords, and querying the AI compatibility matrices.</p>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
            {/* Tab Bar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', display: 'inline-flex', marginBottom: '24px' }}>
              <button onClick={() => setActiveTab('match')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  background: activeTab === 'match' ? '#1F2937' : 'transparent',
                  color: activeTab === 'match' ? '#FFFFFF' : '#9CA3AF',
                  boxShadow: activeTab === 'match' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}>
                Match Analysis
              </button>
              <button onClick={() => setActiveTab('ats')}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  background: activeTab === 'ats' ? '#1F2937' : 'transparent',
                  color: activeTab === 'ats' ? '#FFFFFF' : '#9CA3AF',
                  boxShadow: activeTab === 'ats' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}>
                <Cpu size={14} /> ATS Simulator
              </button>
            </div>

            {activeTab === 'match' && (
              <>
            {/* TOP HERO SECTION */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-stretch gap-8">
                {/* Column 1: Score Ring */}
                <div className="flex flex-col items-center justify-center flex-shrink-0">
                  <div className="relative w-[180px] h-[180px] flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="90" cy="90" r="72" className="stroke-gray-800/50" strokeWidth="8" fill="transparent" />
                      <circle cx="90" cy="90" r="72" stroke={scoreColor(results.matchScore).stroke} strokeWidth="8" fill="transparent"
                        strokeDasharray={2 * Math.PI * 72}
                        strokeDashoffset={2 * Math.PI * 72 * (1 - animatedScore / 100)}
                        style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-syne text-[52px] text-[#FFFFFF] leading-none">{animatedScore}<span className="text-[28px]">%</span></span>
                      <span className="text-[13px] text-[#9CA3AF]">Match Score</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Score Breakdown */}
                <div className="flex-1 space-y-4">
                  <span className="text-[11px] font-semibold text-[#4F8EF7] uppercase tracking-[0.15em] block">Analysis Complete</span>
                  <h3 className="text-[32px] font-bold font-syne text-[#FFFFFF] leading-tight">Match Score for {jobRole}</h3>
                  <div className="space-y-3 pt-2">
                    {breakdownLabels.map((label, i) => {
                      const key = breakdownKeys[i];
                      const val = results.scoreBreakdown[key];
                      const max = breakdownMax[i];
                      const pct = Math.min(100, (val / max) * 100);
                      return (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="text-xs text-[#E5E7EB] w-24">{label}</span>
                          <div className="w-full bg-[rgba(255,255,255,0.08)] rounded-full h-1">
                            <div className="h-1 rounded-full transition-all duration-1000" style={{ width: showBars ? `${pct}%` : '0%', backgroundColor: scoreColor(results.matchScore).stroke }} />
                          </div>
                          <span className="text-xs text-[#9CA3AF] w-12 text-right whitespace-nowrap">{val}/{max}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Verdict Badge */}
                {(() => {
                  const vc = verdictConfig(results.verdictType);
                  const VIcon = vc.icon;
                  return (
                    <div className="flex-shrink-0 flex items-center">
                      <div className="p-5 rounded-2xl border min-w-[200px] text-center" style={{ borderColor: vc.border, background: vc.bg }}>
                        <div className="flex justify-center mb-2">
                          <VIcon size={32} style={{ color: vc.color }} />
                        </div>
                        <p className="text-[15px] font-bold" style={{ color: vc.color }}>{results.verdictType}</p>
                        <p className="text-[13px] text-[#D1D5DB] mt-1 leading-relaxed">{results.overallVerdict}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* THREE COLUMN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Skills You Have */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <h4 className="text-[11px] font-bold text-[#10B981] uppercase tracking-[0.1em]">Skills You Have</h4>
                  <span className="ml-auto text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.15)] px-2 py-0.5 rounded-full">{results.matchedSkills.length}</span>
                </div>
                {results.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {results.matchedSkills.map((skill, i) => (
                      <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="text-[13px] text-[#FFFFFF] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] rounded-[20px] px-[14px] py-[5px]">
                        <span className="text-[#10B981]">✓ </span>{skill}
                      </motion.span>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#9CA3AF] italic">No matching keywords found.</p>}
              </motion.div>

              {/* Card 2: Skills to Add */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <h4 className="text-[11px] font-bold text-[#EF4444] uppercase tracking-[0.1em]">Skills to Add</h4>
                  <span className="ml-auto text-[10px] font-bold text-[#EF4444] bg-[rgba(239,68,68,0.15)] px-2 py-0.5 rounded-full">{results.missingSkills.length}</span>
                </div>
                {results.missingSkills.length > 0 ? (
                  <div className="space-y-2">
                    {results.missingSkills.map((item, i) => {
                      const pc = priorityColor(item.priority);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="p-3 rounded-lg border-l-[3px] bg-[rgba(255,255,255,0.02)]" style={{ borderColor: pc.color }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: pc.bg, color: pc.color }}>{item.priority.toUpperCase()}</span>
                          </div>
                          <p className="text-[15px] font-semibold text-[#FFFFFF]">{item.skill}</p>
                          <p className="text-[13px] text-[#9CA3AF] leading-normal mt-0.5">{item.reason}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : <p className="text-xs text-[#9CA3AF] italic">Excellent! No major technical gaps found.</p>}
              </motion.div>

              {/* Card 3: How to Improve */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4F8EF7]" />
                  <h4 className="text-[11px] font-bold text-[#4F8EF7] uppercase tracking-[0.1em]">How to Improve</h4>
                </div>
                {results.recommendations.length > 0 ? (
                  <div className="space-y-2.5">
                    {results.recommendations.map((rec, i) => {
                      const ic = priorityColor(rec.impact);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="p-3.5 rounded-lg border-l-[3px] border-[#4F8EF7] bg-[rgba(79,142,247,0.03)]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ic.bg, color: ic.color }}>{rec.impact.toUpperCase()}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#4F8EF7] bg-[rgba(79,142,247,0.12)]">{rec.category}</span>
                          </div>
                          <p className="text-[14px] text-[#D1D5DB] leading-relaxed">{rec.tip}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : <p className="text-xs text-[#9CA3AF] italic">No recommendations needed.</p>}
              </motion.div>
            </div>

            {/* BOTTOM ROW: What to do next */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-5">
              <h3 className="text-[18px] font-bold font-syne text-[#FFFFFF]">What to do next</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="rounded-xl p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-[14px] font-semibold text-[#4F8EF7] mb-2">This week</h4>
                  {results.nextSteps?.thisWeek ? (
                    <ul className="space-y-1.5">
                      {results.nextSteps.thisWeek.map((step, i) => (
                        <li key={i} className="text-[13px] text-[#9CA3AF] leading-relaxed flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#4F8EF7] mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#9CA3AF] leading-relaxed">Update your resume with the 2 highest priority missing skills. Focus on keywords marked as High impact to close the biggest gaps first.</p>
                  )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="rounded-xl p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-[14px] font-semibold text-[#4F8EF7] mb-2">This month</h4>
                  {results.nextSteps?.thisMonth ? (
                    <ul className="space-y-1.5">
                      {results.nextSteps.thisMonth.map((step, i) => (
                        <li key={i} className="text-[13px] text-[#9CA3AF] leading-relaxed flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#4F8EF7] mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#9CA3AF] leading-relaxed">Start learning the missing skills most relevant to your target role. Consider online courses, certifications, or hands-on projects.</p>
                  )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="rounded-xl p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-[14px] font-semibold text-[#4F8EF7] mb-2">Before applying</h4>
                  {results.nextSteps?.beforeApplying ? (
                    <ul className="space-y-1.5">
                      {results.nextSteps.beforeApplying.map((step, i) => (
                        <li key={i} className="text-[13px] text-[#9CA3AF] leading-relaxed flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#4F8EF7] mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#9CA3AF] leading-relaxed">Ensure your resume includes quantified achievements, uses strong action verbs, and follows ATS-friendly formatting throughout.</p>
                  )}
                </motion.div>
              </div>
            </motion.div>
            </>
            )}

            {activeTab === 'ats' && resumeText && (
              <ATSSimulator resumeText={resumeText} jobRole={jobRole} />
            )}

            {/* Analyze Another Role Button */}
            <div className="flex justify-center pt-2">
              <button onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-[#FFFFFF] rounded-xl border border-[rgba(255,255,255,0.15)] hover:bg-[#111827] transition-all cursor-pointer">
                <ChevronLeft size={16} /> Analyze Another Role
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
