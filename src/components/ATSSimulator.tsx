import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface AtsData {
  atsScore: number;
  parseability: string;
  sectionsDetected: {
    contactInfo: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
  };
  keywordsFound: { keyword: string; frequency: number; importance: string; context: string }[];
  keywordsMissing: { keyword: string; importance: string; reason: string }[];
  parsingIssues: { issue: string; severity: string; fix: string }[];
  formatIssues: string[];
  atsReadabilityTips: string[];
  estimatedInterviewChance: string;
}

interface ATSSimulatorProps {
  resumeText: string;
  jobRole: string;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

export const ATSSimulator: React.FC<ATSSimulatorProps> = ({ resumeText, jobRole }) => {
  const [data, setData] = useState<AtsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAts = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/ats-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobRole }),
      });
      const d = await res.json();
      if (d.error) { setError(true); return; }
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAts(); }, []);

  const atsColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const parseabilityColor = (p: string) => {
    if (p === 'Excellent') return { bg: 'rgba(16,185,129,0.15)', color: '#10B981' };
    if (p === 'Good') return { bg: 'rgba(79,142,247,0.15)', color: '#4F8EF7' };
    if (p === 'Fair') return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
    return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' };
  };

  const importanceBorder = (imp: string) => {
    if (imp === 'High') return '#4F8EF7';
    if (imp === 'Medium') return 'rgba(79,142,247,0.4)';
    return 'rgba(156,163,175,0.4)';
  };

  const severityConfig = (sev: string) => {
    if (sev === 'Critical') return { icon: '🔴', color: '#EF4444' };
    if (sev === 'Warning') return { icon: '🟡', color: '#F59E0B' };
    return { icon: '🔵', color: '#4F8EF7' };
  };

  const missingImportanceColor = (imp: string) => {
    if (imp === 'High') return '#EF4444';
    if (imp === 'Medium') return '#F59E0B';
    return '#9CA3AF';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ height: '24px', width: '40%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '12px' }} />
            <div style={{ height: '80px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <AlertTriangle size={32} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '16px', color: '#F59E0B', fontWeight: 600, marginBottom: '4px' }}>ATS simulation unavailable</div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Could not run ATS simulation for this resume.</div>
        <button onClick={fetchAts}
          style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </motion.div>
    );
  }

  if (!data) return null;

  const severityOrder = { Critical: 0, Warning: 1, Info: 2 };
  const sortedIssues = [...data.parsingIssues].sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2));

  return (
    <div style={{ paddingTop: '8px' }}>
      {/* SECTION 1: Top Score Bar */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible"
        style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 200px', background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '64px', fontWeight: 700, color: atsColor(data.atsScore), lineHeight: 1 }}>
            {data.atsScore}<span style={{ fontSize: '28px' }}>%</span>
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>ATS Score</div>
          <div style={{ display: 'inline-block', marginTop: '8px', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: 600, background: parseabilityColor(data.parseability).bg, color: parseabilityColor(data.parseability).color }}>
            {data.parseability}
          </div>
        </div>

        <div style={{ flex: '1 1 200px', background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Sections Detected</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {Object.entries(data.sectionsDetected).map(([key, val]) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', borderRadius: '6px', padding: '4px 10px',
                background: val ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: val ? '#10B981' : '#EF4444'
              }}>
                <span>{val ? '✓' : '×'}</span>
                <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 200px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Estimated Interview Chance</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 700, color: '#F59E0B', margin: '4px 0' }}>{data.estimatedInterviewChance}</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Based on keyword match rate</div>
        </div>
      </motion.div>

      {/* SECTION 2: Two Columns - Keywords Found / Missing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Keywords Found</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.15)', borderRadius: '10px', padding: '2px 8px' }}>{data.keywordsFound.length} found</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.keywordsFound.map((kw, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(79,142,247,0.1)', border: `1px solid ${importanceBorder(kw.importance)}`,
                color: '#FFFFFF', borderRadius: '20px', padding: '4px 12px', fontSize: '13px'
              }}>
                <span>{kw.keyword}</span>
                <span style={{ background: 'rgba(79,142,247,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', color: '#4F8EF7' }}>{kw.frequency}</span>
              </div>
            ))}
            {data.keywordsFound.length === 0 && <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No keywords found</span>}
          </div>
        </motion.div>

        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Keywords Missing</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', padding: '2px 8px' }}>{data.keywordsMissing.length} missing</span>
          </div>
          <div>
            {data.keywordsMissing.map((kw, i) => (
              <div key={i} style={{
                background: 'rgba(239,68,68,0.04)', borderLeft: `3px solid ${missingImportanceColor(kw.importance)}`,
                borderRadius: '8px', padding: '10px 14px', marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 500 }}>{kw.keyword}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${missingImportanceColor(kw.importance)}22`, color: missingImportanceColor(kw.importance) }}>{kw.importance}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{kw.reason}</div>
              </div>
            ))}
            {data.keywordsMissing.length === 0 && <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No missing keywords</span>}
          </div>
        </motion.div>
      </div>

      {/* SECTION 3: Issues & Fixes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Parsing Issues</div>
          {sortedIssues.length === 0 && data.formatIssues.length === 0 && (
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No parsing issues detected</span>
          )}
          {sortedIssues.map((issue, i) => {
            const sc = severityConfig(issue.severity);
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span>{sc.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: sc.color }}>{issue.severity}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#FFFFFF', marginBottom: '4px' }}>{issue.issue}</div>
                <div><span style={{ color: '#10B981', fontWeight: 600 }}>Fix:</span> <span style={{ fontSize: '13px', color: '#D1D5DB' }}>{issue.fix}</span></div>
              </div>
            );
          })}
          {data.formatIssues.map((fi, i) => (
            <div key={`fmt-${i}`} style={{ background: 'rgba(245,158,11,0.04)', borderLeft: '3px solid #F59E0B', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', fontSize: '13px', color: '#D1D5DB' }}>
              🟡 Format: {fi}
            </div>
          ))}
        </motion.div>

        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#4F8EF7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>How to Improve Your ATS Score</div>
          {data.atsReadabilityTips.length === 0 && (
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No improvement tips available</span>
          )}
          {data.atsReadabilityTips.map((tip, i) => (
            <div key={i} style={{
              background: 'rgba(79,142,247,0.04)', borderLeft: '3px solid #4F8EF7',
              borderRadius: '8px', padding: '12px 14px', marginBottom: '8px',
              fontSize: '14px', color: '#D1D5DB', display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <span style={{ fontWeight: 700, color: '#4F8EF7', flexShrink: 0 }}>{i + 1}.</span>
              <span>{tip}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
