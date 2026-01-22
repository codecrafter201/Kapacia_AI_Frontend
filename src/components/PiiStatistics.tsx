import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, Eye, FileText, AlertTriangle } from 'lucide-react';

interface PiiStatisticsProps {
  statistics: {
    sessionId: string;
    piiMaskingEnabled: boolean;
    transcript: {
      hasPii: boolean;
      totalEntitiesMasked: number;
      entitiesByType: Record<string, any[]>;
      lastProcessed: string | null;
    };
    auditSummary: Record<string, { count: number; totalPiiEntities: number }>;
    totalAuditEntries: number;
  };
  className?: string;
}

export const PiiStatistics: React.FC<PiiStatisticsProps> = ({
  statistics,
  className = ''
}) => {
  const { transcript, auditSummary, totalAuditEntries, piiMaskingEnabled } = statistics;

  const entityTypeLabels: Record<string, string> = {
    nric: 'NRIC/FIN',
    phone: 'Phone Numbers',
    email: 'Email Addresses',
    address: 'Addresses',
    medical_id: 'Medical IDs',
    financial: 'Financial Info',
    name: 'Names',
    date: 'Dates'
  };

  const entityTypeIcons: Record<string, React.ReactNode> = {
    nric: <Shield className="w-4 h-4" />,
    phone: <Shield className="w-4 h-4" />,
    email: <Shield className="w-4 h-4" />,
    address: <Shield className="w-4 h-4" />,
    medical_id: <FileText className="w-4 h-4" />,
    financial: <Shield className="w-4 h-4" />,
    name: <Shield className="w-4 h-4" />,
    date: <Shield className="w-4 h-4" />
  };

  if (!piiMaskingEnabled) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center text-gray-500">
          <AlertTriangle className="w-5 h-5 mr-2" />
          PII masking is disabled for this session
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            PII Protection Summary
          </h3>
          <div className={`px-2 py-1 rounded text-sm ${
            transcript.hasPii 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {transcript.hasPii ? 'PII Detected' : 'No PII Detected'}
          </div>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Entities Masked</p>
                <p className="text-2xl font-bold text-blue-800">{transcript.totalEntitiesMasked}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Audit Entries</p>
                <p className="text-2xl font-bold text-green-800">{totalAuditEntries}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Entity Types</p>
                <p className="text-2xl font-bold text-purple-800">
                  {Object.keys(transcript.entitiesByType).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Entity Breakdown */}
        {transcript.hasPii && Object.keys(transcript.entitiesByType).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">PII Entities by Type</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(transcript.entitiesByType).map(([type, entities]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    {entityTypeIcons[type] || <Shield className="w-4 h-4" />}
                    <span className="ml-2 text-sm font-medium">
                      {entityTypeLabels[type] || type}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {Array.isArray(entities) ? entities.length : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Summary */}
        {Object.keys(auditSummary).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Audit Activity</h4>
            <div className="space-y-2">
              {Object.entries(auditSummary).map(([action, data]) => (
                <div key={action} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium capitalize">
                    {action.replace('_', ' ')}
                  </span>
                  <div className="text-sm text-gray-600">
                    {data.count} {data.count === 1 ? 'entry' : 'entries'}
                    {data.totalPiiEntities > 0 && (
                      <span className="ml-2 text-amber-600">
                        ({data.totalPiiEntities} PII entities)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Processed */}
        {transcript.lastProcessed && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Last processed: {new Date(transcript.lastProcessed).toLocaleString()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PiiStatistics;