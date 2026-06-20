import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Download, 
  Play,
  ArrowLeft,
  Plus,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { useMember } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';

interface ResumeSession {
  id: string;
  fileName: string;
  uploadDate: Date;
  atsScore: number;
  status: 'analyzed' | 'pending' | 'improved';
  improvements: number;
}

interface InterviewSession {
  id: string;
  role: string;
  domain: string;
  date: Date;
  duration: number;
  score: number;
  type: 'voice' | 'text';
  status: 'completed' | 'in-progress';
}

function MySessionsContent() {
  const { member, actions } = useMember();
  const [resumeSessions, setResumeSessions] = useState<ResumeSession[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    // Mock data - in real app, this would fetch from the database
    setResumeSessions([
      {
        id: '1',
        fileName: 'John_Doe_Resume_2024.pdf',
        uploadDate: new Date('2024-01-15'),
        atsScore: 78,
        status: 'improved',
        improvements: 5
      },
      {
        id: '2',
        fileName: 'Software_Engineer_Resume.pdf',
        uploadDate: new Date('2024-01-10'),
        atsScore: 62,
        status: 'analyzed',
        improvements: 8
      }
    ]);

    setInterviewSessions([
      {
        id: '1',
        role: 'Software Engineer Intern',
        domain: 'Technology',
        date: new Date('2024-01-14'),
        duration: 25,
        score: 7.5,
        type: 'voice',
        status: 'completed'
      },
      {
        id: '2',
        role: 'Business Analyst',
        domain: 'Consulting',
        date: new Date('2024-01-12'),
        duration: 30,
        score: 6.8,
        type: 'text',
        status: 'completed'
      },
      {
        id: '3',
        role: 'Data Analyst',
        domain: 'Technology',
        date: new Date('2024-01-08'),
        duration: 20,
        score: 8.2,
        type: 'voice',
        status: 'completed'
      }
    ]);
  }, []);

  const averageInterviewScore = interviewSessions.length > 0 
    ? interviewSessions.reduce((sum, session) => sum + session.score, 0) / interviewSessions.length 
    : 0;

  const totalInterviews = interviewSessions.length;
  const progressToNextLevel = Math.min((totalInterviews / 5) * 100, 100);

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
                <Link to="/my-sessions" className="font-paragraph text-primary font-semibold">
                  My Sessions
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-paragraph text-primary">
                Welcome, {member?.profile?.nickname || member?.contact?.firstName || 'User'}!
              </span>
              <Button variant="outline" onClick={actions.logout}>Sign Out</Button>
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
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold text-primary mb-4">
            My Sessions
          </h1>
          <p className="text-lg font-paragraph text-primary/80">
            Track your progress and manage your career preparation journey.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-heading">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Interview Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-paragraph text-sm text-primary/70">Progress to Interview-Ready</span>
                  <span className="font-paragraph text-sm font-semibold text-primary">
                    {totalInterviews}/5 interviews
                  </span>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
                {totalInterviews >= 5 && (
                  <div className="flex items-center text-primary">
                    <Award className="w-4 h-4 mr-1" />
                    <span className="font-paragraph text-sm font-semibold">Interview-Ready Achieved!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-heading">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-primary mb-1">
                {averageInterviewScore.toFixed(1)}/10
              </div>
              <p className="font-paragraph text-sm text-primary/70">
                Based on {totalInterviews} completed interviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-heading">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Practice Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-primary mb-1">
                {interviewSessions.reduce((sum, session) => sum + session.duration, 0)} min
              </div>
              <p className="font-paragraph text-sm text-primary/70">
                Total interview practice time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Tabs */}
        <Tabs defaultValue="resumes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="resumes" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Resume Reviews ({resumeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mock Interviews ({interviewSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-heading font-bold text-primary">Resume Reviews</h2>
              <Button asChild>
                <Link to="/resume-review">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload New Resume
                </Link>
              </Button>
            </div>

            {resumeSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                  <h3 className="text-lg font-heading font-semibold text-primary mb-2">
                    No resume reviews yet
                  </h3>
                  <p className="font-paragraph text-primary/70 mb-6">
                    Upload your first resume to get started with AI-powered feedback.
                  </p>
                  <Button asChild>
                    <Link to="/resume-review">Upload Resume</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {resumeSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-heading font-semibold text-primary text-lg">
                              {session.fileName}
                            </h3>
                            <Badge variant={session.status === 'improved' ? 'default' : 'secondary'}>
                              {session.status === 'improved' ? 'Improved' : 
                               session.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-6 text-sm font-paragraph text-primary/70 mb-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {session.uploadDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              ATS Score: {session.atsScore}/100
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              {session.improvements} improvements suggested
                            </div>
                          </div>
                          <Progress value={session.atsScore} className="h-2 mb-4" />
                        </div>
                        <div className="flex space-x-2 ml-6">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/resume-review/${session.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-heading font-bold text-primary">Mock Interviews</h2>
              <Button asChild>
                <Link to="/mock-interview">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Interview
                </Link>
              </Button>
            </div>

            {interviewSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                  <h3 className="text-lg font-heading font-semibold text-primary mb-2">
                    No interview sessions yet
                  </h3>
                  <p className="font-paragraph text-primary/70 mb-6">
                    Start your first mock interview to practice and improve your skills.
                  </p>
                  <Button asChild>
                    <Link to="/mock-interview">Start Interview</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {interviewSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-heading font-semibold text-primary text-lg">
                              {session.role}
                            </h3>
                            <Badge variant="outline">{session.domain}</Badge>
                            <Badge variant={session.type === 'voice' ? 'default' : 'secondary'}>
                              {session.type === 'voice' ? 'Voice' : 'Text'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-6 text-sm font-paragraph text-primary/70 mb-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {session.date.toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {session.duration} minutes
                            </div>
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              Score: {session.score}/10
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <Progress value={session.score * 10} className="h-2" />
                            </div>
                            <span className="text-sm font-paragraph font-semibold text-primary">
                              {session.score}/10
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-6">
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4 mr-1" />
                            Replay
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/mock-interview/${session.id}`}>View Feedback</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-16 bg-secondary rounded-lg p-8">
          <h3 className="text-2xl font-heading font-bold text-secondary-foreground mb-6 text-center">
            Continue Your Journey
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-4" />
                <h4 className="font-heading font-semibold text-primary mb-2">Upload Resume</h4>
                <p className="font-paragraph text-primary/70 text-sm mb-4">
                  Get instant feedback and improvements
                </p>
                <Button size="sm" asChild>
                  <Link to="/resume-review">Upload Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-4" />
                <h4 className="font-heading font-semibold text-primary mb-2">Practice Interview</h4>
                <p className="font-paragraph text-primary/70 text-sm mb-4">
                  Improve your interview skills with AI
                </p>
                <Button size="sm" asChild>
                  <Link to="/mock-interview">Start Practice</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-4" />
                <h4 className="font-heading font-semibold text-primary mb-2">Writing Assistant</h4>
                <p className="font-paragraph text-primary/70 text-sm mb-4">
                  Craft compelling cover letters
                </p>
                <Button size="sm" asChild>
                  <Link to="/writing-assistant">Get Help</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MySessionsPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Sign in to access your sessions and track your progress">
      <MySessionsContent />
    </MemberProtectedRoute>
  );
}