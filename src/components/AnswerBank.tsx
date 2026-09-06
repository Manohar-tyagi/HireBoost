import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronDown, ChevronUp, Star, BarChart3, BookOpen,
  TrendingUp, TrendingDown, Minus, Target, RefreshCw, MessageSquare,
  CheckCircle, AlertCircle, Lightbulb, ArrowRight, X, Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StarAnalysis { applicable: boolean; situation: string; task: string; action: string; result: string; }
interface AnswerFeedback { score: number; scoreLabel: string; strengths: string[]; improvements: string[]; idealAnswerDirection: string; starAnalysis: StarAnalysis; keywordsMissed: string[]; encouragement: string; }
interface QAHistoryItem { question: string; answer: string; score?: number; feedback?: AnswerFeedback; questionType?: string; skillTested?: string; }
interface StrengthItem { strength: string; evidence: string; }
interface FocusArea { area: string; suggestion: string; resources: string; }
interface StudyPlan { week1: string; week2: string; week3: string; beforeNextInterview: string; }
interface SavedSession {
  sessionId: string; date: string; jobRole: string; experienceLevel: string;
  interviewType: string; overallScore: number; overallGrade: string;
  readinessLevel: string; duration: string; questionsAndAnswers: QAHistoryItem[];
  topStrengths: StrengthItem[]; focusAreas: FocusArea[]; keyTip: string; studyPlan: StudyPlan;
}

interface Props {
  onStartPractice: () => void;
  onPreFill: (role: string, level?: string, type?: string) => void;
}

const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getScoreColor(score: number) {
  if (score >= 7) return { stroke: '#10B981', text: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', fill: 'rgba(16,185,129,0.08)' };
  if (score >= 5) return { stroke: '#F59E0B', text: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', fill: 'rgba(245,158,11,0.08)' };
  return { stroke: '#EF4444', text: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', fill: 'rgba(239,68,68,0.08)' };
}

function gradeColor(grade: string) {
  if (grade === 'A') return { text: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
  if (grade === 'B') return { text: '#4F8EF7', bg: 'rgba(79,142,247,0.15)', border: 'rgba(79,142,247,0.3)' };
  if (grade === 'C') return { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  return { text: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' };
}

const AnswerBank: React.FC<Props> = ({ onStartPractice, onPreFill }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [subTab, setSubTab] = useState<'sessions' | 'review' | 'progress'>('sessions');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'low' | 'behavioral' | 'technical'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [practiceModal, setPracticeModal] = useState<{ question: string; lastScore: number } | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceSubmitting, setPracticeSubmitting] = useState(false);
  const [practiceResult, setPracticeResult] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const getSessions = () => {
    try {
      const data = localStorage.getItem('hireboost_sessions');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  };

  useEffect(() => { setSessions(getSessions()); }, []);

  const refreshSessions = () => setSessions(getSessions());

  const stats = useMemo(() => {
    if (sessions.length === 0) return { total: 0, avgScore: 0, bestScore: 0, mostPracticed: '' };
    const total = sessions.length;
    const avgScore = Math.round(sessions.reduce((s, se) => s + se.overallScore, 0) / total);
    const bestScore = Math.max(...sessions.map(s => s.overallScore));
    const roleCount: Record<string, number> = {};
    sessions.forEach(s => { roleCount[s.jobRole] = (roleCount[s.jobRole] || 0) + 1; });
    const mostPracticed = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return { total, avgScore, bestScore, mostPracticed };
  }, [sessions]);

  const reviewSession = useMemo(() => {
    if (!reviewSessionId) return null;
    return sessions.find(s => s.sessionId === reviewSessionId) || null;
  }, [reviewSessionId, sessions]);

  const filteredQuestions = useMemo(() => {
    if (!reviewSession) return [];
    let qs = reviewSession.questionsAndAnswers.map((qa, i) => ({ ...qa, index: i }));
    if (filterType === 'low') qs = qs.filter(q => (q.score ?? 5) <= 5);
    if (filterType === 'behavioral') qs = qs.filter(q => (q.questionType || '').toLowerCase().includes('behavioral'));
    if (filterType === 'technical') qs = qs.filter(q => (q.questionType || '').toLowerCase().includes('technical'));
    return qs;
  }, [reviewSession, filterType]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return { month: monthNames[d.getMonth()], day: d.getDate(), year: d.getFullYear(), full: `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` };
  };

  const handleClearAll = () => {
    try {
      localStorage.removeItem('hireboost_sessions');
      setSessions([]);
      setShowClearConfirm(false);
      toast.success('All sessions cleared');
    } catch { toast.error('Could not clear history'); }
  };

  const handlePracticeQuestion = async () => {
    if (!practiceModal || !practiceAnswer.trim()) return;
    setPracticeSubmitting(true);
    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: reviewSession?.jobRole || 'Software Engineer',
          experience: reviewSession?.experienceLevel || '1–3 years',
          question: practiceModal.question,
          questionType: 'Mixed',
          skillTested: 'General',
          hint: '',
          answer: practiceAnswer,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error('API error');
      setPracticeResult(data.score);
      toast.success('Answer evaluated!');
    } catch {
      toast.error('Failed to evaluate');
      setPracticeResult(practiceModal.lastScore);
    } finally {
      setPracticeSubmitting(false);
    }
  };

  const getQuestionTypeScore = (type: string) => {
    const all = sessions.flatMap(s => s.questionsAndAnswers.filter(q => (q.questionType || '').toLowerCase().includes(type.toLowerCase())));
    if (all.length === 0) return 0;
    return Math.round(all.reduce((s, q) => s + (q.score || 0), 0) / all.length);
  };

  const blindSpots = useMemo(() => {
    const kwMap: Record<string, { count: number; sessions: Set<string> }> = {};
    sessions.forEach(s => {
      s.questionsAndAnswers.forEach(qa => {
        (qa.feedback?.keywordsMissed || []).forEach(kw => {
          if (!kwMap[kw]) kwMap[kw] = { count: 0, sessions: new Set() };
          kwMap[kw].count += 1;
          kwMap[kw].sessions.add(s.sessionId);
        });
      });
    });
    return Object.entries(kwMap)
      .map(([kw, v]) => ({ keyword: kw, count: v.count, sessionCount: v.sessions.size }))
      .sort((a, b) => b.sessionCount - a.sessionCount || b.count - a.count)
      .slice(0, 5);
  }, [sessions]);

  const chartData = useMemo(() => {
    if (sessions.length < 2) return null;
    const sorted = [...sessions].reverse();
    const scores = sorted.map(s => s.overallScore);
    const labels = sorted.map(s => {
      const d = new Date(s.date);
      return `${monthNames[d.getMonth()]} ${d.getDate()}`;
    });
    const max = 100;
    const min = 0;
    const range = max - min;
    const w = 600;
    const h = 160;
    const px = 40;
    const py = 10;
    const chartW = w - px * 2;
    const chartH = h - py * 2;
    const points = scores.map((sc, i) => {
      const x = px + (i / (scores.length - 1)) * chartW;
      const y = py + chartH - ((sc - min) / range) * chartH;
      return { x, y, score: sc, label: labels[i] };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const trend = scores[scores.length - 1] > scores[0] ? 'up' : scores[scores.length - 1] < scores[0] ? 'down' : 'flat';
    return { points, linePath, trend, scores, labels, w, h };
  }, [sessions]);

  const questionTypes = useMemo(() => {
    const types = ['Behavioral', 'Technical', 'Situational'];
    return types.map(t => ({ type: t, score: getQuestionTypeScore(t) }));
  }, [sessions]);

  const roleHistory = useMemo(() => {
    const map: Record<string, { sessions: SavedSession[]; scores: number[]; roles: string[] }> = {};
    sessions.forEach(s => {
      const key = s.jobRole;
      if (!map[key]) map[key] = { sessions: [], scores: [], roles: [] };
      map[key].sessions.push(s);
      map[key].scores.push(s.overallScore);
    });
    return Object.entries(map).map(([role, data]) => ({
      role,
      count: data.sessions.length,
      bestScore: Math.max(...data.scores),
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    })).sort((a, b) => b.count - a.count);
  }, [sessions]);

  return (
    <div className="w-full">
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-[#111827] border border-white/5 rounded-xl p-1">
        {([
          { id: 'sessions', label: 'Sessions', icon: Clock },
          { id: 'review', label: 'Question Review', icon: Search },
          { id: 'progress', label: 'Progress', icon: BarChart3 },
        ] as const).map(st => {
          const Icon = st.icon;
          const isActive = subTab === st.id;
          return (
            <button key={st.id} onClick={() => setSubTab(st.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${isActive ? 'bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/20' : 'text-[#9CA3AF] hover:text-white'}`}>
              <Icon size={16} /> {st.label}
            </button>
          );
        })}
      </div>

      {/* ===================== SESSIONS ===================== */}
      {subTab === 'sessions' && (
        <>
          {sessions.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
                <rect x="16" y="8" width="48" height="64" rx="4" stroke="#374151" strokeWidth="2" fill="none" />
                <line x1="24" y1="24" x2="56" y2="24" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                <line x1="24" y1="34" x2="56" y2="34" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                <line x1="24" y1="44" x2="48" y2="44" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                <line x1="24" y1="54" x2="44" y2="54" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                <path d="M56 56L64 64" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                <circle cx="56" cy="56" r="8" stroke="#374151" strokeWidth="2" fill="none" />
              </svg>
              <h3 className="text-2xl font-bold font-syne text-white mb-2">No interviews yet</h3>
              <p className="text-sm text-[#9CA3AF] max-w-xs mb-6">Complete your first mock interview to see your history here.</p>
              <button onClick={onStartPractice} className="btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer">
                Start Practice Interview <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Sessions', value: stats.total, color: '#4F8EF7' },
                  { label: 'Average Score', value: `${stats.avgScore}%`, color: '#A78BFA' },
                  { label: 'Best Score', value: `${stats.bestScore}%`, color: '#10B981' },
                  { label: 'Most Practiced', value: stats.mostPracticed || '—', color: '#F59E0B' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                    <div className="text-[28px] font-bold font-syne text-white">{stat.value}</div>
                    <div className="text-xs text-[#9CA3AF] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Session list */}
              <div className="space-y-3">
                {sessions.map(session => {
                  const fd = formatDate(session.date);
                  const sc = getScoreColor(session.overallScore / 10);
                  const gc = gradeColor(session.overallGrade);
                  const isExpanded = expandedId === session.sessionId;
                  return (
                    <motion.div key={session.sessionId} layout
                      onClick={() => setExpandedId(isExpanded ? null : session.sessionId)}
                      style={{ background: '#111827', border: `1px solid ${isExpanded ? 'rgba(79,142,247,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '20px' }}
                      className="cursor-pointer transition-all hover:border-[rgba(79,142,247,0.3)]">
                      <div className="flex items-center gap-4">
                        {/* Calendar date */}
                        <div className="w-[80px] flex-shrink-0 text-center">
                          <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase">{fd.month}</div>
                          <div className="text-[28px] font-bold font-syne text-white leading-none my-0.5">{fd.day}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{fd.year}</div>
                        </div>
                        {/* Center */}
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold font-syne text-white truncate">{session.jobRole}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {[session.interviewType, session.experienceLevel].filter(Boolean).map(tag => (
                              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '20px', padding: '3px 10px', fontSize: '12px' }} className="text-[#9CA3AF]">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-[13px] text-[#9CA3AF] mt-1 flex items-center gap-1">
                            <Clock size={12} /> {session.questionsAndAnswers.length} questions · {session.duration}
                          </div>
                        </div>
                        {/* Score */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="relative w-14 h-14">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="transparent" />
                              <circle cx="28" cy="28" r="22" stroke={sc.stroke} strokeWidth="3" fill="transparent"
                                strokeDasharray={2 * Math.PI * 22}
                                strokeDashoffset={2 * Math.PI * 22 * (1 - session.overallScore / 100)} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold font-syne text-white">{session.overallScore}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg" style={{ background: gc.bg, color: gc.text }}>{session.overallGrade}</span>
                        </div>
                        <ChevronDown size={18} className={`text-[#9CA3AF] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }} className="overflow-hidden">
                            <div className="mt-5 pt-4 border-t border-white/5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-lg p-3">
                                  <h5 className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle size={12} /> Top Strengths
                                  </h5>
                                  <ul className="space-y-1.5">
                                    {session.topStrengths.slice(0, 3).map((str, i) => (
                                      <li key={i} className="text-xs text-[#D1D5DB] flex items-start gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-[#10B981] mt-1.5 flex-shrink-0" />
                                        <span><strong className="text-[#F9FAFB]">{str.strength}</strong>{str.evidence ? ` — ${str.evidence}` : ''}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.12)] rounded-lg p-3">
                                  <h5 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertCircle size={12} /> Focus Areas
                                  </h5>
                                  <ul className="space-y-1.5">
                                    {session.focusAreas.slice(0, 3).map((fa, i) => (
                                      <li key={i} className="text-xs text-[#D1D5DB] flex items-start gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                                        <span><strong className="text-[#F9FAFB]">{fa.area}</strong>{fa.suggestion ? ` — ${fa.suggestion}` : ''}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              {session.keyTip && (
                                <div className="bg-[rgba(79,142,247,0.06)] border border-[rgba(79,142,247,0.15)] rounded-lg p-3 flex items-start gap-2">
                                  <Lightbulb size={14} className="text-[#4F8EF7] flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-[#D1D5DB]">{session.keyTip}</p>
                                </div>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); setReviewSessionId(session.sessionId); setSubTab('review'); }}
                                className="text-xs font-semibold text-[#4F8EF7] bg-[rgba(79,142,247,0.1)] border border-[rgba(79,142,247,0.2)] px-4 py-2 rounded-lg hover:bg-[rgba(79,142,247,0.2)] transition-colors cursor-pointer">
                                Review All Answers →
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Clear All */}
              <div className="text-center pt-4">
                {showClearConfirm ? (
                  <div className="bg-[#111827] border border-red-500/20 rounded-xl p-4 max-w-md mx-auto space-y-3">
                    <p className="text-sm text-[#D1D5DB]">This will delete all {sessions.length} interview sessions. This cannot be undone.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={handleClearAll}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors">
                        Yes, Clear All
                      </button>
                      <button onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-[#9CA3AF] hover:text-red-400 transition-colors cursor-pointer">
                    Clear All History
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ===================== QUESTION REVIEW ===================== */}
      {subTab === 'review' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#9CA3AF]">No sessions available. Complete an interview first.</div>
          ) : (
            <>
              {/* Session selector */}
              <select value={reviewSessionId || ''} onChange={e => { setReviewSessionId(e.target.value || null); setFilterType('all'); }}
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}
                className="w-full text-white focus:outline-none focus:border-[#4F8EF7] transition-colors cursor-pointer">
                <option value="" disabled>Select a session to review</option>
                {sessions.map(s => {
                  const fd = formatDate(s.date);
                  return (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.jobRole} — {fd.full} (Score: {s.overallScore})
                    </option>
                  );
                })}
              </select>

              {reviewSession && (
                <>
                  {/* Filter pills */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'low', label: 'Low Scores' },
                      { id: 'behavioral', label: 'Behavioral' },
                      { id: 'technical', label: 'Technical' },
                    ].map(f => (
                      <button key={f.id} onClick={() => setFilterType(f.id as typeof filterType)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${filterType === f.id ? 'bg-[#4F8EF7]/15 text-[#4F8EF7] border border-[#4F8EF7]/25' : 'bg-white/5 text-[#9CA3AF] border border-white/5 hover:border-white/20'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Question cards */}
                  <div className="space-y-3">
                    {filteredQuestions.map((qa, i) => {
                      const sc = getScoreColor(qa.score || 0);
                      const answerKey = `${reviewSessionId}-${qa.index ?? i}`;
                      const answerExpanded = expandedAnswers.has(answerKey);
                      const toggleAnswer = () => {
                        setExpandedAnswers(prev => {
                          const next = new Set(prev);
                          if (next.has(answerKey)) next.delete(answerKey); else next.add(answerKey);
                          return next;
                        });
                      };
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span style={{ background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', borderRadius: '8px', padding: '4px 10px', fontSize: '14px' }} className="font-bold font-syne">
                                Q{qa.index !== undefined ? qa.index + 1 : i + 1}
                              </span>
                              {qa.questionType && (
                                <span className="text-[11px] text-[#9CA3AF] bg-white/5 px-2 py-0.5 rounded-full">{qa.questionType}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-syne" style={{ color: sc.text }}>{qa.score}/10</span>
                              <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: sc.stroke }}>
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="16" cy="16" r="12" stroke={sc.stroke} strokeWidth="3" fill="transparent"
                                    strokeDasharray={2 * Math.PI * 12}
                                    strokeDashoffset={2 * Math.PI * 12 * (1 - (qa.score || 0) / 10)} />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-lg font-bold font-syne text-white leading-relaxed">{qa.question}</p>

                          {/* Answer - collapsible */}
                          <div>
                            <button onClick={toggleAnswer}
                              className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-white cursor-pointer transition-colors">
                              {answerExpanded ? 'Hide' : 'Show'} Your Answer
                              {answerExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <AnimatePresence>
                              {answerExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px', marginTop: '6px' }}
                                    className="text-sm text-[#D1D5DB] leading-relaxed">{qa.answer}</div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* AI Feedback */}
                          {qa.feedback && (
                            <div className="space-y-2 pt-1">
                              {qa.feedback.strengths.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {qa.feedback.strengths.slice(0, 2).map((s, si) => (
                                    <span key={si} className="text-[11px] text-[#10B981] bg-[rgba(16,185,129,0.08)] px-2 py-0.5 rounded-md">✓ {s}</span>
                                  ))}
                                </div>
                              )}
                              {qa.feedback.improvements.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {qa.feedback.improvements.slice(0, 2).map((im, si) => (
                                    <span key={si} className="text-[11px] text-[#F59E0B] bg-[rgba(245,158,11,0.08)] px-2 py-0.5 rounded-md">△ {im}</span>
                                  ))}
                                </div>
                              )}
                              {qa.feedback.idealAnswerDirection && (
                                <div className="text-[11px] text-[#4F8EF7] italic border-l-2 border-[#4F8EF7]/30 pl-2 py-0.5">{qa.feedback.idealAnswerDirection}</div>
                              )}
                            </div>
                          )}

                          <button onClick={() => { setPracticeModal({ question: qa.question, lastScore: qa.score || 0 }); setPracticeAnswer(''); setPracticeResult(null); }}
                            className="text-xs font-medium text-[#4F8EF7] hover:text-[#A78BFA] transition-colors cursor-pointer flex items-center gap-1">
                            <RefreshCw size={12} /> Practice This Question Again
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Practice Modal */}
          <AnimatePresence>
            {practiceModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setPracticeModal(null)}>
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '560px', width: '100%' }}
                  className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-syne text-white">Practice Question</h3>
                    <button onClick={() => setPracticeModal(null)} className="text-[#9CA3AF] hover:text-white cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">{practiceModal.question}</p>
                  <textarea rows={4} placeholder="Type your new answer..."
                    value={practiceAnswer} onChange={e => setPracticeAnswer(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors resize-none" />
                  <button onClick={handlePracticeQuestion} disabled={practiceSubmitting || !practiceAnswer.trim()}
                    className="w-full py-2.5 bg-[#4F8EF7] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors">
                    {practiceSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {practiceSubmitting ? 'Evaluating...' : 'Submit for New Evaluation'}
                  </button>
                  {practiceResult !== null && (
                    <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-lg p-3 text-center">
                      <span className="text-sm text-[#D1D5DB]">Last time: <strong>{practiceModal.lastScore}/10</strong>
                        {' '}→{' '}This time: <strong className={practiceResult >= practiceModal.lastScore ? 'text-[#10B981]' : 'text-[#EF4444]'}>{practiceResult}/10</strong>
                        {' '}{practiceResult > practiceModal.lastScore ? '↑' : practiceResult < practiceModal.lastScore ? '↓' : '→'}
                      </span>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ===================== PROGRESS ===================== */}
      {subTab === 'progress' && (
        <div className="space-y-8">
          {sessions.length < 2 ? (
            <div className="text-center py-16 space-y-4">
              <BarChart3 size={40} className="text-[#374151] mx-auto" />
              <h3 className="text-xl font-bold font-syne text-white">Complete at least 2 interviews to see your progress</h3>
              <p className="text-sm text-[#9CA3AF]">Track your score trends, identify patterns, and discover blind spots across sessions.</p>
              <button onClick={onStartPractice} className="btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
                Start Practice Interview <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Score Trend Chart */}
              {chartData && (
                <div>
                  <h4 className="text-base font-bold font-syne text-white mb-3">Score Over Time</h4>
                  <div className="flex items-center gap-3 mb-3">
                    {chartData.trend === 'up' ? (
                      <span className="text-xs font-semibold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} /> Improving
                      </span>
                    ) : chartData.trend === 'down' ? (
                      <span className="text-xs font-semibold text-[#F59E0B] bg-[rgba(245,158,11,0.1)] px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingDown size={12} /> Keep Practicing
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#4F8EF7] bg-[rgba(79,142,247,0.1)] px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Minus size={12} /> Consistent
                      </span>
                    )}
                    <span className="text-[10px] text-[#9CA3AF]">{sessions.length} sessions</span>
                  </div>
                  <div ref={chartRef} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                    <svg viewBox={`0 0 ${chartData.w} ${chartData.h}`} className="w-full" style={{ height: '180px' }}>
                      {/* Gridlines */}
                      {[25, 50, 75, 100].map(g => {
                        const y = 10 + 140 - ((g - 0) / 100) * 140;
                        return (
                          <g key={g}>
                            <line x1="40" y1={y} x2={chartData.w - 10} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            <text x="36" y={y + 3} textAnchor="end" fill="#9CA3AF" fontSize="9">{g}</text>
                          </g>
                        );
                      })}
                      {/* Line */}
                      <path d={chartData.linePath} stroke="#4F8EF7" strokeWidth="2" fill="none" strokeLinejoin="round" />
                      {/* Data points */}
                      {chartData.points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#4F8EF7" stroke="#0A0F1E" strokeWidth="2" />
                          <text x={p.x} y={chartData.h - 4} textAnchor="middle" fill="#9CA3AF" fontSize="8">{p.label}</text>
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{p.score}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              {/* Performance by Question Type */}
              <div>
                <h4 className="text-base font-bold font-syne text-white mb-3">Performance by Question Type</h4>
                <div className="space-y-3">
                  {questionTypes.map(qt => {
                    const sc = getScoreColor(qt.score);
                    const barWidth = (qt.score / 10) * 100;
                    return (
                      <div key={qt.type} className="flex items-center gap-4">
                        <span className="text-xs text-[#9CA3AF] w-24 flex-shrink-0">{qt.type}</span>
                        <div className="flex-1 bg-[rgba(255,255,255,0.06)] rounded-full h-2 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${barWidth}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                            style={{ background: sc.stroke, borderRadius: '4px', height: '8px' }} />
                        </div>
                        <span className="text-xs font-bold font-syne w-8 text-right" style={{ color: sc.text }}>{qt.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role History */}
              <div>
                <h4 className="text-base font-bold font-syne text-white mb-3">Roles Practiced</h4>
                <div className="space-y-2">
                  {roleHistory.map(rh => (
                    <div key={rh.role} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 16px' }}
                      className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{rh.role}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#9CA3AF] flex-shrink-0">
                        <span>{rh.count} session{rh.count > 1 ? 's' : ''}</span>
                        <span className="text-[#10B981]">Best: {rh.bestScore}%</span>
                        <span className="text-[#4F8EF7]">Avg: {rh.avgScore}%</span>
                      </div>
                      <button onClick={() => { onPreFill(rh.role); onStartPractice(); }}
                        className="text-xs font-medium text-[#4F8EF7] bg-[rgba(79,142,247,0.1)] border border-[rgba(79,142,247,0.2)] px-3 py-1.5 rounded-lg hover:bg-[rgba(79,142,247,0.2)] transition-colors cursor-pointer flex-shrink-0">
                        Practice Again
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blind Spots */}
              {blindSpots.length > 0 && (
                <div>
                  <h4 className="text-base font-bold font-syne text-white mb-1">Your Blind Spots</h4>
                  <p className="text-xs text-[#9CA3AF] mb-3">Skills you've most often missed across interviews</p>
                  <div className="space-y-2">
                    {blindSpots.map((bs, i) => (
                      <div key={bs.keyword}
                        style={{ background: 'rgba(245,158,11,0.04)', borderLeft: '3px solid #F59E0B', borderRadius: '8px', padding: '10px 14px' }}
                        className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#F59E0B] bg-[rgba(245,158,11,0.1)] px-1.5 py-0.5 rounded">#{i + 1}</span>
                        <span className="text-sm text-[#D1D5DB] font-medium">{bs.keyword}</span>
                        <span className="text-xs text-[#9CA3AF] ml-auto">missed in {bs.sessionCount} session{bs.sessionCount > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerBank;
