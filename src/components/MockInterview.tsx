import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Settings, Mic, MicOff, ArrowRight, Award, AlertCircle,
  CheckCircle, ChevronRight, RefreshCw, Trophy, Volume2, Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface SpeechRecognitionEvent { resultIndex: number; results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean } }; }
interface SpeechRecognitionErrorEvent { error: string; }
interface SpeechRecognitionInstance { continuous: boolean; interimResults: boolean; lang: string; onstart: () => void; onresult: (event: SpeechRecognitionEvent) => void; onerror: (event: SpeechRecognitionErrorEvent) => void; onend: () => void; start: () => void; stop: () => void; }
declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance; } }

const AnswerBank = React.lazy(() => import('./AnswerBank'));

interface StarAnalysis { applicable: boolean; situation: string; task: string; action: string; result: string; }
interface AnswerFeedback { score: number; scoreLabel: string; strengths: string[]; improvements: string[]; idealAnswerDirection: string; starAnalysis: StarAnalysis; keywordsMissed: string[]; encouragement: string; }
interface QuestionItem { id: number; question: string; type: string; skillTested: string; difficulty: string; hint: string; }
interface QuestionBreakdown { questionNumber: number; score: number; oneLineFeedback: string; }
interface StudyPlan { week1: string; week2: string; week3: string; beforeNextInterview: string; }
interface StrengthItem { strength: string; evidence: string; }
interface FocusArea { area: string; suggestion: string; resources: string; }
interface FinalReport { overallScore: number; overallGrade: string; overallVerdict: string; readinessLevel: string; topStrengths: StrengthItem[]; focusAreas: FocusArea[]; keyTip: string; questionBreakdown: QuestionBreakdown[]; studyPlan: StudyPlan; estimatedReadyDate: string; }
interface QAHistoryItem { question: string; answer: string; score?: number; feedback?: AnswerFeedback; questionType?: string; skillTested?: string; }

export const MockInterview: React.FC = () => {
  const [role, setRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState('1–3 years');
  const [type, setType] = useState('Mixed');
  const [stage, setStage] = useState<'setup' | 'interview' | 'feedback' | 'scorecard'>('setup');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<AnswerFeedback | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [interviewFocus, setInterviewFocus] = useState('');
  const [activeTab, setActiveTab] = useState<'practice' | 'bank'>('practice');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
      rec.onstart = () => { setIsRecording(true); toast.success("Voice recording active."); };
      rec.onresult = (e: SpeechRecognitionEvent) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
        }
        if (final) setUserAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + final);
      };
      rec.onerror = (e: SpeechRecognitionErrorEvent) => { if (e.error !== 'no-speech') { toast.error(`Voice error: ${e.error}. Please type.`); setIsRecording(false); } };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      if (!isRecording) {
        setIsRecording(true);
        toast.success("Voice recording simulated...");
        setTimeout(() => {
          setUserAnswer(prev => prev + (prev === '' ? '' : ' ') + "In my recent role, I worked on scaling API endpoints and optimizing load times by 20%.");
          setIsRecording(false);
        }, 2000);
      } else setIsRecording(false);
      return;
    }
    if (isRecording) recognitionRef.current.stop();
    else { setUserAnswer(''); recognitionRef.current.start(); }
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    const targetRole = role === 'Custom' ? customRole : role;
    const lt = toast.loading("Generating interview questions...");
    try {
      const res = await fetch('/api/interview/generate-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole, experience, type }),
      });
      toast.dismiss(lt);
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      setQuestions(data.questions || []);
      setInterviewFocus(data.interviewFocus || '');
      setCurrentQIdx(0); setQaHistory([]); setStage('interview'); startTimeRef.current = new Date();
      toast.success("Interview questions generated!");
    } catch { toast.dismiss(lt); toast.error("Failed to start interview. Try again."); }
    finally { setIsGenerating(false); }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    setIsSubmitting(true);
    const targetRole = role === 'Custom' ? customRole : role;
    const currentQ = questions[currentQIdx];
    const lt = toast.loading("Evaluating your answer...");
    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole, experience, question: currentQ.question,
          questionType: currentQ.type, skillTested: currentQ.skillTested,
          hint: currentQ.hint, answer: userAnswer
        }),
      });
      toast.dismiss(lt);
      if (!res.ok) throw new Error("Failed to evaluate answer");
      const data = await res.json();
      setCurrentFeedback(data);
      setQaHistory(prev => [...prev, { question: currentQ.question, answer: userAnswer, score: data.score, feedback: data, questionType: currentQ.type, skillTested: currentQ.skillTested }]);
      setStage('feedback');
    } catch { toast.dismiss(lt); toast.error("Failed to grade answer."); }
    finally { setIsSubmitting(false); }
  };

  const handleNextQuestion = async () => {
    setUserAnswer(''); setCurrentFeedback(null);
    if (currentQIdx < questions.length - 1) { setCurrentQIdx(prev => prev + 1); setStage('interview'); }
    else {
      setIsSubmitting(true);
      const targetRole = role === 'Custom' ? customRole : role;
      const lt = toast.loading("Compiling your final scorecard...");
      try {
        const res = await fetch('/api/interview/final-report', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: targetRole, experience, questionsAndAnswers: qaHistory.map(i => ({ question: i.question, answer: i.answer, score: i.score, questionType: i.questionType, skillTested: i.skillTested })) }),
        });
        toast.dismiss(lt);
        if (!res.ok) throw new Error("Failed to compile final report");
        const data = await res.json();
        setFinalReport(data); setStage('scorecard'); saveSession(data, qaHistory); toast.success("Interview completed! Scorecard compiled.");
      } catch { toast.dismiss(lt); toast.error("Failed to compile score report."); }
      finally { setIsSubmitting(false); }
    }
  };

  useEffect(() => {
    if (finalReport && stage === 'scorecard') {
      setAnimatedScore(0);
      let cur = 0;
      const target = finalReport.overallScore;
      const step = Math.ceil(target / 45);
      const iv = setInterval(() => {
        cur += step; if (cur >= target) { setAnimatedScore(target); clearInterval(iv); } else setAnimatedScore(cur);
      }, 25);
      return () => clearInterval(iv);
    }
  }, [finalReport, stage]);

  const handleReset = () => { setStage('setup'); setUserAnswer(''); setCurrentFeedback(null); setFinalReport(null); setQuestions([]); setCurrentQIdx(0); setQaHistory([]); setInterviewFocus(''); };

  const calculateDuration = useCallback(() => {
    if (!startTimeRef.current) return '0 min';
    const diff = Date.now() - startTimeRef.current.getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }, []);

  const saveSession = useCallback((report: FinalReport, history: QAHistoryItem[]) => {
    try {
      const key = 'hireboost_sessions';
      const existing = localStorage.getItem(key);
      const sessions = existing ? JSON.parse(existing) : [];
      const newSession = {
        sessionId: uuidv4(),
        date: new Date().toISOString(),
        jobRole: role === 'Custom' ? customRole : role,
        experienceLevel: experience,
        interviewType: type,
        overallScore: report.overallScore,
        overallGrade: report.overallGrade,
        readinessLevel: report.readinessLevel,
        duration: calculateDuration(),
        questionsAndAnswers: history,
        topStrengths: report.topStrengths,
        focusAreas: report.focusAreas,
        keyTip: report.keyTip,
        studyPlan: report.studyPlan,
      };
      sessions.unshift(newSession);
      const trimmed = sessions.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Could not save session:', error);
    }
  }, [role, customRole, experience, type, calculateDuration]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return { stroke: '#10B981', text: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
    if (score >= 5) return { stroke: '#F59E0B', text: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
    return { stroke: '#EF4444', text: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
  };

  const overallColor = finalReport ? getScoreColor(finalReport.overallScore / 10) : { stroke: '#4F8EF7' };

  const gradeColor = (grade: string) => {
    if (grade === 'A') return { text: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
    if (grade === 'B') return { text: '#4F8EF7', bg: 'rgba(79,142,247,0.15)', border: 'rgba(79,142,247,0.3)' };
    if (grade === 'C') return { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
    return { text: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' };
  };

  const starPill = (label: string, status: string) => {
    const isOk = status === 'Present';
    const isPartial = status === 'Partial';
    const color = isOk ? '#10B981' : isPartial ? '#F59E0B' : '#EF4444';
    const bg = isOk ? 'rgba(16,185,129,0.12)' : isPartial ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
    const icon = isOk ? '✓' : isPartial ? '~' : '✗';
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: bg, color }}>
        {icon} {label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tab bar */}
      <div className="flex mb-6 border-b border-white/5">
        <button onClick={() => setActiveTab('practice')}
          className={`pb-3 px-4 text-sm font-medium cursor-pointer transition-colors relative ${activeTab === 'practice' ? 'text-[#F9FAFB]' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>
          Practice Interview
          {activeTab === 'practice' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4F8EF7] to-[#A78BFA] rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('bank')}
          className={`pb-3 px-4 text-sm font-medium cursor-pointer transition-colors relative ${activeTab === 'bank' ? 'text-[#F9FAFB]' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>
          Answer Bank
          {activeTab === 'bank' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4F8EF7] to-[#A78BFA] rounded-full" />}
        </button>
      </div>

      {activeTab === 'practice' ? (
      <AnimatePresence mode="wait">
        {stage === 'setup' && !isGenerating && (
          <motion.div key="setup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-[520px] mx-auto space-y-8">
            <h2 className="text-[32px] font-bold font-syne text-[#FFFFFF] text-center">Set Up Your Interview</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-7 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Job Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full input-field text-sm">
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                  <option value="Designer">Designer</option>
                  <option value="Custom">Custom Role...</option>
                </select>
              </div>
              {role === 'Custom' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Enter Custom Position</label>
                  <input type="text" placeholder="e.g. iOS Developer" value={customRole} onChange={e => setCustomRole(e.target.value)} className="w-full input-field text-sm" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Experience</label>
                  <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full input-field text-sm">
                    <option value="Fresher">Entry Level</option>
                    <option value="1–3 years">Junior (1-3)</option>
                    <option value="3–5 years">Mid-Level (3-5)</option>
                    <option value="Senior">Senior (5+)</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#E5E7EB] uppercase">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full input-field text-sm">
                    <option value="Behavioral">Behavioral</option>
                    <option value="Technical">Technical</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
              </div>
              <button onClick={handleGenerateQuestions} disabled={role === 'Custom' && !customRole.trim()} className={`w-full h-12 text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${!(role === 'Custom' && !customRole.trim()) ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                Generate Questions <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {isGenerating && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#111827] border border-white/5 rounded-2xl p-12 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
              <Settings className="animate-spin" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Assembling Interview Round...</h3>
              <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">Compiling 7 targeted questions for your role.</p>
            </div>
          </motion.div>
        )}

        {stage === 'interview' && !isSubmitting && (
          <motion.div key="interview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#9CA3AF]">
              <span>Question {currentQIdx + 1} of {questions.length}</span>
              <span>{Math.round(((currentQIdx + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4F8EF7] to-[#A78BFA] transition-all duration-300 rounded-full" style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="glass-deep rounded-[20px] p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">AI</div>
                <span className="text-[10px] font-bold tracking-widest text-[#A78BFA] uppercase">Interviewer Question</span>
              </div>
              <p className="text-[20px] font-bold font-syne text-[#FFFFFF] leading-relaxed">{questions[currentQIdx]?.question || ''}</p>
              {questions[currentQIdx]?.skillTested && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider">Skill tested:</span>
                  <span className="text-[12px] text-[#9CA3AF] bg-[rgba(79,142,247,0.1)] px-2.5 py-0.5 rounded-full">{questions[currentQIdx].skillTested}</span>
                </div>
              )}
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="answer-input" className="text-xs font-semibold text-[#E5E7EB] uppercase">Your Answer</label>
                <button onClick={toggleRecording} className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer border transition-colors ${isRecording ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Stop' : 'Speak'}</span>
                </button>
              </div>
              <textarea id="answer-input" rows={5} placeholder="Type your answer here..." value={userAnswer} onChange={e => setUserAnswer(e.target.value)} className="w-full input-field text-sm" style={{ minHeight: '140px' }} />
              <div className="flex justify-end">
                <span className="text-xs text-[#9CA3AF]">{userAnswer.length} characters</span>
              </div>

              {isRecording && (
                <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3">
                  <div className="flex items-end justify-center gap-[2px] h-8 w-full max-w-[200px]">
                    {[0.5,0.3,0.7,0.4,0.2,0.8,0.5,0.6,0.3,0.7,0.4,0.2,0.9,0.4].map((v, i) => (
                      <div key={i} className="w-[4px] bg-[rgba(167,139,250,0.5)] rounded-full"
                        style={{ height: `${v * 100}%`, animation: `waveform ${0.6 + v * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.08}s`, transformOrigin: 'bottom' }} />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#6B7280] font-medium">Voice simulation active</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button onClick={handleReset} className="px-4 py-2 text-xs font-semibold text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer">Cancel</button>
                <button onClick={handleSubmitAnswer} disabled={!userAnswer.trim()} className={`px-6 py-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${userAnswer.trim() ? 'btn-primary' : 'opacity-40 bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'}`}>
                  Submit Answer <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isSubmitting && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#111827] border border-white/5 rounded-2xl p-12 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center text-[#4F8EF7]">
              <Award size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-syne text-[#F9FAFB]">Evaluating Response...</h3>
              <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">Analyzing language and grading metrics.</p>
            </div>
          </motion.div>
        )}

        {stage === 'feedback' && currentFeedback && (
          <motion.div key="feedback" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-[#A78BFA]">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold tracking-widest text-[#A78BFA] uppercase">Answer Assessment</span>
                <h4 className="text-base font-bold font-syne text-[#F9FAFB]">Question {currentQIdx + 1} Feedback</h4>
                <span className="text-[11px] text-[#9CA3AF]">{currentFeedback.scoreLabel}</span>
              </div>
              <div className="relative w-[80px] h-[80px] flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" className="stroke-gray-800" strokeWidth="5" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke={getScoreColor(currentFeedback.score).stroke} strokeWidth="5" fill="transparent" strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - currentFeedback.score / 10)} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[28px] font-bold font-syne" style={{ color: getScoreColor(currentFeedback.score).text }}>{currentFeedback.score}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-900/40 border border-white/5 rounded-xl text-xs text-[#9CA3AF]">
              <span className="font-semibold text-[#F9FAFB]">Question:</span> "{questions[currentQIdx]?.question || ''}"
            </div>

            {currentFeedback.starAnalysis?.applicable && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-3">
                <h5 className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">STAR Method Analysis</h5>
                <div className="flex flex-wrap gap-2">
                  {starPill('Situation', currentFeedback.starAnalysis.situation)}
                  {starPill('Task', currentFeedback.starAnalysis.task)}
                  {starPill('Action', currentFeedback.starAnalysis.action)}
                  {starPill('Result', currentFeedback.starAnalysis.result)}
                </div>
              </div>
            )}

            {currentFeedback.keywordsMissed && currentFeedback.keywordsMissed.length > 0 && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-3">
                <h5 className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">Keywords Missed</h5>
                <div className="flex flex-wrap gap-2">
                  {currentFeedback.keywordsMissed.map((kw, i) => (
                    <span key={i} className="text-[11px] text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] px-2.5 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[#10B981] font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle size={14} /> Strengths
                </div>
                <ul className="space-y-2.5">
                  {currentFeedback.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-[#D1D5DB] leading-relaxed flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#10B981] mt-1.5 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[#F59E0B] font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} /> Improvements
                </div>
                <ul className="space-y-2.5">
                  {currentFeedback.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-[#D1D5DB] leading-relaxed flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-2.5">
              <h5 className="text-xs font-bold font-syne text-[#F9FAFB] uppercase tracking-wider">Ideal Answer Direction</h5>
              <p className="text-sm text-[#9CA3AF] leading-relaxed italic">{currentFeedback.idealAnswerDirection}</p>
            </div>

            {currentFeedback.encouragement && (
              <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-2xl p-4 flex items-start gap-3">
                <Trophy size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#D1D5DB] leading-relaxed">{currentFeedback.encouragement}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={handleNextQuestion} className="px-6 py-3.5 btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                <span>{currentQIdx < questions.length - 1 ? 'Next Question →' : 'Complete Assessment'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'scorecard' && finalReport && (
          <motion.div key="scorecard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="relative">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="confetti-dot absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: '40%',
                    background: [`#4F8EF7`, `#A78BFA`, `#10B981`, `#F59E0B`, `#EC4899`][i % 5],
                    '--tx': `${(Math.random() - 0.5) * 200}px`,
                    '--ty': `${-100 - Math.random() * 200}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  } as React.CSSProperties}
                />
              ))}
              <h2 className="text-[40px] font-bold font-syne text-[#FFFFFF] text-center">Interview Complete</h2>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 flex flex-col items-center gap-6">
              <div className="flex items-center gap-8">
                <div className="relative w-[220px] h-[220px]">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="110" cy="110" r="90" className="stroke-gray-800/50" strokeWidth="10" fill="transparent" />
                    <circle cx="110" cy="110" r="90" stroke={overallColor.stroke} strokeWidth="10" fill="transparent"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - animatedScore / 100)}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[48px] font-bold font-syne text-[#F9FAFB]">{animatedScore}<span className="text-2xl">%</span></span>
                    <span className="text-sm text-[#D1D5DB] font-medium">Overall Rating</span>
                  </div>
                </div>
                {finalReport.overallGrade && (() => {
                  const gc = gradeColor(finalReport.overallGrade);
                  return (
                    <div className="flex flex-col items-center">
                      <div className="w-[80px] h-[80px] rounded-2xl flex items-center justify-center" style={{ background: gc.bg, border: `2px solid ${gc.border}` }}>
                        <span className="text-[42px] font-bold font-syne" style={{ color: gc.text }}>{finalReport.overallGrade}</span>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] mt-1 uppercase tracking-wider">Grade</span>
                    </div>
                  );
                })()}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold font-syne text-[#F9FAFB]">{role} Interview</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">{finalReport.overallVerdict}</p>
                <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full" style={{
                  background: finalReport.readinessLevel === 'Ready to Apply' ? 'rgba(16,185,129,0.15)' : finalReport.readinessLevel === 'Almost Ready' ? 'rgba(79,142,247,0.15)' : 'rgba(245,158,11,0.15)',
                  color: finalReport.readinessLevel === 'Ready to Apply' ? '#10B981' : finalReport.readinessLevel === 'Almost Ready' ? '#4F8EF7' : '#F59E0B'
                }}>{finalReport.readinessLevel}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-[#10B981] font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle size={16} /> Top Strengths
                </div>
                <ul className="space-y-3">
                  {finalReport.topStrengths.map((item, i) => (
                    <li key={i} className="text-xs text-[#D1D5DB] leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-[#F9FAFB]">{item.strength}</span>
                        {item.evidence && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.evidence}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-[#F59E0B] font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle size={16} /> Focus Areas
                </div>
                <ul className="space-y-3">
                  {finalReport.focusAreas.map((item, i) => (
                    <li key={i} className="text-xs text-[#D1D5DB] leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-[#F9FAFB]">{item.area}</span>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.suggestion}</p>
                        {item.resources && <span className="inline-block mt-1 text-[10px] text-[#4F8EF7] bg-[rgba(79,142,247,0.1)] px-2 py-0.5 rounded-full">{item.resources}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {finalReport.questionBreakdown && finalReport.questionBreakdown.length > 0 && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold font-syne text-[#FFFFFF] border-b border-white/5 pb-3">Question Breakdown</h4>
                <div className="space-y-2">
                  {finalReport.questionBreakdown.map((qb, i) => {
                    const sc = getScoreColor(qb.score);
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(255,255,255,0.02)]">
                        <span className="text-[10px] font-bold text-[#9CA3AF] w-6">Q{qb.questionNumber}</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full">
                            <div className="h-1.5 rounded-full" style={{ width: `${qb.score * 10}%`, background: sc.stroke }} />
                          </div>
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: sc.text }}>{qb.score}/10</span>
                        <p className="text-[11px] text-[#9CA3AF] flex-1 hidden md:block">{qb.oneLineFeedback}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-[rgba(79,142,247,0.08)] border border-[rgba(79,142,247,0.2)] rounded-2xl p-5 flex items-start gap-4">
              <LightbulbIcon />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#4F8EF7] uppercase tracking-wider">Key Tip</span>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{finalReport.keyTip}</p>
              </div>
            </div>

            {finalReport.studyPlan && (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-5">
                <h4 className="text-sm font-bold font-syne text-[#FFFFFF] border-b border-white/5 pb-3">Your 4-Week Study Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Week 1', text: finalReport.studyPlan.week1 },
                    { label: 'Week 2', text: finalReport.studyPlan.week2 },
                    { label: 'Week 3', text: finalReport.studyPlan.week3 },
                    { label: 'Final', text: finalReport.studyPlan.beforeNextInterview },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                      <div className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider mb-1.5">{item.label}</div>
                      <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {finalReport.estimatedReadyDate && (
              <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-2xl p-5 flex items-center gap-4">
                <Trophy size={24} className="text-[#10B981] flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Estimated Ready Date</span>
                  <p className="text-sm text-[#D1D5DB] mt-0.5">{finalReport.estimatedReadyDate}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <button onClick={handleReset} className="px-6 py-3.5 btn-ghost text-xs font-semibold flex items-center gap-2 cursor-pointer">
                <RefreshCw size={14} /> Retake Interview
              </button>
              <button onClick={handleReset} className="px-6 py-3.5 btn-primary text-xs flex items-center gap-2 cursor-pointer">
                Try Another Role
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      ) : (
        <React.Suspense fallback={<div className="text-center py-20 text-gray-500 text-sm">Loading Answer Bank...</div>}>
          <AnswerBank
            onStartPractice={() => { setActiveTab('practice'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onPreFill={(r, lvl, t) => { setRole('Custom'); setCustomRole(r); if (lvl) setExperience(lvl); if (t) setType(t); }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

const LightbulbIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);