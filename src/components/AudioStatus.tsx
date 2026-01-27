import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AudioStatusProps {
  isLoading: boolean;
  hasError: boolean;
  hasAudio: boolean;
  expiresAt?: string;
  onRetry?: () => void;
}

export const AudioStatus: React.FC<AudioStatusProps> = ({
  isLoading,
  hasError,
  hasAudio,
  expiresAt,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading audio...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Audio unavailable</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-800 underline ml-1"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (hasAudio && expiresAt) {
    const expiryTime = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiryTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Audio ready</span>
        {timeLeft > 0 && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <AlertCircle className="w-4 h-4" />
      <span>No audio available</span>
    </div>
  );
};