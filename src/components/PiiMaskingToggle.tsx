import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

interface PiiMaskingToggleProps {
  hasPii: boolean;
  piiMaskingEnabled: boolean;
  currentlyMasked: boolean;
  onToggle: (showUnmasked: boolean) => void;
  userRole?: string;
  className?: string;
}

export const PiiMaskingToggle: React.FC<PiiMaskingToggleProps> = ({
  hasPii,
  piiMaskingEnabled,
  currentlyMasked,
  onToggle,
  userRole = 'practitioner',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!hasPii) {
      Swal.fire({
        title: 'No PII Detected',
        text: 'This transcript does not contain any personally identifiable information.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (currentlyMasked) {
      // User wants to view unmasked content - show warning
      const result = await Swal.fire({
        title: 'View Unmasked Content?',
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to view content with personally identifiable information (PII) unmasked.</p>
            <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
              <div class="flex items-center mb-2">
                <svg class="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span class="font-semibold text-yellow-800">Privacy Warning</span>
              </div>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• This action will be logged for audit purposes</li>
                <li>• Only view unmasked content when necessary for clinical care</li>
                <li>• Ensure you are in a private, secure environment</li>
              </ul>
            </div>
            <p class="text-sm text-gray-600">Do you want to proceed?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Show Unmasked',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          await onToggle(true);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // User wants to mask content again
      setIsLoading(true);
      try {
        await onToggle(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!piiMaskingEnabled) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${className}`}>
        <Shield className="w-4 h-4 mr-1" />
        PII masking disabled
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {hasPii && (
        <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <AlertTriangle className="w-4 h-4 mr-1" />
          PII Detected
        </div>
      )}
      
      <Button
        variant={currentlyMasked ? "outline" : "secondary"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || !hasPii}
        className={`flex items-center space-x-1 ${
          currentlyMasked 
            ? 'border-amber-300 text-amber-700 hover:bg-amber-50' 
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {currentlyMasked ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span>Show Unmasked</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span>Hide PII</span>
          </>
        )}
      </Button>

      {!hasPii && (
        <div className="flex items-center text-sm text-green-600">
          <Shield className="w-4 h-4 mr-1" />
          No PII detected
        </div>
      )}
    </div>
  );
};

export default PiiMaskingToggle;