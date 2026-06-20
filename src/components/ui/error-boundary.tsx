import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="font-heading text-primary">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="font-paragraph text-primary/80">
                We encountered an unexpected error. This might be due to a network issue or a temporary problem with our AI services.
              </p>
              {this.state.error?.message && (
                <p className="font-paragraph text-sm text-primary/60 bg-secondary p-3 rounded">
                  {this.state.error.message}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.resetError}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AIErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  const getErrorMessage = (error?: Error) => {
    if (!error) return 'An unexpected error occurred.';
    
    const message = error.message;
    if (message.includes('AI_CONFIG_ERROR') || message.includes('API key')) {
      return 'AI features require configuration. Please contact support for assistance.';
    } else if (message.includes('AI_AUTH_ERROR')) {
      return 'Authentication failed with AI service. Please contact support.';
    } else if (message.includes('AI_RATE_LIMIT')) {
      return 'Too many requests. Please wait a moment and try again.';
    } else if (message.includes('AI_NETWORK_ERROR')) {
      return 'Unable to connect to AI service. Please check your internet connection.';
    } else if (message.includes('AI_SERVER_ERROR')) {
      return 'AI service is temporarily unavailable. Please try again in a few minutes.';
    } else {
      return 'Our AI service encountered an issue. Please try again or contact support if the problem persists.';
    }
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-primary mb-2">
          AI Service Issue
        </h3>
        <p className="font-paragraph text-primary/80 mb-4">
          {getErrorMessage(error)}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} variant="outline">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}