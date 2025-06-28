import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  className = '',
  showIcon = true 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      {showIcon && (
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-sm text-red-600 text-center mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RefreshCw size={16} />}
          className="text-sm"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;