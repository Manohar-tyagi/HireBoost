import { useState } from 'react';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function RetryButton({ 
  onRetry, 
  children = 'Retry', 
  variant = 'outline',
  size = 'default',
  className,
  disabled = false
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying || disabled) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRetry}
      disabled={isRetrying || disabled}
      className={className}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : children}
    </Button>
  );
}