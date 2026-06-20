import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ErrorBoundary, AIErrorFallback } from '@/components/ui/error-boundary';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  ArrowLeft,
  Clock,
  Target,
  Volume2,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { InterviewRoles } from '@/entities';
import { InterviewFeedback } from '@/services/aiService';

interface Question {
  id: string;
  text: string;
  timeLimit: number;
  category: string;
}

interface InterviewSession {
  role: string;
  domain: string;
  type: 'voice' | 'text';
  currentQuestion: number;
  questions: Question[];
  answers: { questionId: string; answer: string; timeSpent: number }[];
  startTime: Date;
  isActive: boolean;
}

export default function MockInterviewPage() {
  const [roles, setRoles] = useState<InterviewRoles[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [interviewType, setInterviewType] = useState<'voice' | 'text'>('text');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const MOCK_ROLES: InterviewRoles[] = [
    {
      _id: 'role-1',
      roleName: 'Software Engineer',
      domain: 'Technology',
      roleDescription: 'Responsible for building robust, scalable web applications using React, Node.js, and TypeScript. Works closely with product managers and designer teams.',
      difficultyLevel: 'Medium',
      isActive: true,
      suggestedQuestionsCount: 5
    },
    {
      _id: 'role-2',
      roleName: 'Data Analyst',
      domain: 'Data & Analytics',
      roleDescription: 'Analyzes complex business datasets to uncover insights, build dashboards, and help stakeholders make data-driven decisions.',
      difficultyLevel: 'Medium',
      isActive: true,
      suggestedQuestionsCount: 5
    },
    {
      _id: 'role-3',
      roleName: 'Product Manager',
      domain: 'Product Management',
      roleDescription: 'Owns the product lifecycle, gathers requirements, defines the roadmap, and collaborates with engineering and business teams to launch features.',
      difficultyLevel: 'Hard',
      isActive: true,
      suggestedQuestionsCount: 5
    }
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { items } = await BaseCrudService.getAll<InterviewRoles>('interviewroles');
        const activeRoles = items ? items.filter(role => role.isActive) : [];
        if (activeRoles.length > 0) {
          setRoles(activeRoles);
        } else {
          setRoles(MOCK_ROLES);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles(MOCK_ROLES);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (session?.isActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session?.isActive, timeRemaining]);

  const startInterview = async () => {
    const selectedRoleData = roles.find(role => role._id === selectedRole);
    if (!selectedRoleData) return;

    try {
      // Generate AI-powered questions
      const { aiService } = await import('@/services/aiService');
      const questionTexts = await aiService.generateInterviewQuestions(
        selectedRoleData.roleName || '',
        selectedRoleData.domain || '',
        selectedRoleData.difficultyLevel || 'medium'
      );

      const questions: Question[] = questionTexts.map((text, index) => ({
        id: (index + 1).toString(),
        text,
        timeLimit: 120 + (index * 30), // Varying time limits
        category: ['Introduction', 'Technical', 'Behavioral', 'Problem-solving', 'Goals'][index] || 'General'
      }));

      setSession({
        role: selectedRoleData.roleName || '',
        domain: selectedRoleData.domain || '',
        type: interviewType,
        currentQuestion: 0,
        questions,
        answers: [],
        startTime: new Date(),
        isActive: true
      });

      setTimeRemaining(questions[0].timeLimit);
    } catch (error) {
      console.error('Failed to generate interview questions:', error);
      alert('Failed to generate interview questions. Please check your internet connection and try again.');
    }
  };

  const submitAnswer = () => {
    if (!session || !currentAnswer.trim()) return;

    const currentQ = session.questions[session.currentQuestion];
    const timeSpent = currentQ.timeLimit - timeRemaining;

    const newAnswers = [...session.answers, {
      questionId: currentQ.id,
      answer: currentAnswer,
      timeSpent
    }];

    if (session.currentQuestion < session.questions.length - 1) {
      // Move to next question
      const nextQuestion = session.currentQuestion + 1;
      setSession({
        ...session,
        currentQuestion: nextQuestion,
        answers: newAnswers
      });
      setTimeRemaining(session.questions[nextQuestion].timeLimit);
      setCurrentAnswer('');
    } else {
      // Interview complete
      setSession({
        ...session,
        answers: newAnswers,
        isActive: false
      });
      generateFeedback(newAnswers);
    }
  };

  const generateFeedback = async (answers: any[]) => {
    try {
      // Generate AI-powered feedback
      const { aiService } = await import('@/services/aiService');
      const feedbackResult = await aiService.generateInterviewFeedback(
        session?.role || '',
        answers.map((answer, index) => ({
          question: session?.questions[index].text || '',
          answer: answer.answer,
          timeSpent: answer.timeSpent
        }))
      );
      
      setFeedback(feedbackResult);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      alert('Failed to generate feedback. Please try again.');
      // Fallback to ending the session without feedback
      setSession(prev => prev ? { ...prev, isActive: false } : null);
    }
  };

  const toggleRecording = () => {
    if (interviewType === 'voice') {
      setIsRecording(!isRecording);
      // In real app, would start/stop voice recording
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (feedback) {
    return (
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
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-primary mb-4">
              Interview Complete!
            </h1>
            <p className="text-lg font-paragraph text-primary/80">
              Great job! Here's your detailed feedback and scoring.
            </p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="text-6xl font-heading font-bold text-primary mb-4">
                {feedback.overallScore}/10
              </div>
              <p className="text-lg font-paragraph text-primary/80 mb-6">
                Overall Interview Score
              </p>
              <Progress value={feedback.overallScore * 10} className="h-3 max-w-md mx-auto" />
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {Object.entries(feedback.scores).map(([category, score]) => (
              <Card key={category}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {score as number}/10
                  </div>
                  <div className="text-sm font-paragraph text-primary/70 capitalize">
                    {category}
                  </div>
                  <Progress value={(score as number) * 10} className="h-2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-heading text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-paragraph text-primary/80">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-heading text-orange-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-paragraph text-primary/80">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Question-by-Question Feedback */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-heading">Detailed Question Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {feedback.detailedFeedback.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-paragraph font-semibold text-primary">
                      Question {index + 1}
                    </h4>
                    <Badge variant="outline">{item.score}/10</Badge>
                  </div>
                  <p className="font-paragraph text-primary/80 mb-4 italic">
                    "{item.question}"
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-paragraph font-semibold text-primary mb-2">Your Performance:</h5>
                      <p className="font-paragraph text-primary/80 text-sm">{item.feedback}</p>
                    </div>
                    <div>
                      <h5 className="font-paragraph font-semibold text-primary mb-2">Model Answer Approach:</h5>
                      <p className="font-paragraph text-primary/80 text-sm">{item.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/mock-interview">Practice Again</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/my-sessions">Save to My Sessions</Link>
            </Button>
            <Button variant="outline" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Email Summary
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {!session ? (
          /* Setup Section */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-heading font-bold text-primary mb-4">
                Mock Interview
              </h1>
              <p className="text-lg font-paragraph text-primary/80">
                Practice with AI-powered interviews tailored to your target role.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading text-center">Set Up Your Interview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block font-paragraph font-semibold text-primary mb-2">
                    Choose Your Target Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role to practice for" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          <div>
                            <div className="font-semibold">{role.roleName}</div>
                            <div className="text-sm text-primary/70">{role.domain} • {role.difficultyLevel}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRole && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <p className="font-paragraph text-secondary-foreground text-sm">
                        {roles.find(r => r._id === selectedRole)?.roleDescription}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-paragraph font-semibold text-primary mb-2">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 transition-colors ${
                        interviewType === 'text' ? 'border-primary bg-primary/5' : 'border-primary/20'
                      }`}
                      onClick={() => setInterviewType('text')}
                    >
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-heading font-semibold text-primary mb-1">Text Interview</h3>
                        <p className="font-paragraph text-primary/70 text-sm">
                          Type your responses for detailed feedback
                        </p>
                      </CardContent>
                    </Card>
                    <Card 
                      className={`cursor-pointer border-2 transition-colors ${
                        interviewType === 'voice' ? 'border-primary bg-primary/5' : 'border-primary/20'
                      }`}
                      onClick={() => setInterviewType('voice')}
                    >
                      <CardContent className="p-4 text-center">
                        <Mic className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-heading font-semibold text-primary mb-1">Voice Interview</h3>
                        <p className="font-paragraph text-primary/70 text-sm">
                          Speak your answers for realistic practice
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="text-center pt-6">
                  <Button 
                    size="lg" 
                    onClick={startInterview}
                    disabled={!selectedRole}
                    className="px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Interview Session */
          <div className="max-w-4xl mx-auto">
            {/* Interview Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-primary mb-1">
                      {session.role}
                    </h2>
                    <p className="font-paragraph text-primary/70">
                      {session.domain} • Question {session.currentQuestion + 1} of {session.questions.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-primary mb-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="font-paragraph font-semibold">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                    <Progress 
                      value={((session.questions[session.currentQuestion].timeLimit - timeRemaining) / session.questions[session.currentQuestion].timeLimit) * 100} 
                      className="h-2 w-24" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center font-heading">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Question {session.currentQuestion + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-paragraph text-primary mb-4">
                  {session.questions[session.currentQuestion].text}
                </p>
                <Badge variant="outline">
                  {session.questions[session.currentQuestion].category}
                </Badge>
              </CardContent>
            </Card>

            {/* Answer Input */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading">Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                {session.type === 'text' ? (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[200px] mb-4"
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isRecording ? 'bg-red-100 animate-pulse' : 'bg-primary/10'
                    }`}>
                      {isRecording ? (
                        <MicOff className="w-12 h-12 text-red-600" />
                      ) : (
                        <Mic className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <p className="font-paragraph text-primary/70 mb-4">
                      {isRecording ? 'Recording your answer...' : 'Click to start recording'}
                    </p>
                    <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setSession({ ...session, isActive: false })}>
                    End Interview
                  </Button>
                  <Button 
                    onClick={submitAnswer}
                    disabled={session.type === 'text' ? !currentAnswer.trim() : !isRecording}
                  >
                    {session.currentQuestion === session.questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-paragraph text-primary/70 text-sm">Interview Progress</span>
                  <span className="font-paragraph text-primary/70 text-sm">
                    {session.currentQuestion + 1} / {session.questions.length}
                  </span>
                </div>
                <Progress value={((session.currentQuestion + 1) / session.questions.length) * 100} className="h-2" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
}