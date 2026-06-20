import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary, AIErrorFallback } from '@/components/ui/error-boundary';
import { RetryButton } from '@/components/ui/retry-button';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ArrowLeft,
  Target,
  TrendingUp,
  Eye,
  Lightbulb
} from 'lucide-react';
import { ResumeAnalysisResult } from '@/services/aiService';

interface ResumeAnalysis {
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
}

export default function ResumeReviewPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // In real app, would extract text from PDF/DOC
      setResumeText('Sample resume content extracted from file...');
    }
  };

  const analyzeResume = async () => {
    if (!uploadedFile && !resumeText.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Get resume text content
      let textContent = resumeText;
      if (uploadedFile && !textContent) {
        // In a real app, you would extract text from PDF/DOC files
        // For now, we'll use a placeholder with more realistic content
        textContent = `John Doe Software Engineer EXPERIENCE Software Developer at Tech Company (2022-2024) - Developed web applications using React and Node.js - Collaborated with cross-functional teams to deliver projects - Participated in code reviews and testing processes EDUCATION Bachelor of Computer Science, University Name (2018-2022) - Relevant coursework: Data Structures, Algorithms, Software Engineering SKILLS JavaScript, React, Node.js, Python, SQL, Git, Agile methodologies This is sample content extracted from ${uploadedFile.name}. In a production environment, this would be the actual text extracted from the uploaded file using a PDF/DOC parser.`;
      }

      // Call AI service for real analysis
      const { aiService } = await import('@/services/aiService');
      const analysisResult = await aiService.analyzeResume(textContent);
      
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Resume analysis failed:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('AI_CONFIG_ERROR')) {
          errorMessage = 'AI service is not configured. Please contact support for assistance.';
        } else if (error.message.includes('AI_AUTH_ERROR')) {
          errorMessage = 'Authentication failed with AI service. Please contact support.';
        } else if (error.message.includes('AI_RATE_LIMIT')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('AI_NETWORK_ERROR')) {
          errorMessage = 'Unable to connect to AI service. Please check your internet connection and try again.';
        } else if (error.message.includes('AI_INPUT_ERROR')) {
          errorMessage = error.message.replace('AI_INPUT_ERROR: ', '');
        } else if (error.message.includes('too short')) {
          errorMessage = error.message;
        } else {
          errorMessage = 'Failed to analyze resume. Please try again or contact support if the problem persists.';
        }
      }
      
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const overallScore = analysis ? Math.round((analysis.atsScore + analysis.formatScore + analysis.impactScore + analysis.readabilityScore + analysis.lengthScore) / 5) : 0;

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
            Resume Review
          </h1>
          <p className="text-lg font-paragraph text-primary/80 max-w-2xl mx-auto">
            Get instant AI-powered feedback on your resume with ATS optimization and improvement suggestions.
          </p>
        </div>

        {!analysis ? (
          /* Upload Section */
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-heading text-center">Upload Your Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'text')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-6">
                    <div className="border-2 border-dashed border-primary/20 rounded-lg p-12 text-center">
                      <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                      <h3 className="text-lg font-heading font-semibold text-primary mb-2">
                        Drop your resume here or click to browse
                      </h3>
                      <p className="font-paragraph text-primary/70 mb-6">
                        Supports PDF, DOC, and DOCX files up to 10MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload">
                        <Button asChild>
                          <span className="cursor-pointer">Choose File</span>
                        </Button>
                      </label>
                      {uploadedFile && (
                        <div className="mt-4 p-3 bg-secondary rounded-lg">
                          <div className="flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary mr-2" />
                            <span className="font-paragraph text-primary">{uploadedFile.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="space-y-6">
                    <div>
                      <label className="block font-paragraph font-semibold text-primary mb-2">
                        Paste your resume text
                      </label>
                      <Textarea
                        placeholder="Copy and paste your resume content here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="min-h-[300px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-8 text-center space-y-4">
                  <Button 
                    size="lg" 
                    onClick={analyzeResume}
                    disabled={!uploadedFile && !resumeText.trim() || isAnalyzing}
                    className="px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </Button>
                  
                  {analysisError && (
                    <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="space-y-2">
                            <h4 className="font-paragraph font-semibold text-destructive">
                              Analysis Failed
                            </h4>
                            <p className="font-paragraph text-destructive/80 text-sm">
                              {analysisError}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <RetryButton 
                                size="sm"
                                onRetry={analyzeResume}
                              >
                                Retry Analysis
                              </RetryButton>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setAnalysisError(null)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-primary mb-2">ATS Optimization</h3>
                  <p className="font-paragraph text-primary/70 text-sm">
                    Check keyword matching and formatting for Applicant Tracking Systems
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-primary mb-2">Impact Analysis</h3>
                  <p className="font-paragraph text-primary/70 text-sm">
                    Identify opportunities to strengthen your accomplishments with metrics
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Lightbulb className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-primary mb-2">Smart Suggestions</h3>
                  <p className="font-paragraph text-primary/70 text-sm">
                    Get actionable recommendations to improve your resume's effectiveness
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-heading font-semibold text-green-800 mb-1">
                      Analysis Complete!
                    </h3>
                    <p className="font-paragraph text-green-700">
                      We've analyzed your resume and found {analysis.suggestions.length} areas for improvement. 
                      Your overall ATS score is {overallScore}/100.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Overview */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {analysis.atsScore}
                  </div>
                  <div className="text-sm font-paragraph text-primary/70">ATS Score</div>
                  <Progress value={analysis.atsScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {analysis.formatScore}
                  </div>
                  <div className="text-sm font-paragraph text-primary/70">Format</div>
                  <Progress value={analysis.formatScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {analysis.impactScore}
                  </div>
                  <div className="text-sm font-paragraph text-primary/70">Impact</div>
                  <Progress value={analysis.impactScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {analysis.readabilityScore}
                  </div>
                  <div className="text-sm font-paragraph text-primary/70">Readability</div>
                  <Progress value={analysis.readabilityScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-primary mb-1">
                    {analysis.lengthScore}
                  </div>
                  <div className="text-sm font-paragraph text-primary/70">Length</div>
                  <Progress value={analysis.lengthScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                    Improvement Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-paragraph font-semibold text-primary">
                          {suggestion.category}
                        </h4>
                        <Badge variant={
                          suggestion.priority === 'high' ? 'destructive' :
                          suggestion.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {suggestion.priority} priority
                        </Badge>
                      </div>
                      <p className="font-paragraph text-primary/80 text-sm mb-3">
                        {suggestion.text}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { aiService } = await import('@/services/aiService');
                            const improved = await aiService.generateImprovedResume(
                              resumeText || `Content from ${uploadedFile?.name}`,
                              [suggestion]
                            );
                            // In a real app, you would show the improved version
                            alert('Improvement applied! In a full implementation, this would show the improved resume.');
                          } catch (error) {
                            console.error('Failed to apply suggestion:', error);
                            let errorMsg = 'Failed to apply suggestion. Please try again.';
                            if (error instanceof Error && error.message.includes('AI_')) {
                              errorMsg = 'AI service is temporarily unavailable. Please try again later.';
                            }
                            alert(errorMsg);
                          }
                        }}
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Parsed Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center font-heading">
                    <Eye className="w-5 h-5 mr-2 text-primary" />
                    Parsed Sections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-paragraph font-semibold text-primary mb-2">Education</h4>
                    <ul className="space-y-1">
                      {analysis.parsedSections.education.map((item, index) => (
                        <li key={index} className="font-paragraph text-primary/80 text-sm">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-paragraph font-semibold text-primary mb-2">Experience</h4>
                    <ul className="space-y-1">
                      {analysis.parsedSections.experience.map((item, index) => (
                        <li key={index} className="font-paragraph text-primary/80 text-sm">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-paragraph font-semibold text-primary mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.parsedSections.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8"
                onClick={async () => {
                  try {
                    const { aiService } = await import('@/services/aiService');
                    const improved = await aiService.generateImprovedResume(
                      resumeText || `Content from ${uploadedFile?.name}`,
                      analysis.suggestions
                    );
                    // In a real app, you would trigger download of the improved resume
                    alert('Improved resume generated! In a full implementation, this would download the file.');
                  } catch (error) {
                    console.error('Failed to generate improved resume:', error);
                    let errorMsg = 'Failed to generate improved resume. Please try again.';
                    if (error instanceof Error && error.message.includes('AI_')) {
                      errorMsg = 'AI service is temporarily unavailable. Please try again later.';
                    }
                    alert(errorMsg);
                  }
                }}
              >
                <Download className="w-5 h-5 mr-2" />
                Download Improved Resume
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link to="/my-sessions">Save to My Sessions</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                setAnalysis(null);
                setUploadedFile(null);
                setResumeText('');
                setAnalysisError(null);
              }}>
                Analyze Another Resume
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
}
