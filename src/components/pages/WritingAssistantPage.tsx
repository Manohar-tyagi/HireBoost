import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary, AIErrorFallback } from '@/components/ui/error-boundary';
import { 
  FileText, 
  MessageSquare, 
  Sparkles, 
  Copy, 
  Download, 
  ArrowLeft,
  Send,
  Lightbulb,
  Target,
  Briefcase
} from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { WritingAssistantTemplates } from '@/entities';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function WritingAssistantPage() {
  const [templates, setTemplates] = useState<WritingAssistantTemplates[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Form fields for template generation
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const MOCK_TEMPLATES: WritingAssistantTemplates[] = [
    {
      _id: 'template-1',
      templateName: 'Standard Cover Letter',
      templateType: 'Cover Letter',
      templateDescription: 'A classic, professional cover letter template highlighting your experience, interest, and core skills.',
      targetRole: 'Any Role',
      isActive: true,
      templateContent: ''
    },
    {
      _id: 'template-2',
      templateName: 'LinkedIn Profile Summary',
      templateType: 'LinkedIn Summary',
      templateDescription: 'An engaging, personal-brand focused summary to help you stand out to recruiters on LinkedIn.',
      targetRole: 'Any Role',
      isActive: true,
      templateContent: ''
    },
    {
      _id: 'template-3',
      templateName: 'LinkedIn Profile Headline',
      templateType: 'LinkedIn Headline',
      templateDescription: 'A concise, punchy headline to grab attention, featuring key skills and target positions.',
      targetRole: 'Any Role',
      isActive: true,
      templateContent: ''
    }
  ];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { items } = await BaseCrudService.getAll<WritingAssistantTemplates>('writingassistanttemplates');
        const activeTemplates = items ? items.filter(template => template.isActive) : [];
        if (activeTemplates.length > 0) {
          setTemplates(activeTemplates);
        } else {
          setTemplates(MOCK_TEMPLATES);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates(MOCK_TEMPLATES);
      }
    };

    fetchTemplates();
  }, []);

  const generateFromTemplate = async () => {
    if (!selectedTemplate || !targetRole) return;

    const template = templates.find(t => t._id === selectedTemplate);
    if (!template) return;

    setIsGenerating(true);
    setActiveTab('chat');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Generate a ${template.templateName} for ${targetRole}${companyName ? ` at ${companyName}` : ''}`,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Use AI service for real content generation
      const { aiService } = await import('@/services/aiService');
      const result = await aiService.generateWritingContent(
        template.templateType || 'cover letter',
        targetRole,
        companyName,
        template.templateDescription
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.content,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Content generation failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error generating your content. Please check your internet connection and try again, or try asking me directly in the chat.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsGenerating(true);

    try {
      // Use AI service for real chat responses
      const { aiService } = await import('@/services/aiService');
      const response = await aiService.chatWithAssistant(
        messageToSend,
        chatMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat response failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please check your internet connection and try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContent = (type: string, role: string, company: string) => {
    if (type.toLowerCase().includes('cover')) {
      return `Dear Hiring Manager,

I am writing to express my strong interest in the ${role} position${company ? ` at ${company}` : ''}. With my background in technology and passion for innovation, I am excited about the opportunity to contribute to your team.

In my recent projects, I have developed strong skills in problem-solving and technical implementation. My experience includes:

• Developing software solutions that improved efficiency by 30%
• Collaborating with cross-functional teams to deliver projects on time
• Learning new technologies quickly and adapting to changing requirements

I am particularly drawn to this role because it aligns with my career goals and allows me to apply my technical skills in a meaningful way. I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your team's success.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
[Your Name]`;
    } else if (type.toLowerCase().includes('linkedin')) {
      return `🚀 Passionate ${role} | Building innovative solutions | Always learning

💼 Currently seeking opportunities in ${role} positions
🎓 Recent graduate with hands-on experience in software development
🔧 Skills: Python, JavaScript, React, SQL, Git
📈 Proven track record of delivering projects that drive results

I'm passionate about using technology to solve real-world problems and am always eager to take on new challenges. Let's connect and explore how we can create something amazing together!

#SoftwareDevelopment #TechCareers #Innovation`;
    } else {
      return `Professional ${type} for ${role}:

This is a customized ${type} tailored specifically for your ${role} application. The content has been optimized to highlight relevant skills and experience that align with typical requirements for this position.

Key highlights include:
• Relevant technical skills and experience
• Demonstrated problem-solving abilities
• Strong communication and teamwork skills
• Passion for continuous learning and growth

The content is structured to make a strong first impression while maintaining a professional tone throughout.`;
    }
  };

  const generateMockResponse = (message: string) => {
    if (message.toLowerCase().includes('rewrite') || message.toLowerCase().includes('improve')) {
      return `I'd be happy to help you improve that content! Here's a revised version that's more impactful and professional:

[Improved version would appear here with stronger action verbs, better structure, and more compelling language]

Key improvements made:
• Replaced weak phrases with strong action verbs
• Added specific metrics and achievements
• Improved overall flow and readability
• Enhanced professional tone

Would you like me to make any specific adjustments to this version?`;
    } else if (message.toLowerCase().includes('cover letter')) {
      return `I'll help you create a compelling cover letter! To make it as effective as possible, I'll need a few details:

1. What specific role are you applying for?
2. What company is this for?
3. What are your key relevant experiences or skills?
4. Is there anything specific about the company that interests you?

Once I have these details, I can craft a personalized cover letter that highlights your strengths and shows genuine interest in the position.`;
    } else {
      return `I understand you're looking for help with your professional writing. I can assist with:

• Cover letters tailored to specific roles and companies
• LinkedIn profile optimization
• Resume summary improvements
• Professional email templates
• Interview follow-up messages

What specific type of content would you like help with? The more details you provide about your target role and background, the better I can customize the content for you.`;
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // In real app, would show toast notification
  };

  return (
    <ErrorBoundary fallback={AIErrorFallback}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-primary/10">
        <div className="max-w-[120rem] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-heading font-bold text-primary">HireBoost</Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/" className="font-paragraph text-primary hover:text-primary/80 transition-colors">
                  Home
                </Link>
                <Link to="/faq" className="font-paragraph text-primary hover:text-primary/80 transition-colors">
                  FAQ
                </Link>
                <Link to="/my-sessions" className="font-paragraph text-primary hover:text-primary/80 transition-colors">
                  My Sessions
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link to="/my-sessions">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[120rem] mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
          <Link to="/" className="flex items-center text-primary/60 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-heading font-bold text-primary mb-4">
            AI Writing Assistant
          </h1>
          <p className="text-lg font-paragraph text-primary/80 max-w-2xl mx-auto">
            Get help crafting compelling cover letters, LinkedIn summaries, and professional communications.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="templates" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat ({chatMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-8">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Choose a Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card 
                        key={template._id}
                        className={`cursor-pointer border-2 transition-colors ${
                          selectedTemplate === template._id ? 'border-primary bg-primary/5' : 'border-primary/20'
                        }`}
                        onClick={() => setSelectedTemplate(template._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-heading font-semibold text-primary">
                              {template.templateName}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {template.templateType}
                            </Badge>
                          </div>
                          <p className="font-paragraph text-primary/70 text-sm mb-3">
                            {template.templateDescription}
                          </p>
                          {template.targetRole && (
                            <Badge variant="secondary" className="text-xs">
                              {template.targetRole}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedTemplate && (
                    <div className="border-t pt-6">
                      <h3 className="font-heading font-semibold text-primary mb-4">
                        Customize Your Content
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block font-paragraph font-semibold text-primary mb-2">
                            Target Role *
                          </label>
                          <Input
                            placeholder="e.g., Software Engineer, Data Analyst"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block font-paragraph font-semibold text-primary mb-2">
                            Company Name (Optional)
                          </label>
                          <Input
                            placeholder="e.g., Google, Microsoft"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <Button 
                          size="lg" 
                          onClick={generateFromTemplate}
                          disabled={!targetRole}
                          className="px-8"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Content
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Start Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                    Quick Start Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-paragraph font-semibold text-primary mb-3">Cover Letter Prompts:</h4>
                      <ul className="space-y-2 text-sm font-paragraph text-primary/80">
                        <li>• "Write a cover letter for a Software Engineer internship at Google"</li>
                        <li>• "Create a cover letter for a Marketing Analyst role emphasizing data skills"</li>
                        <li>• "Draft a cover letter for a fresh graduate applying to consulting firms"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-paragraph font-semibold text-primary mb-3">LinkedIn Optimization:</h4>
                      <ul className="space-y-2 text-sm font-paragraph text-primary/80">
                        <li>• "Optimize my LinkedIn headline for a Data Scientist role"</li>
                        <li>• "Write a LinkedIn summary for a Business Analyst position"</li>
                        <li>• "Create a professional LinkedIn post about my internship experience"</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              {/* Chat Interface */}
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                    AI Writing Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                        <h3 className="font-heading font-semibold text-primary mb-2">
                          Start a conversation
                        </h3>
                        <p className="font-paragraph text-primary/70">
                          Ask me to help with cover letters, LinkedIn profiles, or any professional writing.
                        </p>
                      </div>
                    )}
                    
                    {chatMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          <p className="font-paragraph whitespace-pre-wrap">{message.content}</p>
                          {message.type === 'assistant' && (
                            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-secondary-foreground/20">
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(message.content)}>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="font-paragraph text-sm ml-2">AI is writing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Ask me to help with your cover letter, LinkedIn profile, or any professional writing..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        className="flex-1 min-h-[60px] max-h-[120px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={sendChatMessage}
                        disabled={!currentMessage.trim() || isGenerating}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Suggested Prompts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Write a cover letter for a Software Engineer internship",
                      "Improve my LinkedIn summary for a Data Analyst role",
                      "Create a follow-up email after an interview",
                      "Draft a professional email to request an informational interview"
                    ].map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left h-auto p-4 justify-start"
                        onClick={() => {
                          setCurrentMessage(prompt);
                          setActiveTab('chat');
                        }}
                      >
                        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="font-paragraph">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}