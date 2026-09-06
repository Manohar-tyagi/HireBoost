import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExtractedData {
  jobTitle: string;
  company: string;
  description: string;
  location: string;
}

interface JobScraperProps {
  onJobExtracted: (data: ExtractedData) => void;
}

export const JobScraper: React.FC<JobScraperProps> = ({ onJobExtracted }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [error, setError] = useState(false);

  const handleExtract = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputValue.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(true);
        toast.error('Could not extract job details from this URL');
        return;
      }
      const extractedData: ExtractedData = {
        jobTitle: data.jobTitle || '',
        company: data.company || '',
        description: data.description || '',
        location: data.location || '',
      };
      setExtracted(extractedData);
      onJobExtracted(extractedData);
      toast.success('Job details extracted successfully!');
    } catch {
      setError(true);
      toast.error('Failed to extract job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setExtracted(null);
    setInputValue('');
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
      handleExtract();
    }
  };

  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.04)',
        border: '1px solid rgba(79,142,247,0.15)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link2 size={16} color="#4F8EF7" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#FFFFFF', fontWeight: 500 }}>
            Auto-fill from Job URL
          </span>
        </div>
        <span
          style={{
            background: 'rgba(156,163,175,0.1)',
            color: '#9CA3AF',
            borderRadius: '20px',
            padding: '2px 8px',
            fontSize: '11px',
          }}
        >
          Optional
        </span>
      </div>

      {extracted ? (
        <div
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle size={24} color="#10B981" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {extracted.company && extracted.jobTitle
                ? `${extracted.company} · ${extracted.jobTitle}`
                : extracted.jobTitle || extracted.company || 'Job extracted'}
            </div>
            {extracted.location && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{extracted.location}</div>
            )}
          </div>
          <button
            onClick={handleReset}
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#9CA3AF',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              background: 'transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Paste LinkedIn or Naukri job URL..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{
                flex: 1,
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F9FAFB',
                fontSize: '14px',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleExtract}
              disabled={!inputValue.trim() || isLoading}
              style={{
                background: !inputValue.trim() || isLoading ? 'linear-gradient(135deg, #4F8EF7, #A78BFA)' : 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isLoading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Extracting...</>
              ) : (
                'Extract'
              )}
            </button>
          </div>

          {isLoading && (
            <div style={{ marginTop: '12px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, transparent, #4F8EF7, #A78BFA, transparent)',
                  borderRadius: '2px',
                  animation: 'shimmer 1.2s ease-in-out infinite',
                }}
              />
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  marginTop: '10px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#F59E0B',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>⚠ Couldn't extract from this URL. Please enter the job role manually below.</span>
                  <button onClick={handleExtract} disabled={isLoading}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap">
                    {isLoading ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
