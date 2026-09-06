import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileEdit, ChevronDown, Plus, X, Sparkles, Download,
  Printer, Loader2, Check, AlertTriangle, Briefcase,
  GraduationCap, Code, Award, User, BookOpen, Tag,
  RefreshCw, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  location: string;
  responsibilities: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

interface Project {
  name: string;
  url: string;
  description: string;
  technologies: string[];
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

interface ResumeData {
  personalInfo: { name: string; email: string; phone: string; location: string; linkedin: string; website: string };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
  targetRole: string;
}

const emptyExperience = (): Experience => ({
  title: '', company: '', startDate: '', endDate: '', currentlyWorking: false, location: '', responsibilities: ''
});

const emptyEducation = (): Education => ({ degree: '', institution: '', year: '', gpa: '' });
const emptyProject = (): Project => ({ name: '', url: '', description: '', technologies: [] });
const emptyCertification = (): Certification => ({ name: '', issuer: '', year: '' });

const sections = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'summary', label: 'Professional Summary', icon: BookOpen },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Tag },
  { id: 'projects', label: 'Projects', icon: Code },
  { id: 'certifications', label: 'Certifications', icon: Award },
];

const fallbackSkills: Record<string, string[]> = {
  engineer: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'SQL', 'REST APIs'],
  frontend: ['React', 'TypeScript', 'JavaScript', 'CSS/Sass', 'GraphQL', 'Jest', 'Webpack', 'Accessibility'],
  backend: ['Node.js', 'Python', 'Java', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Microservices'],
  'data scientist': ['Python', 'R', 'TensorFlow', 'SQL', 'PyTorch', 'Scikit-learn', 'Tableau', 'Spark'],
  product: ['Product Strategy', 'User Research', 'A/B Testing', 'Roadmapping', 'SQL', 'Agile', 'Stakeholder Mgmt', 'Data Analysis'],
  designer: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'UI/UX', 'HTML/CSS', 'Illustrator', 'Motion Design'],
};

function getFallback(role: string): string[] {
  const lower = role.toLowerCase();
  for (const [key, skills] of Object.entries(fallbackSkills)) {
    if (lower.includes(key)) return skills;
  }
  return ['Communication', 'Problem Solving', 'Team Collaboration', 'Project Management', 'Analytical Skills', 'Leadership', 'Time Management', 'Adaptability'];
}

function safe(v: any): string {
  return v || '';
}

function formatDateRange(start: string, end: string, current: boolean): string {
  if (current) return `${safe(start)} – Present`;
  if (start && end) return `${safe(start)} – ${safe(end)}`;
  if (start) return safe(start);
  return '';
}

const modernStyles = {
  h1: 'font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.5px',
  h2: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4F8EF7;margin-top:20px;margin-bottom:6px;border-bottom:1.5px solid #4F8EF7;padding-bottom:3px',
  title: 'font-weight:600;font-size:11px',
  subtitle: 'color:#475569;font-size:10px',
  date: 'color:#94a3b8;font-size:10px',
  text: 'color:#374151;font-size:11px',
  skill: 'display:inline-block;background:#f1f5f9;border-radius:4px;padding:2px 8px;margin:2px;font-size:10px;color:#1e40af',
};

const classicStyles = {
  h1: 'font-size:22px;font-weight:700;color:#000',
  h2: 'font-size:11px;font-weight:700;text-transform:uppercase;margin-top:18px;margin-bottom:4px;border-bottom:1px solid #000;padding-bottom:2px',
  title: 'font-weight:600;font-size:11px;color:#000',
  subtitle: 'font-style:italic;font-size:10px;color:#333',
  date: 'font-size:10px;color:#555',
  text: 'color:#222;font-size:11px',
  skill: 'display:inline-block;border:1px solid #ccc;border-radius:3px;padding:1px 6px;margin:2px;font-size:10px;color:#000',
};

const minimalStyles = {
  h1: 'font-size:26px;font-weight:300;color:#222;letter-spacing:1px',
  h2: 'font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#888;margin-top:22px;margin-bottom:4px',
  title: 'font-weight:500;font-size:11px;color:#333',
  subtitle: 'font-size:10px;color:#777',
  date: 'font-size:9px;color:#aaa',
  text: 'font-weight:300;color:#444;font-size:11px',
  skill: 'display:inline-block;font-size:10px;color:#555;margin:2px 6px 2px 0',
};

const templates: Record<string, typeof modernStyles> = { modern: modernStyles, classic: classicStyles, minimal: minimalStyles };

export const ResumeBuilder: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', website: '' },
    summary: '', experience: [], education: [], skills: [], projects: [], certifications: [], targetRole: '',
  });
  const [activeSection, setActiveSection] = useState('personal');
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [downloading, setDownloading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [previewData, setPreviewData] = useState(resumeData);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewData(resumeData), 300);
    return () => clearTimeout(debounceRef.current);
  }, [resumeData]);

  const updatePI = useCallback((field: string, value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  }, []);

  const updateField = useCallback(<K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateExperience = useCallback((idx: number, field: keyof Experience, value: any) => {
    setResumeData(prev => {
      const exp = [...prev.experience];
      exp[idx] = { ...exp[idx], [field]: value };
      if (field === 'currentlyWorking' && value === true) exp[idx].endDate = '';
      return { ...prev, experience: exp };
    });
  }, []);

  const addExperience = useCallback(() => {
    setResumeData(prev => ({ ...prev, experience: [...prev.experience, emptyExperience()] }));
    setActiveSection('experience');
  }, []);

  const removeExperience = useCallback((idx: number) => {
    setResumeData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));
  }, []);

  const updateEducation = useCallback((idx: number, field: keyof Education, value: string) => {
    setResumeData(prev => {
      const edu = [...prev.education];
      edu[idx] = { ...edu[idx], [field]: value };
      return { ...prev, education: edu };
    });
  }, []);

  const addEducation = useCallback(() => {
    setResumeData(prev => ({ ...prev, education: [...prev.education, emptyEducation()] }));
    setActiveSection('education');
  }, []);

  const removeEducation = useCallback((idx: number) => {
    setResumeData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));
  }, []);

  const addSkill = useCallback((skill: string) => {
    const s = skill.trim();
    if (!s || resumeData.skills.includes(s)) return;
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput('');
  }, [resumeData.skills]);

  const removeSkill = useCallback((skill: string) => {
    setResumeData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  }, []);

  const updateProject = useCallback((idx: number, field: keyof Project, value: any) => {
    setResumeData(prev => {
      const proj = [...prev.projects];
      proj[idx] = { ...proj[idx], [field]: value };
      return { ...prev, projects: proj };
    });
  }, []);

  const addProject = useCallback(() => {
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, emptyProject()] }));
    setActiveSection('projects');
  }, []);

  const removeProject = useCallback((idx: number) => {
    setResumeData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
  }, []);

  const addProjectTech = useCallback((idx: number, tech: string) => {
    const t = tech.trim();
    if (!t) return;
    setResumeData(prev => {
      const proj = [...prev.projects];
      if (proj[idx].technologies.includes(t)) return prev;
      proj[idx] = { ...proj[idx], technologies: [...proj[idx].technologies, t] };
      return { ...prev, projects: proj };
    });
  }, []);

  const removeProjectTech = useCallback((idx: number, tech: string) => {
    setResumeData(prev => {
      const proj = [...prev.projects];
      proj[idx] = { ...proj[idx], technologies: proj[idx].technologies.filter(t => t !== tech) };
      return { ...prev, projects: proj };
    });
  }, []);

  const updateCertification = useCallback((idx: number, field: keyof Certification, value: string) => {
    setResumeData(prev => {
      const cert = [...prev.certifications];
      cert[idx] = { ...cert[idx], [field]: value };
      return { ...prev, certifications: cert };
    });
  }, []);

  const addCertification = useCallback(() => {
    setResumeData(prev => ({ ...prev, certifications: [...prev.certifications, emptyCertification()] }));
    setActiveSection('certifications');
  }, []);

  const removeCertification = useCallback((idx: number) => {
    setResumeData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== idx) }));
  }, []);

  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [enhanceResult, setEnhanceResult] = useState<{ field: string; original: string; enhanced: string; changes: string[] } | null>(null);

  const enhanceSection = async (section: string, content: string) => {
    if (!resumeData.targetRole) {
      toast.error('Please fill in Target Role first');
      return;
    }
    if (!content.trim()) {
      toast.error('No content to enhance');
      return;
    }
    setEnhancing(section);
    try {
      const res = await fetch('/api/resume/enhance-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content, jobRole: resumeData.targetRole }),
      });
      const data = await res.json();
      if (data.error) { toast.error('Enhancement failed'); return; }
      setEnhanceResult({ field: section, original: content, enhanced: data.enhanced, changes: data.changes || [] });
      toast.success('AI enhancement ready!');
    } catch {
      toast.error('Failed to enhance. Try again.');
    } finally {
      setEnhancing(null);
    }
  };

  const applyEnhancement = () => {
    if (!enhanceResult) return;
    const { field, enhanced } = enhanceResult;
    if (field === 'summary') {
      updateField('summary', enhanced);
    }
    setEnhanceResult(null);
    toast.success('Enhancement applied!');
  };

  const dismissEnhancement = () => setEnhanceResult(null);

  const suggestSkills = async () => {
    if (!resumeData.targetRole) { toast.error('Please fill in Target Role first'); return; }
    setSuggesting(true);
    try {
      const res = await fetch('/api/resume/enhance-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'Skills', content: `Suggest skills for ${resumeData.targetRole}`, jobRole: resumeData.targetRole }),
      });
      const data = await res.json();
      if (data.error) throw new Error('API error');
      const parsed = data.enhanced.split(',').map((s: string) => s.trim().replace(/^-\s*/, '')).filter(Boolean);
      setSuggestedSkills(parsed.length >= 4 ? parsed : getFallback(resumeData.targetRole));
      toast.success('Skills suggested! Click to add.');
    } catch {
      setSuggestedSkills(getFallback(resumeData.targetRole));
      toast.success('Showing suggested skills for this role');
    } finally {
      setSuggesting(false);
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/resume/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, template: activeTemplate }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume-hireboost.pdf';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded!');
      } else {
        const data = await res.json();
        if (data.fallback === 'print') {
          toast.error('PDF engine unavailable — opening print dialog');
          window.print();
        } else {
          throw new Error(data.message || 'Download failed');
        }
      }
    } catch {
      toast.error('PDF failed — trying print fallback');
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const analyzeResume = () => {
    setAnalyzing(true);
    const text = Object.entries(previewData.personalInfo).filter(([k]) => k !== 'name').filter(([, v]) => v).map(([, v]) => v).join(', ');
    const parts = [
      previewData.personalInfo.name,
      text,
      previewData.summary,
      ...previewData.experience.map(e => `${e.title} at ${e.company}: ${e.responsibilities}`),
      ...previewData.education.map(e => `${e.degree} - ${e.institution}`),
      'Skills: ' + previewData.skills.join(', '),
      ...previewData.projects.map(p => `${p.name}: ${p.description}`),
      ...previewData.certifications.map(c => `${c.name} (${c.issuer})`),
    ].filter(Boolean).join('\n\n');
    const stateToSave = JSON.stringify({ resumeText: parts, targetRole: resumeData.targetRole });
    try {
      sessionStorage.setItem('hireboost_analyze_payload', stateToSave);
    } catch { /* ignore */ }
    window.location.hash = '#analyze';
    window.dispatchEvent(new CustomEvent('hireboost-analyze', { detail: { resumeText: parts, targetRole: resumeData.targetRole } }));
    setAnalyzing(false);
    toast.success('Resume data sent to Analyzer!');
  };

  const toggleSection = (id: string) => {
    setActiveSection(prev => prev === id ? '' : id);
  };

  const accordionContent = (id: string) => (
    <AnimatePresence initial={false}>
      {activeSection === id && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-4">
            {id === 'personal' && (
              <>
                <input type="text" placeholder="Full Name" value={resumeData.personalInfo.name}
                  onChange={e => updatePI('name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="email" placeholder="Email" value={resumeData.personalInfo.email}
                    onChange={e => updatePI('email', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                  <input type="tel" placeholder="Phone" value={resumeData.personalInfo.phone}
                    onChange={e => updatePI('phone', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Location (e.g. San Francisco, CA)" value={resumeData.personalInfo.location}
                    onChange={e => updatePI('location', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                  <input type="text" placeholder="LinkedIn URL" value={resumeData.personalInfo.linkedin}
                    onChange={e => updatePI('linkedin', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                </div>
                <input type="text" placeholder="Website / Portfolio (optional)" value={resumeData.personalInfo.website}
                  onChange={e => updatePI('website', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
              </>
            )}
            {id === 'summary' && (
              <div className="space-y-3">
                <textarea placeholder="Write a brief professional summary highlighting your experience and career goals..."
                  rows={4} value={resumeData.summary}
                  onChange={e => { if (e.target.value.length <= 300) updateField('summary', e.target.value); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors resize-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{resumeData.summary.length} / 300 chars</span>
                  <button onClick={() => enhanceSection('summary', resumeData.summary)}
                    disabled={enhancing === 'summary'}
                    style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                    className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors hover:bg-[rgba(167,139,250,0.2)]">
                    {enhancing === 'summary' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {enhancing === 'summary' ? 'Enhancing...' : '✨ Enhance with AI'}
                  </button>
                </div>
              </div>
            )}
            {id === 'experience' && (
              <div className="space-y-4">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }} className="relative">
                    <button onClick={() => removeExperience(idx)}
                      className="absolute top-3 right-3 p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="Job Title" value={exp.title}
                        onChange={e => updateExperience(idx, 'title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      <input type="text" placeholder="Company" value={exp.company}
                        onChange={e => updateExperience(idx, 'company', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Start Date (e.g. Jan 2020)" value={exp.startDate}
                          onChange={e => updateExperience(idx, 'startDate', e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                        <div className="flex-1 flex gap-2 items-center">
                          <input type="text" placeholder="End Date" value={exp.currentlyWorking ? '' : exp.endDate}
                            disabled={exp.currentlyWorking}
                            onChange={e => updateExperience(idx, 'endDate', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors disabled:opacity-40" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Location" value={exp.location}
                          onChange={e => updateExperience(idx, 'location', e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-3 cursor-pointer">
                      <input type="checkbox" checked={exp.currentlyWorking}
                        onChange={e => updateExperience(idx, 'currentlyWorking', e.target.checked)}
                        className="rounded border-gray-600 bg-white/5 accent-[#4F8EF7]" />
                      Currently working here
                    </label>
                    <textarea placeholder="Describe your responsibilities and achievements..."
                      rows={3} value={exp.responsibilities}
                      onChange={e => updateExperience(idx, 'responsibilities', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors resize-none mb-3" />
                    <button onClick={() => enhanceSection('experience-bullets', exp.responsibilities)}
                      disabled={enhancing === `exp-${idx}`}
                      style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                      className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors hover:bg-[rgba(167,139,250,0.2)]">
                      {enhancing === `exp-${idx}` ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {enhancing === `exp-${idx}` ? 'Enhancing...' : '✨ Enhance Bullets'}
                    </button>
                  </div>
                ))}
                <button onClick={addExperience}
                  style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4F8EF7', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                  className="flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(79,142,247,0.2)]">
                  <Plus size={14} /> Add Another Position
                </button>
              </div>
            )}
            {id === 'education' && (
              <div className="space-y-4">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }} className="relative">
                    <button onClick={() => removeEducation(idx)}
                      className="absolute top-3 right-3 p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="Degree (e.g. B.S. Computer Science)" value={edu.degree}
                        onChange={e => updateEducation(idx, 'degree', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      <input type="text" placeholder="Institution" value={edu.institution}
                        onChange={e => updateEducation(idx, 'institution', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" placeholder="Graduation Year" value={edu.year}
                        onChange={e => updateEducation(idx, 'year', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      <input type="text" placeholder="GPA / Percentage (optional)" value={edu.gpa}
                        onChange={e => updateEducation(idx, 'gpa', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                    </div>
                  </div>
                ))}
                <button onClick={addEducation}
                  style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4F8EF7', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                  className="flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(79,142,247,0.2)]">
                  <Plus size={14} /> Add Education
                </button>
              </div>
            )}
            {id === 'skills' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {resumeData.skills.map(s => (
                    <span key={s} style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)', color: '#FFFFFF', borderRadius: '20px', padding: '4px 10px', fontSize: '13px' }}
                      className="flex items-center gap-1.5">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-400 cursor-pointer transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Type a skill, press Enter" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                </div>
                {resumeData.targetRole && (
                  <div className="space-y-2">
                    <button onClick={suggestSkills} disabled={suggesting}
                      style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                      className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors hover:bg-[rgba(167,139,250,0.2)]">
                      {suggesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {suggesting ? 'Suggesting...' : 'Suggest Skills for Target Role'}
                    </button>
                    {suggestedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-gray-500">Click to add:</span>
                        {suggestedSkills.map(s => (
                          <span key={s} onClick={() => { if (!resumeData.skills.includes(s)) { setResumeData(prev => ({ ...prev, skills: [...prev.skills, s] })); } }}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: '20px', padding: '3px 10px', fontSize: '12px' }}
                            className="cursor-pointer transition-colors hover:bg-white/10 hover:text-white">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {id === 'projects' && (
              <div className="space-y-4">
                {resumeData.projects.map((proj, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }} className="relative">
                    <button onClick={() => removeProject(idx)}
                      className="absolute top-3 right-3 p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="Project Name" value={proj.name}
                        onChange={e => updateProject(idx, 'name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      <input type="text" placeholder="URL (optional)" value={proj.url}
                        onChange={e => updateProject(idx, 'url', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                    </div>
                    <textarea placeholder="Brief description of the project..." rows={2} value={proj.description}
                      onChange={e => updateProject(idx, 'description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors resize-none mb-3" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proj.technologies.map(t => (
                        <span key={t} style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)', color: '#FFFFFF', borderRadius: '20px', padding: '2px 8px', fontSize: '12px' }}
                          className="flex items-center gap-1">
                          {t}
                          <button onClick={() => removeProjectTech(idx, t)} className="hover:text-red-400 cursor-pointer">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input type="text" placeholder="Add technology, press Enter"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProjectTech(idx, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors mb-3" />
                    <button onClick={() => enhanceSection('project-description', proj.description)}
                      disabled={enhancing === `proj-${idx}`}
                      style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                      className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors hover:bg-[rgba(167,139,250,0.2)]">
                      {enhancing === `proj-${idx}` ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {enhancing === `proj-${idx}` ? 'Enhancing...' : '✨ Enhance'}
                    </button>
                  </div>
                ))}
                <button onClick={addProject}
                  style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4F8EF7', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                  className="flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(79,142,247,0.2)]">
                  <Plus size={14} /> Add Project
                </button>
              </div>
            )}
            {id === 'certifications' && (
              <div className="space-y-4">
                {resumeData.certifications.map((cert, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }} className="relative">
                    <button onClick={() => removeCertification(idx)}
                      className="absolute top-3 right-3 p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="Certification Name" value={cert.name}
                        onChange={e => updateCertification(idx, 'name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                      <input type="text" placeholder="Issuer" value={cert.issuer}
                        onChange={e => updateCertification(idx, 'issuer', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                    </div>
                    <input type="text" placeholder="Year" value={cert.year}
                      onChange={e => updateCertification(idx, 'year', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
                  </div>
                ))}
                <button onClick={addCertification}
                  style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4F8EF7', borderRadius: '8px', padding: '6px 14px', fontSize: '13px' }}
                  className="flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(79,142,247,0.2)]">
                  <Plus size={14} /> Add Certification
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderPreview = (data: ResumeData, template: string) => {
    const s = templates[template] || modernStyles;
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data;
    const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean);

    return (
      <div style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", fontSize: '11px', color: '#1a1a1a', lineHeight: '1.5' }}>
        {personalInfo.name && <div style={{ ...cssParse(s.h1) }}>{personalInfo.name}</div>}
        {contacts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', ...cssParse(s.date) }}>
            {contacts.map((c, i) => (
              <span key={i}>{c}{i < contacts.length - 1 ? '' : ''}</span>
            ))}
          </div>
        )}

        {summary && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Professional Summary</div>
            <div style={{ ...cssParse(s.text), marginTop: '4px' }}>{summary}</div>
          </>
        )}

        {experience.length > 0 && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Experience</div>
            {experience.map((job, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div>
                    <div style={{ ...cssParse(s.title) }}>{safe(job.title)}</div>
                    <div style={{ ...cssParse(s.subtitle) }}>{safe(job.company)}{job.location ? ` — ${job.location}` : ''}</div>
                  </div>
                  <div style={{ ...cssParse(s.date), whiteSpace: 'nowrap' }}>{formatDateRange(job.startDate, job.endDate, job.currentlyWorking)}</div>
                </div>
                {job.responsibilities && (
                  <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
                    {job.responsibilities.split('\n').filter(Boolean).map((r, ri) => (
                      <li key={ri} style={{ marginBottom: '2px', ...cssParse(s.text) }}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {education.length > 0 && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Education</div>
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ ...cssParse(s.title) }}>{safe(edu.degree)}</div>
                    <div style={{ ...cssParse(s.subtitle) }}>{safe(edu.institution)}</div>
                  </div>
                  <div style={{ ...cssParse(s.date), whiteSpace: 'nowrap' }}>{safe(edu.year)}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {skills.length > 0 && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Skills</div>
            <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {skills.map((skill, i) => (
                <span key={i} style={{ ...cssParse(s.skill), display: 'inline-block', margin: '2px 4px 2px 0' }}>{skill}</span>
              ))}
            </div>
          </>
        )}

        {projects.length > 0 && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Projects</div>
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ ...cssParse(s.title) }}>{safe(proj.name)}</div>
                  {proj.url && <a href={proj.url} style={{ ...cssParse(s.subtitle), textDecoration: 'underline' }}>{proj.url}</a>}
                </div>
                {proj.description && <div style={{ ...cssParse(s.text), marginTop: '2px' }}>{proj.description}</div>}
                {proj.technologies.length > 0 && (
                  <div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {proj.technologies.map((t, ti) => (
                      <span key={ti} style={{ ...cssParse(s.skill), display: 'inline-block' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {certifications.length > 0 && (
          <>
            <div style={{ ...cssParse(s.h2), marginTop: '18px' }}>Certifications</div>
            {certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: '3px', ...cssParse(s.text) }}>
                <strong>{safe(cert.name)}</strong>{cert.issuer ? ` – ${cert.issuer}` : ''}{cert.year ? ` (${cert.year})` : ''}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {enhanceResult && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-[#1a1a2e] border border-[rgba(167,139,250,0.2)] rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#A78BFA]" />
            <span className="text-sm font-semibold text-[#A78BFA]">AI Enhancement</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Original</div>
              <div className="text-sm text-gray-400 line-through opacity-60">{enhanceResult.original}</div>
            </div>
            <div className="bg-[rgba(167,139,250,0.05)] rounded-lg p-3 border border-[rgba(167,139,250,0.1)]">
              <div className="text-xs text-[#A78BFA] mb-1">Enhanced</div>
              <div className="text-sm text-white">{enhanceResult.enhanced}</div>
            </div>
          </div>
          {enhanceResult.changes.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Changes made:</div>
              <ul className="text-xs text-gray-400 space-y-0.5 list-disc list-inside">
                {enhanceResult.changes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={applyEnhancement}
              className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
              <Check size={14} /> Use Enhanced
            </button>
            <button onClick={dismissEnhancement}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg cursor-pointer transition-colors">
              Keep Original
            </button>
          </div>
        </motion.div>
      )}

      <div className="md:hidden flex mb-4 border-b border-white/5">
        <button onClick={() => setMobileTab('edit')}
          className={`flex-1 pb-3 text-sm font-medium cursor-pointer transition-colors ${mobileTab === 'edit' ? 'text-[#4F8EF7] border-b-2 border-[#4F8EF7]' : 'text-gray-500'}`}>
          ✏ Edit
        </button>
        <button onClick={() => setMobileTab('preview')}
          className={`flex-1 pb-3 text-sm font-medium cursor-pointer transition-colors ${mobileTab === 'preview' ? 'text-[#4F8EF7] border-b-2 border-[#4F8EF7]' : 'text-gray-500'}`}>
          👁 Preview
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Form */}
        <div className={`${mobileTab === 'preview' ? 'hidden md:block' : 'block'} md:w-[55%]`}>
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto" style={{ background: '#111827', borderRadius: '16px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-syne text-white flex items-center gap-2">
                <FileEdit size={18} className="text-[#4F8EF7]" /> Resume Builder
              </h2>
              <span className="text-xs text-gray-500">{sections.filter(s => s.id !== 'personal' && s.id !== 'summary').reduce((count, s) => {
                const arr = resumeData[s.id as keyof ResumeData];
                return count + (Array.isArray(arr) ? arr.length : 0);
              }, 0)} items</span>
            </div>

            {sections.map(sec => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              const isOptional = sec.id === 'projects' || sec.id === 'certifications';
              return (
                <div key={sec.id} className="mb-2 border border-white/5 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection(sec.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors text-left">
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-[#4F8EF7]' : 'text-gray-500'} />
                      <span className="text-sm font-medium text-white">{sec.label}</span>
                      {isOptional && <span className="text-[10px] text-gray-500 font-normal">(Optional)</span>}
                    </div>
                    <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-gray-500" />
                    </motion.div>
                  </button>
                  {accordionContent(sec.id)}
                </div>
              );
            })}

            <div className="mt-6 space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Target Role (for AI enhancement)</label>
                <input type="text" placeholder="e.g. Product Manager" value={resumeData.targetRole}
                  onChange={e => updateField('targetRole', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors" />
              </div>
              <button onClick={downloadPDF} disabled={downloading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }}>
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button onClick={analyzeResume} disabled={analyzing}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-white/10 text-gray-300 hover:bg-white/5">
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <FileEdit size={16} />}
                {analyzing ? 'Analyzing...' : 'Analyze This Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className={`${mobileTab === 'edit' ? 'hidden md:block' : 'block'} md:w-[45%]`}>
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Template:</span>
                {Object.keys(templates).map(t => (
                  <button key={t} onClick={() => setActiveTemplate(t)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-all ${activeTemplate === t ? 'text-white border border-[#4F8EF7] bg-[#4F8EF7]/10' : 'text-gray-500 border border-white/5 hover:border-white/20'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">
                <Printer size={14} /> Print Preview
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              padding: '40px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 12rem)'
            }}>
              {renderPreview(previewData, activeTemplate)}
            </div>

            {!previewData.personalInfo.name && !previewData.summary && previewData.experience.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Eye size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Start filling in your details to see a live preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function cssParse(css: string): React.CSSProperties {
  const obj: React.CSSProperties = {};
  css.split(';').filter(Boolean).forEach(pair => {
    const [key, ...valParts] = pair.split(':');
    if (!key || valParts.length === 0) return;
    const k = key.trim();
    const v = valParts.join(':').trim();
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    (obj as any)[camel] = isNaN(Number(v)) ? v : Number(v);
  });
  return obj;
}

export default ResumeBuilder;
