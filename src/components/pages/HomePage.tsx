import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, MessageSquare, FileText, CheckCircle, Clock, Target } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { AIStatusIndicator } from '@/components/ui/ai-status-indicator';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-primary/10">
        <div className="max-w-[120rem] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-heading font-bold text-primary">HireBoost</h1>
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
              <AIStatusIndicator />
              <Button variant="outline" asChild>
                <Link to="/my-sessions">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-[120rem] mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-primary mb-6 leading-tight">
            Land the job you want — faster.
          </h2>
          <p className="text-xl font-paragraph text-primary/80 mb-12 leading-relaxed">
            Real-time AI resume reviews, personalized interview practice, and intelligent writing assistance to help you shine.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/resume-review">
                <Upload className="w-5 h-5 mr-2" />
                Upload Resume
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/mock-interview">
                <MessageSquare className="w-5 h-5 mr-2" />
                Try Mock Interview
              </Link>
            </Button>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <Image
              src="https://static.wixstatic.com/media/504b63_433f1055a2424490ad896b9692e4dec7~mv2.png?originWidth=768&originHeight=576"
              alt="Young professionals in interview preparation setting"
              width={800}
              className="mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-secondary py-20">
        <div className="max-w-[120rem] mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-heading font-bold text-secondary-foreground mb-4">
              Everything you need to ace your next interview
            </h3>
            <p className="text-lg font-paragraph text-secondary-foreground/80 max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive career preparation tools designed specifically for students and early-career professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-none shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-2xl font-heading font-bold text-primary mb-4">Resume Review</h4>
                <p className="font-paragraph text-primary/80 mb-6 leading-relaxed">
                  Get instant ATS scores, keyword optimization, and one-click improvements to make your resume stand out to recruiters.
                </p>
                <ul className="text-sm font-paragraph text-primary/70 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    ATS keyword matching
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Format optimization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Impact verb suggestions
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/resume-review">Start Review</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-2xl font-heading font-bold text-primary mb-4">Mock Interview</h4>
                <p className="font-paragraph text-primary/80 mb-6 leading-relaxed">
                  Practice with AI-powered voice or text interviews tailored to your target role with detailed scoring and feedback.
                </p>
                <ul className="text-sm font-paragraph text-primary/70 space-y-2 mb-6">
                  <li className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Timed practice sessions
                  </li>
                  <li className="flex items-center">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    Role-specific questions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Detailed scoring rubric
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/mock-interview">Start Interview</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-2xl font-heading font-bold text-primary mb-4">AI Writing Assistant</h4>
                <p className="font-paragraph text-primary/80 mb-6 leading-relaxed">
                  Get help crafting compelling cover letters, LinkedIn summaries, and professional communications with AI guidance.
                </p>
                <ul className="text-sm font-paragraph text-primary/70 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Cover letter templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    LinkedIn optimization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Role-specific content
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/writing-assistant">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20">
        <div className="max-w-[120rem] mx-auto px-6 text-center">
          <h3 className="text-4xl font-heading font-bold text-primary mb-6">
            Ready to boost your career?
          </h3>
          <p className="text-lg font-paragraph text-primary/80 mb-8 max-w-2xl mx-auto">
            Join thousands of students and early-career professionals who have landed their dream jobs with HireBoost.
          </p>
          <Button size="lg" className="text-lg px-8 py-4" asChild>
            <Link to="/resume-review">
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-primary text-primary-foreground py-12">
        <div className="max-w-[120rem] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-heading font-bold mb-4">HireBoost</h4>
              <p className="font-paragraph text-primary-foreground/80">
                AI-powered career preparation for the next generation of professionals.
              </p>
            </div>
            <div>
              <h5 className="font-heading font-semibold mb-4">Services</h5>
              <ul className="font-paragraph space-y-2">
                <li><Link to="/resume-review" className="text-primary-foreground/80 hover:text-primary-foreground">Resume Review</Link></li>
                <li><Link to="/mock-interview" className="text-primary-foreground/80 hover:text-primary-foreground">Mock Interview</Link></li>
                <li><Link to="/writing-assistant" className="text-primary-foreground/80 hover:text-primary-foreground">Writing Assistant</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-heading font-semibold mb-4">Support</h5>
              <ul className="font-paragraph space-y-2">
                <li><Link to="/faq" className="text-primary-foreground/80 hover:text-primary-foreground">FAQ</Link></li>
                <li><Link to="/my-sessions" className="text-primary-foreground/80 hover:text-primary-foreground">My Sessions</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-heading font-semibold mb-4">Legal</h5>
              <ul className="font-paragraph space-y-2">
                <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground">Privacy Policy</a></li>
                <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
            <p className="font-paragraph text-primary-foreground/80">
              © 2024 HireBoost. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}