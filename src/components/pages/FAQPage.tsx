import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BaseCrudService } from '@/integrations';
import { FrequentlyAskedQuestions } from '@/entities';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FrequentlyAskedQuestions[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const MOCK_FAQS: FrequentlyAskedQuestions[] = [
    {
      _id: 'faq-1',
      question: 'What is HireBoost?',
      answer: 'HireBoost is an AI-powered career preparation platform designed to help job seekers stand out. We offer real-time resume reviews, interactive mock interviews, and writing assistance for cover letters and LinkedIn profiles.',
      category: 'General',
      isFeatured: true,
      displayOrder: 1
    },
    {
      _id: 'faq-2',
      question: 'How does the Resume Review feature work?',
      answer: 'Simply upload your resume or paste the text. Our AI analyzes it against standard Applicant Tracking System (ATS) criteria, scores it on readability, impact, formatting, and length, and provides actionable suggestions with a one-click improvement tool.',
      category: 'Resume Review',
      isFeatured: true,
      displayOrder: 2
    },
    {
      _id: 'faq-3',
      question: 'Is my data secure and private?',
      answer: 'Yes, privacy is our top priority. Resume content and interview answers are processed in real-time. We do not store your data permanently unless you sign in and save your sessions to your profile.',
      category: 'Privacy',
      isFeatured: true,
      displayOrder: 3
    },
    {
      _id: 'faq-4',
      question: 'How do Mock Interviews work?',
      answer: 'You can choose a target role and select between Text or Voice interview modes. The AI will generate 5 customized questions. You respond to each question, and the AI provides detailed scores and model answer approaches.',
      category: 'Mock Interview',
      isFeatured: false,
      displayOrder: 4
    },
    {
      _id: 'faq-5',
      question: 'What is the AI Writing Assistant?',
      answer: 'It helps you draft professional materials. You can choose a template (like Cover Letter or LinkedIn headline/summary), input target roles and company details, or chat directly with the AI assistant for custom requests.',
      category: 'Writing Assistant',
      isFeatured: false,
      displayOrder: 5
    }
  ];

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const { items } = await BaseCrudService.getAll<FrequentlyAskedQuestions>('frequentlyaskedquestions');
        if (items && items.length > 0) {
          const sortedFAQs = items.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          });
          setFaqs(sortedFAQs);
        } else {
          setFaqs(MOCK_FAQS);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs(MOCK_FAQS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchTerm || 
      faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredFAQs = filteredFAQs.filter(faq => faq.isFeatured);
  const regularFAQs = filteredFAQs.filter(faq => !faq.isFeatured);

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
                <Link to="/faq" className="font-paragraph text-primary font-semibold">
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
            Frequently Asked Questions
          </h1>
          <p className="text-lg font-paragraph text-primary/80 max-w-2xl mx-auto">
            Find answers to common questions about HireBoost's AI-powered career preparation tools.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Questions' : category}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="font-paragraph text-primary/60">Loading FAQs...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Featured Questions */}
            {featuredFAQs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-heading font-bold text-primary mb-6">Popular Questions</h2>
                <Card className="border-primary/20">
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {featuredFAQs.map((faq, index) => (
                        <AccordionItem key={faq._id} value={`featured-${index}`} className="border-primary/10">
                          <AccordionTrigger className="px-6 py-4 text-left font-paragraph font-semibold text-primary hover:text-primary/80">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 font-paragraph text-primary/80 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Regular Questions */}
            {regularFAQs.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-primary mb-6">
                  {featuredFAQs.length > 0 ? 'More Questions' : 'All Questions'}
                </h2>
                <Card className="border-primary/20">
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {regularFAQs.map((faq, index) => (
                        <AccordionItem key={faq._id} value={`regular-${index}`} className="border-primary/10">
                          <AccordionTrigger className="px-6 py-4 text-left font-paragraph font-semibold text-primary hover:text-primary/80">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 font-paragraph text-primary/80 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            )}

            {filteredFAQs.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="font-paragraph text-primary/60 mb-4">
                  No questions found matching your search.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center bg-secondary rounded-lg p-8">
          <h3 className="text-2xl font-heading font-bold text-secondary-foreground mb-4">
            Still have questions?
          </h3>
          <p className="font-paragraph text-secondary-foreground/80 mb-6">
            Can't find what you're looking for? Get in touch with our support team.
          </p>
          <Button asChild>
            <a href="mailto:support@hireboost.com">Contact Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}