import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import * as cheerio from 'cheerio';
import htmlPdfNode from 'html-pdf-node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --------------- Gemini Init ---------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let isSimulationMode = !GEMINI_API_KEY ||
  GEMINI_API_KEY.includes('your_gemini_api_key_here') ||
  GEMINI_API_KEY.trim() === '';

console.log(`[Env Loader] Checking GEMINI_API_KEY...`);
if (GEMINI_API_KEY) {
  console.log(`[Env Loader] Loaded key: ${GEMINI_API_KEY.substring(0, 8)}... (Total length: ${GEMINI_API_KEY.length})`);
} else {
  console.log(`[Env Loader] GEMINI_API_KEY is undefined.`);
}

let model = null;

if (!isSimulationMode) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
      }
    });
    console.log("⚡ Gemini API initialized successfully.");
  } catch (err) {
    console.error("⚠️ Failed to initialize Gemini API. Defaulting to Simulation Mode.", err);
    isSimulationMode = true;
  }
} else {
  console.log("⚡ Running in Simulation Mode (No valid GEMINI_API_KEY).");
}

// --------------- Middleware ---------------
app.use(cors({
  origin: 'http://localhost:5173',
  exposedHeaders: ['X-Mode']
}));
app.use(express.json({ limit: '10mb' }));

// Logger + X-Mode header
app.use((req, res, next) => {
  const start = Date.now();
  res.setHeader('X-Mode', isSimulationMode ? 'simulation' : 'live');
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// --------------- Multer ---------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// --------------- Gemini Helper ---------------
async function queryGemini(prompt, fallbackGenerator) {
  if (isSimulationMode) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return fallbackGenerator();
  }

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json[\s\S]*?```|```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("⚠️ Gemini API execution failed. falling back to simulator logic...", err.message);
    await new Promise(resolve => setTimeout(resolve, 500));
    return fallbackGenerator();
  }
}

// --------------- Mock Data ---------------
const MOCK_RESUMES = {
  software: {
    matchedSkills: ["JavaScript", "React", "HTML5", "CSS3", "Git", "Webpack", "REST APIs"],
    missingSkills: [
      { skill: "TypeScript", reason: "Modern frontend teams require strict type safety for scaling applications.", priority: "High" },
      { skill: "Redux / Zustand", reason: "State management architecture is critical for managing complex application states.", priority: "High" },
      { skill: "Unit Testing (Jest/RTL)", reason: "Production-quality codebases rely on automated testing pipelines.", priority: "Medium" },
      { skill: "CI/CD Pipelines", reason: "Automated deployment is a standard requirement for senior engineering roles.", priority: "Medium" },
      { skill: "GraphQL", reason: "Modern APIs increasingly use GraphQL for efficient data fetching.", priority: "Low" }
    ],
    recommendations: [
      { tip: "Quantify your accomplishments: e.g., 'Optimized frontend performance, reducing load times by 24%'.", impact: "High", category: "Experience" },
      { tip: "Highlight your TypeScript experience or add a portfolio project utilizing TS.", impact: "High", category: "Skills" },
      { tip: "Include experience with CI/CD tools or GitHub Actions under your development workflows.", impact: "Medium", category: "Keywords" },
      { tip: "Restructure bullet points to follow 'Action verb + Task + Result + Metric' format.", impact: "High", category: "Format" },
      { tip: "Add a 'Technical Skills' section with proficiency levels for each technology.", impact: "Medium", category: "Format" }
    ]
  },
  pm: {
    matchedSkills: ["Agile/Scrum", "Product Roadmap", "Stakeholder Management", "User Stories", "Jira"],
    missingSkills: [
      { skill: "A/B Testing & Analytics", reason: "Data-driven decisions require understanding key performance metrics and testing methodologies.", priority: "High" },
      { skill: "SQL / Data Extraction", reason: "Technical product management often requires querying databases directly for market insights.", priority: "High" },
      { skill: "UX Wireframing", reason: "Communicating project layout to designers requires basic structural mockup capabilities.", priority: "Medium" },
      { skill: "Competitive Analysis Frameworks", reason: "Understanding market positioning helps prioritize product features effectively.", priority: "Medium" },
      { skill: "OKR Planning", reason: "Goal-setting frameworks are widely adopted in product-led organizations.", priority: "Low" }
    ],
    recommendations: [
      { tip: "Add metrics illustrating your impact: e.g., 'Launched features driving a 15% increase in user retention'.", impact: "High", category: "Experience" },
      { tip: "Detail your collaboration structure with engineering teams during lifecycle management.", impact: "High", category: "Achievements" },
      { tip: "List product discovery tools such as Mixpanel or Amplitude if you have exposure to them.", impact: "Medium", category: "Skills" },
      { tip: "Include a section on 'Key Outcomes' with 3-5 major wins quantified.", impact: "Medium", category: "Format" },
      { tip: "Mention experience with user research methodologies like surveys or usability testing.", impact: "Low", category: "Keywords" }
    ]
  },
  data: {
    matchedSkills: ["Python", "SQL", "Pandas", "Data Visualization", "Jupyter Notebooks", "Git"],
    missingSkills: [
      { skill: "Machine Learning (Scikit-Learn)", reason: "Advanced analysis requires deploying models for prediction and forecasting.", priority: "High" },
      { skill: "Tableau / PowerBI", reason: "Enterprise teams look for unified dashboards that non-technical users can interact with.", priority: "High" },
      { skill: "Cloud Platforms (AWS/GCP)", reason: "Handling big data requires deploying pipelines on cloud-based compute environments.", priority: "High" },
      { skill: "Apache Spark", reason: "Distributed computing is essential for processing large-scale datasets.", priority: "Medium" },
      { skill: "Airflow / Dagster", reason: "Workflow orchestration tools are standard for production data pipelines.", priority: "Medium" }
    ],
    recommendations: [
      { tip: "Detail the deployment of your analyses: 'Created automated script saving 10 engineering hours weekly'.", impact: "High", category: "Achievements" },
      { tip: "Specify size of datasets managed to illustrate experience with scalability issues.", impact: "High", category: "Experience" },
      { tip: "Highlight statistical modeling concepts or hypotheses testing you did in projects.", impact: "Medium", category: "Skills" },
      { tip: "Mention any experience with real-time data streaming tools like Kafka or Kinesis.", impact: "Medium", category: "Keywords" },
      { tip: "Add a 'Tools & Technologies' section with versions or proficiency indicators.", impact: "Low", category: "Format" }
    ]
  },
  marketing: {
    matchedSkills: ["SEO", "Google Analytics", "Content Strategy", "Email Campaigns", "Copywriting"],
    missingSkills: [
      { skill: "Paid Acquisition (Meta/Google Ads)", reason: "Modern marketing roles expect familiarity with bid strategies and ad budgets.", priority: "High" },
      { skill: "SQL / Data Analysis", reason: "Growth marketers need to query user tables directly to segment outreach effectively.", priority: "High" },
      { skill: "HTML/CSS Basics", reason: "Optimizing landing page conversions requires making minor structural edits directly.", priority: "Medium" },
      { skill: "Marketing Automation (HubSpot/Marketo)", reason: "Automated nurture sequences are standard in B2B marketing stacks.", priority: "Medium" },
      { skill: "A/B Testing Platforms", reason: "Conversion rate optimization relies on structured experimentation methodologies.", priority: "Low" }
    ],
    recommendations: [
      { tip: "Quantify campaign metrics: e.g., 'Grew organic search traffic by 45% in 6 months using long-tail SEO'.", impact: "High", category: "Achievements" },
      { tip: "Add details about budget size and ROI targets you managed in previous campaigns.", impact: "High", category: "Experience" },
      { tip: "Mention growth-hacking experiments or viral marketing campaign methodologies you've run.", impact: "Medium", category: "Keywords" },
      { tip: "Include specific tools in each campaign description rather than a generic list.", impact: "Medium", category: "Skills" },
      { tip: "Structure each role entry with 'Campaign goal → Actions taken → Measurable results'.", impact: "Low", category: "Format" }
    ]
  },
  generic: {
    matchedSkills: ["Teamwork", "Communication", "Problem Solving", "Microsoft Office", "Project Coordination"],
    missingSkills: [
      { skill: "Technical Project Management Tools", reason: "SaaS companies coordinate using Jira, Asana, or Monday.com.", priority: "High" },
      { skill: "Data Visualization", reason: "Modern roles require tracking KPIs and reporting outcomes in visual diagrams.", priority: "High" },
      { skill: "Agile / Scrum Methodologies", reason: "Cross-functional teams operate in iterative sprint cycles.", priority: "Medium" },
      { skill: "Stakeholder Presentation Skills", reason: "Communicating results to leadership requires structured storytelling.", priority: "Medium" },
      { skill: "Basic SQL / Querying", reason: "Data-backed decision making is expected across all modern roles.", priority: "Low" }
    ],
    recommendations: [
      { tip: "Revise job bullets to focus on business outcomes rather than just daily tasks.", impact: "High", category: "Format" },
      { tip: "Add certifications or training specific to the toolchain of your target industry.", impact: "High", category: "Skills" },
      { tip: "Quantify every achievement with a metric or percentage where possible.", impact: "High", category: "Achievements" },
      { tip: "Tailor the 'Skills' section to match keywords from the target job description.", impact: "Medium", category: "Keywords" },
      { tip: "Add a professional summary that connects your background to the target role.", impact: "Medium", category: "Format" }
    ]
  }
};

const MOCK_QUESTIONS = {
  software: {
    Behavioral: [
      "Describe a technical disagreement you had with a team lead. How did you resolve it?",
      "Tell me about a time you had to deliver a feature under a tight deadline but ran into blocker issues.",
      "Explain a scenario where you took ownership of a major system bug or refactor. What was the impact?",
      "How do you keep up with modern technologies, and how have you applied a new concept to your work?",
      "Describe a time you helped onboard a junior engineer. What was your mentorship approach?",
      "Talk about a production failure you caused or participated in. What did you learn?",
      "How do you handle scope creep when working with product managers?"
    ],
    Technical: [
      "What is the difference between client-side rendering and server-side rendering in React?",
      "How does the Virtual DOM work, and how does React reconcile state updates?",
      "Explain event delegation in JavaScript and why it is useful.",
      "Describe the CSS box model and how `box-sizing: border-box` changes layout rendering.",
      "What are Web Accessibility (ARIA) standards, and how do you implement them?",
      "Explain the differences between REST and GraphQL APIs. When would you choose which?",
      "How would you optimize a slow-loading web application experiencing rendering bottlenecks?"
    ],
    Mixed: [
      "What is the difference between client-side rendering and server-side rendering in React?",
      "Describe a technical disagreement you had with a team lead. How did you resolve it?",
      "Explain event delegation in JavaScript and why it is useful.",
      "Tell me about a time you had to deliver a feature under a tight deadline but ran into blocker issues.",
      "How does React reconcile state updates?",
      "Talk about a production failure you caused or participated in. What did you learn?",
      "How would you optimize a slow-loading web application experiencing rendering bottlenecks?"
    ]
  },
  pm: {
    Behavioral: [
      "Tell me about a time you had to say 'no' to a major stakeholder request. How did you handle it?",
      "Describe a product feature launch that failed. What went wrong, and how did you pivot?",
      "How do you resolve conflicting priorities between engineering, design, and sales?",
      "Tell me about a time you relied purely on user data to override your personal instincts.",
      "How do you handle an engineer who disagrees with the product roadmap?",
      "Describe a time you had to build alignment around a highly unpopular product decision.",
      "How do you gather user feedback during the early prototyping stage?"
    ],
    Technical: [
      "How would you explain the concept of APIs to a non-technical product manager?",
      "How do you calculate customer acquisition cost (CAC) and customer lifetime value (LTV)?",
      "What metrics would you track for a new messaging feature on a social network?",
      "How would you determine if a feature needs to be redesigned vs optimized?",
      "Explain how you would design an A/B test to test a new checkout layout.",
      "What is the technical impact of choosing SQL vs NoSQL for a user profile database?",
      "How do you prioritize technical debt vs new user features?"
    ]
  }
};

function getGenericQuestions(role) {
  return [
    `Tell me about a project you led or contributed to in the field of ${role || 'your specialty'}.`,
    `What is the most significant challenge you expect to face as a ${role || 'specialist'}?`,
    `How do you handle constructive criticism on your performance or deliverable?`,
    `Describe your typical workflow when beginning a new assignment or analysis.`,
    `How do you manage stress or burnout when coordinating multiple high-impact projects?`,
    `What tools or platforms do you rely on daily, and why do you prefer them?`,
    `Why are you looking to transition or step into a role as a ${role || 'professional'}?`
  ];
}

// --------------- Endpoint 1: Resume Analyzer ---------------
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    const jobRole = req.body.jobRole || 'General Professional';
    const jobDescription = req.body.jobDescription || '';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Missing file", details: "Please upload a resume file (PDF or DOCX)." });
    }

    let resumeText = '';
    if (file.mimetype === 'application/pdf') {
      try {
        const parsed = await pdfParse(file.buffer);
        resumeText = parsed.text;
      } catch (err) {
        return res.status(500).json({ error: "PDF Parsing Error", details: err.message });
      }
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.endsWith('.docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        resumeText = result.value;
      } catch (err) {
        return res.status(500).json({ error: "DOCX Parsing Error", details: err.message });
      }
    } else {
      return res.status(400).json({ error: "Invalid File Type", details: "Only PDF and DOCX files are supported." });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Empty File Content", details: "Unable to extract text from the file." });
    }

    console.log('Analyzing for role:', jobRole);
    console.log('Resume length:', resumeText.length);

    const getFallback = () => {
      const roleKey = jobRole.toLowerCase();
      let matchData = MOCK_RESUMES.generic;
      if (roleKey.includes('engineer') || roleKey.includes('developer') || roleKey.includes('software') || roleKey.includes('frontend')) {
        matchData = MOCK_RESUMES.software;
      } else if (roleKey.includes('product') || roleKey.includes('pm')) {
        matchData = MOCK_RESUMES.pm;
      } else if (roleKey.includes('data') || roleKey.includes('analyst') || roleKey.includes('science')) {
        matchData = MOCK_RESUMES.data;
      } else if (roleKey.includes('marketing') || roleKey.includes('ads') || roleKey.includes('growth')) {
        matchData = MOCK_RESUMES.marketing;
      }

      const score = Math.floor(Math.random() * (90 - 45 + 1)) + 45;
      const breakdown = {
        skillsRelevance: Math.min(Math.round(score * 0.4), 40),
        experienceRelevance: Math.min(Math.round(score * 0.3), 30),
        keywordsMatch: Math.min(Math.round(score * 0.2), 20),
        educationCerts: Math.min(Math.round(score * 0.1), 10)
      };
      return {
        matchScore: score,
        scoreBreakdown: breakdown,
        verdictType: score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Needs Work',
        overallVerdict: score >= 75 ? 'Strong alignment with the target role.' : score >= 50 ? 'Moderate alignment — some gaps to address.' : 'Significant gaps — needs substantial improvement.',
        matchedSkills: matchData.matchedSkills,
        missingSkills: matchData.missingSkills.map(s => ({ ...s, priority: 'Medium' })),
        recommendations: matchData.recommendations.map(r => ({ tip: r.tip, impact: r.impact, category: r.category })),
        nextSteps: {
          thisWeek: ["Update resume with 2 highest priority missing skills", "Add quantified achievements to top 3 bullet points"],
          thisMonth: ["Take an online course for the top missing skill", "Build a portfolio project demonstrating the skill"],
          beforeApplying: ["Run resume through ATS scanner again", "Get peer review on final version"]
        }
      };
    };

    const prompt = `
You are a world-class ATS system combined with a senior 
domain expert recruiter with 20 years of experience hiring 
specifically for ${jobRole} positions.

Your job is to analyze the resume below strictly through 
the lens of what a hiring manager for ${jobRole} would 
care about. You must think domain-first — if the role is 
in hardware/VLSI, think in terms of Verilog, RTL, Cadence. 
If the role is in marketing, think campaigns, analytics, 
brand strategy. Never suggest skills outside the domain 
of this specific role.

TARGET ROLE: ${jobRole}

JOB DESCRIPTION (if available):
${jobDescription || 'Not provided — analyze based on job role title only'}

RESUME:
${resumeText}

STRICT RULES:
- matchedSkills: ONLY skills literally present in the resume 
  that are relevant to ${jobRole}. Do not invent.
- missingSkills: ONLY skills a hiring manager for ${jobRole} 
  would genuinely require. Domain-specific only.
- Each recommendation must reference something actually 
  written in the resume above.
- Score must reflect reality — most resumes score 35-70%.
  Only score 80%+ if the resume is exceptional for this role.
- Scoring: skills match 40pts + experience 30pts + 
  keywords 20pts + education 10pts = 100 total

Respond ONLY with this JSON and nothing else:
{
  "matchScore": <0-100>,
  "scoreBreakdown": {
    "skillsRelevance": <0-40>,
    "experienceRelevance": <0-30>,
    "keywordsMatch": <0-20>,
    "educationCerts": <0-10>
  },
  "verdictType": "Strong Match|Moderate Match|Needs Work",
  "overallVerdict": "<one sentence specific to this resume and role>",
  "matchedSkills": ["<skill actually in resume>"],
  "missingSkills": [
    {
      "skill": "<domain-specific skill for ${jobRole}>",
      "reason": "<why this specific skill matters for ${jobRole}>",
      "priority": "High|Medium|Low"
    }
  ],
  "recommendations": [
    {
      "tip": "<specific tip referencing actual resume content>",
      "impact": "High|Medium|Low",
      "category": "Keywords|Experience|Format|Skills|Achievements"
    }
  ],
  "nextSteps": {
    "thisWeek": ["<action 1>", "<action 2>"],
    "thisMonth": ["<action 1>", "<action 2>"],
    "beforeApplying": ["<action 1>", "<action 2>"]
  }
}`;
    const response = await queryGemini(prompt, getFallback);
    return res.json({ ...response, parsedText: resumeText });

  } catch (globalErr) {
    console.error("Endpoint Error: /api/analyze-resume", globalErr);
    return res.status(500).json({ error: "Internal Server Error", details: globalErr.message });
  }
});

// --------------- Endpoint 2: Generate Interview Questions ---------------
app.post('/api/interview/generate-questions', async (req, res) => {
  try {
    const { role: jobRole, experience: experienceLevel, type: interviewType } = req.body;

    const getFallback = () => {
      const r = (jobRole || 'software').toLowerCase();
      const t = interviewType || 'Mixed';
      let pool = null;
      if (r.includes('engineer') || r.includes('developer') || r.includes('software') || r.includes('frontend')) {
        pool = MOCK_QUESTIONS.software[t] || MOCK_QUESTIONS.software.Mixed;
      } else if (r.includes('product') || r.includes('pm')) {
        pool = MOCK_QUESTIONS.pm[t] || MOCK_QUESTIONS.pm.Behavioral;
      }

      if (!pool) {
        pool = getGenericQuestions(jobRole);
      }
      return {
        questions: pool.map((q, i) => ({
          id: i + 1,
          question: q,
          type: t === 'Behavioral' ? 'Behavioral' : t === 'Technical' ? 'Technical' : 'Mixed',
          skillTested: 'General competency',
          difficulty: 'Medium',
          hint: 'Cover key points relevant to the question'
        })),
        interviewFocus: `A ${interviewType} interview for ${jobRole} at ${experienceLevel} level`,
        totalQuestions: 7
      };
    };

    const prompt = `
You are a senior hiring manager at a top-tier company 
with deep expertise in hiring for ${jobRole} roles.
You are conducting a ${interviewType} interview for a 
candidate at ${experienceLevel} experience level.

Generate exactly 7 interview questions for ${jobRole}.

Question distribution rules:
- If interviewType is "Behavioral": 
  5 behavioral (STAR-format) + 2 situational
- If interviewType is "Technical":
  5 technical/domain-specific + 2 problem-solving
- If interviewType is "Mixed":
  3 behavioral + 3 technical + 1 culture/motivation

Experience level calibration:
- Fresher: foundational concepts, learning attitude, 
  academic projects, internships
- 1-3 years: hands-on practical skills, 
  real project experience, teamwork
- 3-5 years: leadership moments, complex problems solved,
  impact and metrics
- Senior: strategy, architecture decisions, 
  mentoring, cross-functional influence
- Executive: vision, org-level decisions, 
  stakeholder management, business impact

Every question must:
- Be specifically relevant to ${jobRole}
- Be appropriately difficult for ${experienceLevel} level
- Be open-ended (no yes/no questions)
- Feel like a real interview question, not generic

Respond ONLY with this JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "<the interview question>",
      "type": "Behavioral|Technical|Situational|Motivational",
      "skillTested": "<what this question is testing>",
      "difficulty": "Easy|Medium|Hard",
      "hint": "<what a good answer should cover — for feedback use only>"
    }
  ],
  "interviewFocus": "<one sentence describing the focus of this interview>",
  "totalQuestions": 7
}`;

    const response = await queryGemini(prompt, getFallback);
    return res.json(response);

  } catch (err) {
    console.error("Endpoint Error: /api/interview/generate-questions", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// --------------- Endpoint 3: Evaluate Interview Answer ---------------
app.post('/api/interview/evaluate-answer', async (req, res) => {
  try {
    const { role: jobRole, experience: experienceLevel, question, questionType, skillTested, hint, answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: "Missing Answer", details: "Candidate's response content is required." });
    }

    const getFallback = () => {
      const words = answer.trim().split(/\s+/).length;
      let score = 5;
      let strengths = ["Submitted a response in a timely manner."];
      let improvements = ["Provide more background details on the task."];

      if (words < 10) {
        score = 3;
        strengths = ["Responded to the prompt."];
        improvements = ["Answer is extremely brief. Expand using the STAR method (Situation, Task, Action, Result) to provide sufficient detail.", "Add concrete examples of technologies or actions you took."];
      } else if (words >= 10 && words < 30) {
        score = 5;
        strengths = ["Identified a relevant concept."];
        improvements = ["Clarify what specific actions you performed vs team efforts.", "Include quantifiable achievements or outcomes in your result phase."];
      } else if (words >= 30 && words < 70) {
        score = 7;
        strengths = ["Structured the response well.", "Demonstrated understanding of core concepts."];
        improvements = ["Elaborate on technical choices or trade-offs involved.", "Detail any lessons learned or secondary takeaways."];
      } else {
        score = 9;
        strengths = ["Excellent, detailed explanation of the challenge and your individual role.", "Used active verbs and structured result indicators."];
        improvements = ["Refine communication to be slightly more concise.", "Briefly mention alternative design patterns considered."];
      }

      return {
        score: score,
        scoreLabel: score >= 9 ? 'Exceptional' : score >= 7 ? 'Good' : score >= 5 ? 'Average' : score >= 3 ? 'Below Average' : 'Poor',
        strengths: strengths,
        improvements: improvements,
        idealAnswerDirection: `A strong answer should outline: 1) The exact situation and challenge faced. 2) The precise technology stack or managerial actions applied to resolve it. 3) The concrete business impact (revenue, load times, team velocity) driven by your contribution.`,
        starAnalysis: { applicable: false, situation: "Missing", task: "Missing", action: "Missing", result: "Missing" },
        keywordsMissed: [],
        encouragement: "Keep practicing — every answer makes you stronger!"
      };
    };

    const prompt = `
You are an expert interview coach who has coached 
thousands of candidates for ${jobRole} positions.

You are evaluating ONE answer in a mock interview.

JOB ROLE: ${jobRole}
EXPERIENCE LEVEL EXPECTED: ${experienceLevel}
QUESTION: ${question}
QUESTION TYPE: ${questionType}
SKILL BEING TESTED: ${skillTested}
WHAT A GOOD ANSWER COVERS: ${hint}

CANDIDATE'S ANSWER:
${answer}

Evaluate this answer honestly and constructively.

Scoring guide (1-10):
9-10: Exceptional — specific, structured, demonstrates mastery
7-8: Good — covers key points with some specifics
5-6: Average — relevant but vague or missing key elements  
3-4: Below average — partially relevant, significant gaps
1-2: Poor — off-topic, too short, or completely wrong

For ${questionType} questions:
- Behavioral: did they use STAR format? 
  (Situation, Task, Action, Result)
- Technical: was the answer accurate and detailed enough 
  for ${experienceLevel} level?
- Situational: did they show clear reasoning and judgment?

Respond ONLY with this JSON:
{
  "score": <1-10>,
  "scoreLabel": "Exceptional|Good|Average|Below Average|Poor",
  "strengths": [
    "<specific strength observed in their answer>",
    "<another specific strength>"
  ],
  "improvements": [
    "<specific thing missing or weak in their answer>",
    "<another improvement>"
  ],
  "idealAnswerDirection": "<2-3 sentences on what an ideal answer would include, specific to the question and role>",
  "starAnalysis": {
    "applicable": <true if behavioral question>,
    "situation": "Present|Missing|Partial",
    "task": "Present|Missing|Partial",
    "action": "Present|Missing|Partial",
    "result": "Present|Missing|Partial"
  },
  "keywordsMissed": ["<important keyword/concept they should have mentioned>"],
  "encouragement": "<one motivating sentence to keep candidate going>"
}`;

    const response = await queryGemini(prompt, getFallback);
    return res.json(response);

  } catch (err) {
    console.error("Endpoint Error: /api/interview/evaluate-answer", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// --------------- Endpoint 4: Interview Final Report ---------------
app.post('/api/interview/final-report', async (req, res) => {
  try {
    const { role: jobRole, experience: experienceLevel, questionsAndAnswers } = req.body;

    const getFallback = () => {
      let total = 0;
      let count = 0;

      if (questionsAndAnswers && questionsAndAnswers.length > 0) {
        questionsAndAnswers.forEach(item => {
          if (item.score) {
            total += item.score;
            count++;
          }
        });
      }

      const averageScore = count > 0 ? (total / count) : 7;
      const pctScore = Math.round(averageScore * 10);

      let strengths = [{ strength: "Technical terminology", evidence: "Applied proper domain vocabulary in answers." }];
      let areas = [{ area: "Answer depth", suggestion: "Elaborate more on specific actions taken.", resources: "Practice problems" }];
      let keyTip = "Practice the STAR method. Focus 50% of your talking time on the Actions YOU personally took and the quantified Results they produced.";

      if (pctScore < 50) {
        strengths = [{ strength: "Basic familiarity", evidence: "Shows understanding of standard concepts." }];
        areas = [{ area: "Answer depth", suggestion: "Expand answers with specific examples and details.", resources: "Practice problems, books" }];
        keyTip = "Review core engineering/product fundamentals. Ensure you expand on technical terms and explain your design choices in detail.";
      } else if (pctScore >= 80) {
        strengths = [{ strength: "Superb articulation", evidence: "Highly structured responses with clear outcomes." }];
        areas = [{ area: "Delivery speed", suggestion: "Practice concise delivery while maintaining depth.", resources: "Mock interviews" }];
        keyTip = "Practice complex scenario walkthroughs. Explain how you mitigate risks during long-lifecycle projects to demonstrate executive readiness.";
      }

      return {
        overallScore: pctScore,
        overallGrade: pctScore >= 80 ? 'A' : pctScore >= 65 ? 'B' : pctScore >= 50 ? 'C' : pctScore >= 35 ? 'D' : 'F',
        overallVerdict: pctScore >= 80 ? 'Excellent performance across the board.' : pctScore >= 65 ? 'Good performance with room to grow.' : 'Needs significant preparation.',
        readinessLevel: pctScore >= 80 ? 'Ready to Apply' : pctScore >= 65 ? 'Almost Ready' : pctScore >= 50 ? 'Needs More Prep' : 'Significant Work Needed',
        topStrengths: strengths,
        focusAreas: areas,
        keyTip: keyTip,
        questionBreakdown: (questionsAndAnswers || []).map((qa, i) => ({
          questionNumber: i + 1,
          score: qa.score || 5,
          oneLineFeedback: qa.score >= 7 ? 'Good answer with solid structure.' : 'Needs more depth and specifics.'
        })),
        studyPlan: {
          week1: "Review core fundamentals and practice STAR method",
          week2: "Focus on weak areas identified in this interview",
          week3: "Do timed mock interviews with peer feedback",
          beforeNextInterview: "Review this report and practice your weakest 2 areas"
        },
        estimatedReadyDate: pctScore >= 80 ? 'Ready now' : '2-3 weeks of focused practice'
      };
    };

    const prompt = `
You are a senior interview coach generating a 
comprehensive performance report after a complete 
mock interview session for ${jobRole}.

JOB ROLE: ${jobRole}
EXPERIENCE LEVEL: ${experienceLevel}

COMPLETE INTERVIEW SESSION:
${questionsAndAnswers.map((qa, i) => `
Question ${i+1} [${qa.questionType}]: ${qa.question}
Skill Tested: ${qa.skillTested}
Score: ${qa.score}/10
Candidate's Answer: ${qa.answer}
`).join('\n---\n')}

Generate a comprehensive, honest, and encouraging 
post-interview report. Be specific — reference actual 
answers given above, not generic advice.

Respond ONLY with this JSON:
{
  "overallScore": <0-100>,
  "overallGrade": "A|B|C|D|F",
  "overallVerdict": "<one powerful sentence summarizing performance>",
  "readinessLevel": "Ready to Apply|Almost Ready|Needs More Prep|Significant Work Needed",
  "topStrengths": [
    {
      "strength": "<specific strength title>",
      "evidence": "<reference to specific answer that showed this>"
    }
  ],
  "focusAreas": [
    {
      "area": "<specific area to improve>",
      "suggestion": "<specific actionable way to improve this>",
      "resources": "<type of resource: practice problems, books, courses>"
    }
  ],
  "questionBreakdown": [
    {
      "questionNumber": <1-7>,
      "score": <1-10>,
      "oneLineFeedback": "<specific feedback for this answer>"
    }
  ],
  "keyTip": "<the single most impactful piece of advice for this candidate based on their actual performance>",
  "studyPlan": {
    "week1": "<what to focus on this week>",
    "week2": "<what to focus on next week>",
    "week3": "<what to focus on week 3>",
    "beforeNextInterview": "<final checklist item>"
  },
  "estimatedReadyDate": "<realistic timeframe e.g. '2-3 weeks of focused practice'>"
}`;

    const response = await queryGemini(prompt, getFallback);
    return res.json(response);

  } catch (err) {
    console.error("Endpoint Error: /api/interview/final-report", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// --------------- Endpoint 5: Writing Enhancer ---------------
app.post('/api/enhance-writing', async (req, res) => {
  try {
    const { type: writingType, goal, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing Text", details: "Please provide the text you wish to enhance." });
    }

    const getFallback = () => {
      let enhancedText = `Dear Team,\n\nI am writing to provide an update on the progress of our current deliverables. We have made significant improvements in the core components, and everything is on track for our upcoming release. Please review the updated design system and share your feedback by Monday.\n\nBest regards,\nProfessional Sender`;
      let changes = [
        { type: "Clarity", original: "I am writing to provide an update", improved: "Here is the update on", explanation: "Simplified overly technical sentence structures into clear, active sentences." },
        { type: "Tone", original: "We have made significant improvements", improved: "We have completed key improvements", explanation: "Adjusted the phrasing to sound collaborative yet professional and authoritative." },
        { type: "Conciseness", original: "everything is on track for our upcoming release", improved: "we are on track for release", explanation: "Removed filler words and passive voice construction, reducing word count by 18%." }
      ];

      if (writingType === "Professional Email") {
        enhancedText = `Hi Team,\n\nFollowing up on our discussions, I have finalized the implementation specifications. Could you please review the attached documentation and let me know your thoughts? Let's connect for 10 minutes tomorrow to align on next steps.\n\nBest,\n[Your Name]`;
        changes = [
          { type: "Professionalism", original: "I am writing to provide an update", improved: "Following up on our discussions", explanation: "Replaced casual greetings with appropriate business formulations." },
          { type: "Clarity", original: "We have made significant improvements", improved: "I have finalized the implementation specifications", explanation: "Specified a clear call-to-action (review docs and meeting alignment) rather than vague open questions." }
        ];
      } else if (writingType === "Cover Letter") {
        enhancedText = `Dear Hiring Team,\n\nI am excited to apply for the position. With over four years of experience designing high-performance user interfaces and coordinating cross-functional teams, I am confident in my ability to contribute value from day one. In my recent role, I led frontend optimizations that improved user retention by 15%.\n\nThank you for your consideration,\n[Your Name]`;
        changes = [
          { type: "Tone", original: "I am writing to apply for", improved: "I am excited to apply for", explanation: "Transformed passive expressions into assertive ownership statements." },
          { type: "Conciseness", original: "I have experience in designing and coordinating", improved: "With over four years of experience designing", explanation: "Consolidated three narrative paragraphs into one high-impact introductory block." }
        ];
      } else if (writingType === "LinkedIn Message") {
        enhancedText = `Hi [Name],\n\nI came across your profile and was impressed by your work at [Company]. I'm currently expanding my network in engineering leadership and would love to connect. If you have 5 minutes sometime, I'd value hearing about your journey.\n\nBest,\n[Your Name]`;
        changes = [
          { type: "Conciseness", original: "I am writing to you because I came across your profile", improved: "I came across your profile", explanation: "Shortened the outreach message to fit easily on mobile screen notifications." },
          { type: "Tone", original: "I would like to connect with you", improved: "I would love to connect", explanation: "Shifted the query from transactional request to networking request." }
        ];
      }

      return {
        enhancedText: enhancedText,
        subjectLine: writingType === "Professional Email" ? "Update on Current Deliverables" : null,
        readabilityScore: { before: 5, after: 8 },
        toneAnalysis: { before: "Passive", after: "Confident" },
        wordCountComparison: { before: text.split(/\s+/).length, after: enhancedText.split(/\s+/).length },
        changes: changes,
        topImprovement: "Transformed passive voice to active voice throughout, making the writing more direct and impactful.",
        writingTips: [
          "Start with your main point — don't bury the lead.",
          "Use active voice to sound more confident and direct.",
          "Remove filler words like 'just', 'actually', 'really'."
        ]
      };
    };

    const prompt = `
You are a world-class professional business writing coach 
and editor who has worked with Fortune 500 executives, 
helped thousands of professionals write better emails, 
reports, and communications that actually get results.

WRITING TYPE: ${writingType}
GOAL OF THIS WRITING: ${goal || 'General professional communication'}

ORIGINAL TEXT TO ENHANCE:
${text}

Your job:
1. Rewrite this ${writingType} to be dramatically more 
   effective, professional, and clear while preserving 
   the writer's core message and intent.
2. Identify every meaningful change you made and explain 
   exactly why it makes the writing better.

Enhancement rules by type:

Professional Email:
  - Subject line should be specific and action-oriented
  - Opening: skip "I hope this email finds you well"
  - Be direct — state purpose in first sentence
  - Use short paragraphs (2-3 sentences max)
  - Clear call to action at the end
  - Professional but human tone

Business Report:
  - Executive summary first
  - Use active voice throughout
  - Numbers and specifics over vague statements
  - Clear section structure
  - Actionable conclusions

LinkedIn Message:
  - Personalized opening (not "I came across your profile")
  - Specific reason for reaching out
  - Clear value exchange — what's in it for them
  - Short — under 100 words ideal
  - Friendly professional tone

Cover Letter:
  - Hook opening — not "I am writing to apply for"
  - Specific achievements with numbers
  - Connect your experience to their needs
  - Show you researched the company/role
  - Confident, not desperate tone

General Paragraph:
  - Clear topic sentence
  - Logical flow between ideas
  - Eliminate redundancy
  - Active voice
  - Vary sentence length

Respond ONLY with this JSON:
{
  "enhancedText": "<the complete rewritten version>",
  "subjectLine": "<improved subject line if this is an email, otherwise null>",
  "readabilityScore": {
    "before": <1-10>,
    "after": <1-10>
  },
  "toneAnalysis": {
    "before": "<e.g. Passive, Formal, Uncertain>",
    "after": "<e.g. Confident, Professional, Direct>"
  },
  "wordCountComparison": {
    "before": <word count of original>,
    "after": <word count of enhanced>
  },
  "changes": [
    {
      "type": "Clarity|Tone|Professionalism|Grammar|Conciseness|Structure|Impact",
      "original": "<the original phrase or sentence>",
      "improved": "<what it became>",
      "explanation": "<specific reason why this change makes it better>"
    }
  ],
  "topImprovement": "<the single most impactful change made and why>",
  "writingTips": [
    "<personalized tip 1 based on patterns in their writing>",
    "<personalized tip 2>",
    "<personalized tip 3>"
  ]
}`;

    const response = await queryGemini(prompt, getFallback);
    return res.json(response);

  } catch (err) {
    console.error("Endpoint Error: /api/enhance-writing", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// --------------- Endpoint 6: Job Description Scraper ---------------
app.post('/api/scrape-job', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
        fallback: false
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL provided",
        fallback: false
      });
    }

    const scrapeHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
    };

    let html;
    try {
      const response = await axios.get(url, {
        headers: scrapeHeaders,
        timeout: 10000,
      });
      html = response.data;
    } catch {
      return res.json({
        success: false,
        error: "Could not extract job details from this URL",
        fallback: true
      });
    }

    const $ = cheerio.load(html);
    let jobTitle = '';
    let company = '';
    let description = '';
    let location = '';

    const clean = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('linkedin.com/jobs')) {
      jobTitle = clean($('h1').first().text()) || clean($('.top-card-layout__title').first().text()) || '';
      company = clean($('.topcard__org-name-link').first().text()) || clean($('.top-card-layout__card a').first().text()) || '';
      description = clean($('.description__text').first().text()) || clean($('.show-more-less-html__markup').first().text()) || '';
      location = clean($('.topcard__flavor--bullet').first().text()) || '';
    } else if (lowerUrl.includes('naukri.com')) {
      jobTitle = clean($('h1').first().text()) || clean($('.jd-header-title').first().text()) || '';
      company = clean($('.jd-header-comp-name').first().text()) || '';
      description = clean($('.job-desc').first().text()) || clean($('.dang-inner-html').first().text()) || '';
      const skills = [];
      $('.key-skill span').each((_, el) => {
        const s = clean($(el).text());
        if (s) skills.push(s);
      });
      return res.json({
        success: true,
        jobTitle,
        company,
        description,
        extractedSkills: skills,
        location
      });
    } else {
      jobTitle = clean($('h1').first().text()) || '';
      const paragraphs = [];
      $('p').each((_, el) => {
        const t = clean($(el).text());
        if (t) paragraphs.push(t);
      });
      description = paragraphs.join('\n\n') || '';
      company = clean($('meta[property="og:site_name"]').attr('content')) || '';
    }

    return res.json({
      success: true,
      jobTitle,
      company,
      description,
      extractedSkills: [],
      location
    });

  } catch (err) {
    console.error("Endpoint Error: /api/scrape-job", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      fallback: true
    });
  }
});

// --------------- Endpoint 7: ATS Simulator ---------------
app.post('/api/ats-simulate', async (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;

    if (!resumeText || !resumeText.trim() || !jobRole || !jobRole.trim()) {
      return res.status(400).json({ error: true, message: "resumeText and jobRole are required" });
    }

    const prompt = `
You are simulating an enterprise ATS system like 
Workday, Greenhouse, or Taleo parsing a resume.

JOB ROLE: ${jobRole}

RESUME TEXT:
${resumeText}

Simulate exactly how an ATS would parse and score 
this resume for the given job role.

Respond ONLY with this JSON and nothing else:
{
  "atsScore": <0-100>,
  "parseability": "Excellent|Good|Fair|Poor",
  "sectionsDetected": {
    "contactInfo": <true|false>,
    "summary": <true|false>,
    "experience": <true|false>,
    "education": <true|false>,
    "skills": <true|false>,
    "certifications": <true|false>
  },
  "keywordsFound": [
    {
      "keyword": "<keyword found in resume>",
      "frequency": <number of times found>,
      "importance": "High|Medium|Low",
      "context": "<sentence it was found in>"
    }
  ],
  "keywordsMissing": [
    {
      "keyword": "<important missing keyword>",
      "importance": "High|Medium|Low",
      "reason": "<why ATS looks for this keyword>"
    }
  ],
  "parsingIssues": [
    {
      "issue": "<description of parsing problem>",
      "severity": "Critical|Warning|Info",
      "fix": "<specific fix for this issue>"
    }
  ],
  "formatIssues": [
    "<format issue that hurts ATS parsing>"
  ],
  "atsReadabilityTips": [
    "<specific tip to improve ATS score>"
  ],
  "estimatedInterviewChance": "<e.g. 23%>"
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json[\s\S]*?```|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);

  } catch (err) {
    console.error("Endpoint Error: /api/ats-simulate", err);
    return res.status(500).json({ error: true, message: "ATS simulation failed" });
  }
});

// --------------- Endpoint 8: LinkedIn Profile Analyzer ---------------
app.post('/api/linkedin/analyze', async (req, res) => {
  try {
    const { profileText, targetRole } = req.body;

    if (!profileText || !profileText.trim() || !targetRole || !targetRole.trim()) {
      return res.status(400).json({ error: true, message: "profileText and targetRole are required" });
    }

    const prompt = `
You are a LinkedIn optimization expert and senior 
recruiter with 15 years of experience who knows 
exactly what makes a LinkedIn profile get noticed.

TARGET ROLE: ${targetRole}

LINKEDIN PROFILE TEXT:
${profileText}

Analyze this LinkedIn profile section by section 
and provide specific optimization for ${targetRole}.

Key recruiter facts:
- Recruiters spend 7 seconds average on a profile
- Headline is most important field after name
- First 3 lines of About show before "see more"
- Keywords in headline boost search appearance by 40%

Respond ONLY with this JSON and nothing else:
{
  "overallScore": <0-100>,
  "profileStrength": "All-Star|Expert|Intermediate|Beginner",
  "recruiterAppeal": <0-10>,
  "searchAppearanceScore": <0-100>,
  "sections": {
    "headline": {
      "current": "<extracted or Not found>",
      "score": <0-10>,
      "issues": ["<issue>"],
      "improved": "<optimized headline>",
      "explanation": "<why this is better>"
    },
    "about": {
      "current": "<extracted summary>",
      "score": <0-10>,
      "issues": ["<issue>"],
      "improved": "<optimized about section>",
      "explanation": "<why this is better>",
      "hookStrength": "Strong|Weak|Missing"
    },
    "experience": {
      "score": <0-10>,
      "issues": ["<issue>"],
      "bulletImprovements": [
        {
          "original": "<original bullet>",
          "improved": "<improved bullet>",
          "reason": "<why better>"
        }
      ]
    },
    "skills": {
      "score": <0-10>,
      "topSkillsForRole": ["<skill>"],
      "missingSkills": ["<skill>"],
      "skillsToRemove": ["<skill>"]
    }
  },
  "keywordOptimization": {
    "currentKeywords": ["<keyword>"],
    "missingKeywords": ["<keyword>"],
    "keywordDensityScore": <0-10>
  },
  "quickWins": [
    {
      "action": "<specific quick action>",
      "impact": "High|Medium|Low",
      "timeToComplete": "<e.g. 5 minutes>"
    }
  ],
  "optimizedHeadline": "<best headline>",
  "alternativeHeadlines": ["<option 2>", "<option 3>"],
  "profileBio": "<complete rewritten About section>",
  "connectionStrategy": "<advice for growing network>",
  "contentStrategy": "<what to post to attract recruiters>"
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json[\s\S]*?```|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);

  } catch (err) {
    console.error("Endpoint Error: /api/linkedin/analyze", err);
    return res.status(500).json({ error: true, message: "Analysis failed" });
  }
});

// --------------- Resume Section Enhancer ---------------
app.post('/api/resume/enhance-section', async (req, res) => {
  try {
    const { section, content, jobRole } = req.body;

    if (!section || !content || !jobRole) {
      return res.status(400).json({ error: true, message: "section, content, and jobRole are required" });
    }

    const prompt = `
You are a professional resume writer with expertise in writing resumes that pass ATS and impress hiring managers.

Enhance this ${section} section for someone targeting ${jobRole} positions.

ORIGINAL CONTENT:
${content}

STRICT RULES:
- Use strong action verbs (Led, Built, Achieved, Delivered)
- Add quantifiable metrics where the original hints at them
- Keep ATS-friendly language
- Do not invent facts not present in original
- Match keywords relevant to ${jobRole}
- Be concise and impactful

Respond ONLY with this JSON:
{
  "enhanced": "<the improved content as plain text>",
  "changes": ["<specific change made and why>"],
  "actionVerbs": ["<verb used in enhanced version>"],
  "keywordsAdded": ["<ATS keyword added>"]
}`;

    let parsed;
    if (isSimulationMode) {
      parsed = {
        enhanced: content,
        changes: ["Simulation mode – no AI enhancement available"],
        actionVerbs: [],
        keywordsAdded: []
      };
    } else {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const enhanceModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.2, topP: 0.8, topK: 10 }
      });
      const result = await enhanceModel.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = raw.replace(/```json[\s\S]*?```|```/gi, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);

  } catch (err) {
    console.error("Endpoint Error: /api/resume/enhance-section", err);
    return res.status(500).json({ error: true, message: "Section enhancement failed" });
  }
});

// --------------- Resume PDF Generator ---------------
app.post('/api/resume/generate-pdf', async (req, res) => {
  try {
    const { resumeData, template } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: true, message: "resumeData is required" });
    }

    const { personalInfo, summary, experience, education, skills, projects, certifications } = resumeData;

    const safeStr = (v) => v || '';

    const contactParts = [
      safeStr(personalInfo?.email),
      safeStr(personalInfo?.phone),
      safeStr(personalInfo?.location),
      safeStr(personalInfo?.linkedin),
      safeStr(personalInfo?.website)
    ].filter(Boolean);

    const experienceHTML = (experience || []).map(job => `
      <div style="margin-bottom:10px">
        <div class="job-header">
          <div>
            <div class="job-title">${safeStr(job.title)}</div>
            <div class="company">${safeStr(job.company)}${job.location ? ' — ' + safeStr(job.location) : ''}</div>
          </div>
          <div class="date">${safeStr(job.startDate)} – ${safeStr(job.endDate) || 'Present'}</div>
        </div>
        <ul class="responsibilities">
          ${(job.responsibilities || [safeStr(job.description || '')]).map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const educationHTML = (education || []).map(edu => `
      <div style="margin-bottom:6px">
        <div class="job-header">
          <div>
            <div class="job-title">${safeStr(edu.degree)}</div>
            <div class="company">${safeStr(edu.institution)}</div>
          </div>
          <div class="date">${safeStr(edu.year)}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}</div>
        </div>
      </div>
    `).join('');

    const skillsHTML = (skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');

    const projectsHTML = (projects || []).map(proj => `
      <div style="margin-bottom:8px">
        <div class="job-header">
          <div>
            <div class="job-title">${safeStr(proj.name)}</div>
            ${proj.url ? `<a href="${proj.url}" style="font-size:10px;color:#4F8EF7">${proj.url}</a>` : ''}
          </div>
        </div>
        <div style="color:#374151;font-size:10px;margin-bottom:4px">${safeStr(proj.description)}</div>
        ${(proj.technologies || []).length ? `<div>${proj.technologies.map(t => `<span class="skill-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');

    const certHTML = (certifications || []).map(cert => `
      <div style="margin-bottom:4px;font-size:10px">
        <strong>${safeStr(cert.name)}</strong> – ${safeStr(cert.issuer)}${cert.year ? ' (' + cert.year + ')' : ''}
      </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    padding: 32px 40px;
    line-height: 1.5;
  }
  .name {
    font-size: 24px; font-weight: 700;
    color: #0f172a; letter-spacing: -0.5px;
  }
  .contact-row {
    display: flex; gap: 16px; margin-top: 4px;
    font-size: 10px; color: #475569;
  }
  .section-title {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    color: #4F8EF7; margin-top: 20px; margin-bottom: 6px;
    border-bottom: 1.5px solid #4F8EF7;
    padding-bottom: 3px;
  }
  .job-header {
    display: flex; justify-content: space-between;
    margin-bottom: 4px;
  }
  .job-title { font-weight: 600; font-size: 11px; }
  .company { color: #475569; font-size: 10px; }
  .date { color: #94a3b8; font-size: 10px; }
  .responsibilities {
    margin-left: 12px; margin-top: 4px;
  }
  .responsibilities li {
    margin-bottom: 3px; color: #374151;
  }
  .skill-tag {
    display: inline-block;
    background: #f1f5f9; border-radius: 4px;
    padding: 2px 8px; margin: 2px; font-size: 10px;
    color: #1e40af;
  }
  .summary-text { color: #374151; font-size: 11px; }
</style>
</head>
<body>
  <div class="name">${safeStr(personalInfo?.name || 'Your Name')}</div>
  ${contactParts.length ? `<div class="contact-row">${contactParts.join(' &nbsp;|&nbsp; ')}</div>` : ''}

  ${summary ? `<div class="section-title">Professional Summary</div><div class="summary-text">${summary}</div>` : ''}

  ${experienceHTML ? `<div class="section-title">Experience</div>${experienceHTML}` : ''}

  ${educationHTML ? `<div class="section-title">Education</div>${educationHTML}` : ''}

  ${skillsHTML ? `<div class="section-title">Skills</div><div style="margin-top:4px">${skillsHTML}</div>` : ''}

  ${projectsHTML ? `<div class="section-title">Projects</div>${projectsHTML}` : ''}

  ${certHTML ? `<div class="section-title">Certifications</div>${certHTML}` : ''}
</body>
</html>`;

    const options = { format: 'A4', margin: { top: 0, right: 0, bottom: 0, left: 0 } };
    const file = { content: htmlContent };

    try {
      const pdfBuffer = await htmlPdfNode.generatePdf(file, options);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resume-hireboost.pdf"');
      return res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error("PDF generation engine failed:", pdfErr);
      return res.status(500).json({ error: true, message: "PDF generation failed", fallback: "print" });
    }

  } catch (err) {
    console.error("Endpoint Error: /api/resume/generate-pdf", err);
    return res.status(500).json({ error: true, message: "PDF generation failed", fallback: "print" });
  }
});

// --------------- Health / Mode ---------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: isSimulationMode ? 'simulation' : 'live',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/mode', (req, res) => {
  res.json({ mode: isSimulationMode ? 'simulation' : 'live' });
});

// --------------- Global Error Handler ---------------
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled Error:`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal Server Error", details: err.message || "An unexpected error occurred." });
  }
});

// --------------- Start Server ---------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${isSimulationMode ? 'SIMULATION' : 'LIVE'} mode.`);
});
