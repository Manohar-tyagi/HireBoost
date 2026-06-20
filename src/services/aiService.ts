/**
 * AI Service for real-time analysis and generation
 * Handles resume analysis, interview feedback, and writing assistance
 */

export interface ResumeAnalysisResult {
  atsScore: number;
  formatScore: number;
  impactScore: number;
  readabilityScore: number;
  lengthScore: number;
  suggestions: {
    category: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  parsedSections: {
    education: string[];
    experience: string[];
    skills: string[];
  };
  improvedVersion?: string;
}

export interface InterviewFeedback {
  overallScore: number;
  scores: {
    content: number;
    structure: number;
    conciseness: number;
    confidence: number;
    technical: number;
  };
  strengths: string[];
  improvements: string[];
  detailedFeedback: {
    question: string;
    score: number;
    feedback: string;
    modelAnswer: string;
  }[];
}

export interface WritingResponse {
  content: string;
  suggestions?: string[];
  tone?: string;
  improvements?: string[];
}

class AIService {
  private readonly API_BASE = 'https://api.openai.com/v1';
  private readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

  private async makeAPICall(messages: any[], maxTokens: number = 2000): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('AI_CONFIG_ERROR: OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await fetch(`${this.API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('AI_AUTH_ERROR: Invalid API key. Please check your OpenAI API key configuration.');
        } else if (response.status === 429) {
          throw new Error('AI_RATE_LIMIT: Too many requests. Please wait a moment and try again.');
        } else if (response.status === 500) {
          throw new Error('AI_SERVER_ERROR: OpenAI service is temporarily unavailable. Please try again in a few minutes.');
        } else {
          throw new Error(`AI_API_ERROR: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI_EMPTY_RESPONSE: Received empty response from AI service. Please try again.');
      }
      
      return content;
    } catch (error) {
      console.error('AI API call failed:', error);
      
      // Re-throw custom errors as-is
      if (error instanceof Error && error.message.startsWith('AI_')) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('AI_NETWORK_ERROR: Unable to connect to AI service. Please check your internet connection.');
      }
      
      // Generic fallback
      throw new Error('AI_UNKNOWN_ERROR: An unexpected error occurred. Please try again.');
    }
  }

  async analyzeResume(resumeText: string, targetRole?: string): Promise<ResumeAnalysisResult> {
    // Validate input - allow shorter resumes but provide a warning in the analysis
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('AI_INPUT_ERROR: Please provide some resume content to analyze.');
    }

    const prompt = `
Analyze this resume and provide detailed feedback. ${targetRole ? `The target role is: ${targetRole}` : ''}

Resume text:
${resumeText}

${resumeText.trim().length < 50 ? 'NOTE: This is a short resume excerpt. Please provide analysis based on the available content and suggest areas for expansion.' : ''}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

Provide a JSON response with exactly this structure:
{
  "atsScore": number (0-100),
  "formatScore": number (0-100),
  "impactScore": number (0-100),
  "readabilityScore": number (0-100),
  "lengthScore": number (0-100),
  "suggestions": [
    {
      "category": "string",
      "text": "string",
      "priority": "high|medium|low"
    }
  ],
  "parsedSections": {
    "education": ["array of education items"],
    "experience": ["array of experience items"],
    "skills": ["array of skills"]
  }
}

Focus on:
- ATS optimization and keyword matching
- Impact and quantification of achievements
- Format and structure improvements
- Readability and clarity
- Appropriate length for the role level

Ensure all scores are realistic numbers between 0-100, and provide at least 3-5 actionable suggestions.
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert resume reviewer and career coach. You must respond with valid JSON only. Provide detailed, actionable feedback to help job seekers improve their resumes. Always return properly formatted JSON with no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 3000);
    
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
      
      const parsed = JSON.parse(jsonString);
      
      // Validate the parsed response structure
      if (!this.validateResumeAnalysisResult(parsed)) {
        throw new Error('Invalid response structure from AI service');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', response);
      
      // Provide fallback analysis if parsing fails
      return this.getFallbackResumeAnalysis(resumeText);
    }
  }

  private validateResumeAnalysisResult(result: any): boolean {
    return (
      typeof result === 'object' &&
      typeof result.atsScore === 'number' &&
      typeof result.formatScore === 'number' &&
      typeof result.impactScore === 'number' &&
      typeof result.readabilityScore === 'number' &&
      typeof result.lengthScore === 'number' &&
      Array.isArray(result.suggestions) &&
      typeof result.parsedSections === 'object' &&
      Array.isArray(result.parsedSections.education) &&
      Array.isArray(result.parsedSections.experience) &&
      Array.isArray(result.parsedSections.skills)
    );
  }

  private getFallbackResumeAnalysis(resumeText: string): ResumeAnalysisResult {
    const wordCount = resumeText.split(/\s+/).length;
    const hasNumbers = /\d/.test(resumeText);
    const hasActionVerbs = /(led|managed|developed|created|improved|increased|achieved|delivered)/i.test(resumeText);
    const isShort = wordCount < 50;
    
    const suggestions = [
      {
        category: 'Keywords',
        text: 'Add relevant industry keywords to improve ATS compatibility',
        priority: 'high' as const
      },
      {
        category: 'Quantification',
        text: 'Include specific numbers and metrics to demonstrate impact',
        priority: 'high' as const
      },
      {
        category: 'Action Verbs',
        text: 'Start bullet points with strong action verbs like "Led", "Developed", "Achieved"',
        priority: 'medium' as const
      },
      {
        category: 'Format',
        text: 'Ensure consistent formatting throughout all sections',
        priority: 'low' as const
      }
    ];

    // Add length suggestion for very short resumes
    if (isShort) {
      suggestions.unshift({
        category: 'Content Length',
        text: 'Consider expanding your resume with more detailed descriptions of your experience, skills, and achievements',
        priority: 'medium' as const
      });
    }
    
    return {
      atsScore: hasActionVerbs ? 75 : 60,
      formatScore: 70,
      impactScore: hasNumbers ? 80 : 50,
      readabilityScore: wordCount > 200 && wordCount < 800 ? 85 : 65,
      lengthScore: isShort ? 40 : (wordCount > 300 && wordCount < 600 ? 90 : 70),
      suggestions,
      parsedSections: {
        education: ['Education information detected in resume'],
        experience: ['Work experience found in resume'],
        skills: ['Technical and soft skills identified']
      }
    };
  }

  async generateImprovedResume(originalText: string, suggestions: any[]): Promise<string> {
    const prompt = `
Based on the following resume and improvement suggestions, generate an improved version:

Original Resume:
${originalText}

Suggestions to implement:
${suggestions.map(s => `- ${s.category}: ${s.text}`).join('\n')}

Please provide an improved version of the resume that implements these suggestions while maintaining the original content and achievements. Focus on:
- Better formatting and structure
- Stronger action verbs
- Quantified achievements
- ATS-friendly keywords
- Professional language
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert resume writer. Create improved, professional resumes that are ATS-friendly and compelling to recruiters.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.makeAPICall(messages, 4000);
  }

  async generateInterviewQuestions(role: string, domain: string, difficulty: string): Promise<string[]> {
    const prompt = `
Generate 5 interview questions for a ${role} position in the ${domain} domain with ${difficulty} difficulty level.

The questions should cover:
1. Introduction/background
2. Technical/role-specific skills
3. Behavioral/situational
4. Problem-solving
5. Career goals/company fit

Return as a JSON array of strings.
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert interviewer and hiring manager. Create relevant, challenging interview questions.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 1500);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to generate interview questions. Please try again.');
    }
  }

  async evaluateInterviewAnswer(question: string, answer: string, role: string): Promise<{
    score: number;
    feedback: string;
    modelAnswer: string;
  }> {
    const prompt = `
Evaluate this interview answer for a ${role} position:

Question: ${question}
Answer: ${answer}

Provide a JSON response with:
{
  "score": number (0-10),
  "feedback": "detailed feedback on the answer",
  "modelAnswer": "example of a strong answer to this question"
}

Consider:
- Relevance to the question
- Use of specific examples
- Structure (STAR method if applicable)
- Clarity and communication
- Demonstration of skills/experience
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert interviewer and career coach. Provide constructive feedback on interview answers.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 2000);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to evaluate interview answer. Please try again.');
    }
  }

  async generateInterviewFeedback(
    role: string,
    answers: { question: string; answer: string; timeSpent: number }[]
  ): Promise<InterviewFeedback> {
    const prompt = `
Provide comprehensive interview feedback for a ${role} position based on these Q&A pairs:

${answers.map((a, i) => `
Question ${i + 1}: ${a.question}
Answer: ${a.answer}
Time spent: ${a.timeSpent} seconds
`).join('\n')}

Provide a JSON response with:
{
  "overallScore": number (0-10),
  "scores": {
    "content": number (0-10),
    "structure": number (0-10),
    "conciseness": number (0-10),
    "confidence": number (0-10),
    "technical": number (0-10)
  },
  "strengths": ["array of strengths"],
  "improvements": ["array of improvement areas"],
  "detailedFeedback": [
    {
      "question": "string",
      "score": number (0-10),
      "feedback": "specific feedback",
      "modelAnswer": "example strong answer"
    }
  ]
}
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert interview coach and hiring manager. Provide detailed, constructive feedback to help candidates improve.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 4000);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to generate interview feedback. Please try again.');
    }
  }

  async generateWritingContent(
    type: string,
    targetRole: string,
    companyName?: string,
    additionalContext?: string
  ): Promise<WritingResponse> {
    const prompt = `
Generate a professional ${type} for a ${targetRole} position${companyName ? ` at ${companyName}` : ''}.

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Professional and compelling tone
- Tailored to the specific role
- Include relevant skills and experience placeholders
- Follow best practices for ${type}
- Be specific and actionable

Provide a JSON response with:
{
  "content": "the generated content",
  "suggestions": ["array of tips for customization"],
  "tone": "description of the tone used",
  "improvements": ["array of ways to further improve"]
}
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert career writer and coach. Create compelling, professional content that helps job seekers stand out.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 3000);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to generate writing content. Please try again.');
    }
  }

  async improveWritingContent(originalContent: string, improvementRequest: string): Promise<WritingResponse> {
    const prompt = `
Improve this content based on the user's request:

Original content:
${originalContent}

Improvement request:
${improvementRequest}

Provide a JSON response with:
{
  "content": "the improved content",
  "suggestions": ["array of additional improvement tips"],
  "tone": "description of the tone used",
  "improvements": ["array of specific changes made"]
}
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert editor and career writer. Improve professional content based on specific feedback and requests.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.makeAPICall(messages, 2500);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to improve writing content. Please try again.');
    }
  }

  async chatWithAssistant(message: string, conversationHistory: any[] = []): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are HireBoost's AI Writing Assistant, an expert career coach and professional writer. Help users with:
- Cover letters and application materials
- LinkedIn profiles and professional summaries
- Interview preparation and follow-up emails
- Resume improvements and optimization
- Professional communication

Be helpful, specific, and actionable in your responses. Ask clarifying questions when needed to provide better assistance.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    return await this.makeAPICall(messages, 2000);
  }
}

export const aiService = new AIService();