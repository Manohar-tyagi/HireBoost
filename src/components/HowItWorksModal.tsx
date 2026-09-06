import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointerClick, UploadCloud, FileCheck2, Cpu } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => modalRef.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      prevFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-[480px] rounded-[24px] bg-[#111827] border border-white/5 relative p-10"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#F9FAFB] p-1.5 bg-white/5 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <h3 className="text-[28px] font-bold font-syne text-[#F9FAFB] mb-8">How HireBoost Works</h3>

            <div className="space-y-0">
              {[
                { icon: <MousePointerClick size={24} />, gradient: 'from-[#4F8EF7] to-[#3B6FD4]', title: 'Choose a Tool', desc: 'Select from the Resume Analyzer, Mock Interview, or Writing Enhancer on your dashboard.' },
                { icon: <UploadCloud size={24} />, gradient: 'from-[#A78BFA] to-[#7C5BD4]', title: 'Upload or Type', desc: 'Upload your resume (PDF/DOCX) or paste raw drafts. Specify target positions or goals.' },
                { icon: <FileCheck2 size={24} />, gradient: 'from-[#10B981] to-[#059669]', title: 'Get AI Feedback', desc: 'Get parsed insights, matched scores, and detailed line-by-line phrasing enhancements.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-5 relative pb-8 last:pb-0">
                  {i < 2 && <div className="absolute left-[19px] top-10 bottom-0 w-px bg-[rgba(255,255,255,0.1)]" />}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5`}>
                    {i + 1}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold font-syne text-[#F9FAFB]">{step.title}</h4>
                    <p className="text-sm text-[#9CA3AF] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulation notice */}
            <div className="mt-8 flex items-start gap-4 p-4 rounded-xl bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)]">
              <Cpu className="text-[#F59E0B] flex-shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-[#F9FAFB] font-syne">Running in Simulation Mode?</h5>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  If no API key is specified, HireBoost generates realistic mock responses for any input or file upload instantly.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
              <button onClick={onClose} className="px-5 py-2.5 btn-ghost text-xs font-semibold cursor-pointer">Close</button>
              <button onClick={onClose} className="px-5 py-2.5 btn-primary text-xs cursor-pointer">Got It</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
