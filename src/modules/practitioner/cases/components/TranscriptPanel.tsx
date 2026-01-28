import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TranscriptPanelProps {
  isRecording: boolean;
  allowTranscript: boolean;
  onAllowTranscriptChange: (allow: boolean) => void;
  isTranscriptionConnected: boolean;
  transcriptionError: string | null;
  transcriptEntries: Array<{
    id: string;
    timestamp: string;
    speaker: string;
    text: string;
  }>;
  currentPartialTranscript: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  isRecording,
  allowTranscript,
  onAllowTranscriptChange,
  isTranscriptionConnected,
  transcriptionError,
  transcriptEntries,
  currentPartialTranscript,
}) => {
  if (!isRecording) return null;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-secondary text-xl">Real-time Transcript</h2>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {allowTranscript && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isTranscriptionConnected
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className="text-accent text-xs">
                {isTranscriptionConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          )}
          <Button
            onClick={() => onAllowTranscriptChange(!allowTranscript)}
            className={`text-sm ${
              allowTranscript
                ? "bg-primary hover:bg-primary/80 text-white"
                : "bg-accent hover:bg-accent/80 text-secondary"
            }`}
          >
            {allowTranscript ? "✓ " : ""}Allow Transcript
          </Button>
        </div>
      </div>

      {allowTranscript && (
        <>
          {/* Error Message */}
          {transcriptionError && (
            <div className="bg-red-50 mb-4 p-3 border border-red-200 rounded-lg">
              <p className="text-destructive text-sm">
                ⚠️ Transcription Error: {transcriptionError}
              </p>
            </div>
          )}

          {/* Transcript Entries */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transcriptEntries.length === 0 && !currentPartialTranscript && (
              <div className="py-8 text-accent text-sm text-center">
                <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin" />
                Waiting for speech...
              </div>
            )}

            {transcriptEntries.map((entry) => (
              <div key={entry.id} className="text-sm">
                <span className="bg-primary/10 mr-2 p-1 rounded-sm font-mono text-primary">
                  [{entry.timestamp}]
                </span>
                <span className="font-medium text-secondary">{entry.speaker}:</span>{" "}
                <span className="text-accent">{entry.text}</span>
              </div>
            ))}

            {/* Current Partial Transcript */}
            {currentPartialTranscript && (
              <div className="bg-blue-50 p-2 rounded text-sm">
                <span className="bg-blue-100 mr-2 p-1 rounded-sm font-mono text-blue-600">
                  [Live]
                </span>
                <span className="font-medium text-secondary italic">
                  Speaker:
                </span>{" "}
                <span className="opacity-70 text-accent italic">
                  {currentPartialTranscript}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
