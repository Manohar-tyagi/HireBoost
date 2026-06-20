import { useState, useEffect } from 'react';
import { Badge } from './badge';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface AIStatusIndicatorProps {
  className?: string;
}

export function AIStatusIndicator({ className }: AIStatusIndicatorProps) {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        // Check if API key is configured
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          setStatus('unavailable');
          return;
        }

        // In a real implementation, you might ping the AI service
        // For now, we'll assume it's available if the key exists
        setStatus('available');
      } catch (error) {
        setStatus('unavailable');
      }
    };

    checkAIStatus();
  }, []);

  if (status === 'checking') {
    return (
      <Badge variant="outline" className={className}>
        <Wifi className="w-3 h-3 mr-1 animate-pulse" />
        Checking AI...
      </Badge>
    );
  }

  if (status === 'available') {
    return (
      <Badge variant="default" className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        AI Ready
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className={className}>
      <AlertCircle className="w-3 h-3 mr-1" />
      AI Unavailable
    </Badge>
  );
}