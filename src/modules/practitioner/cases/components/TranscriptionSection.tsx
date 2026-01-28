import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TranscriptionSegment {
  id: string;
  timestamp: string | number;
  speaker: string;
  text: string;
  isFinal?: boolean;
}

interface TranscriptData {
  segments?: TranscriptionSegment[];
  rawText: string;
  wordCount: number;
  languageDetected: string;
  status: string;
  confidenceScore?: number;
  isEdited?: boolean;
}

interface TranscriptionSectionProps {
  isLoading: boolean;
  transcriptData: TranscriptData | null;
}

const formatTranscriptTimestamp = (timestamp: string | number) => {
  if (typeof timestamp === "number") {
    const hrs = Math.floor(timestamp / 3600);
    const mins = Math.floor((timestamp % 3600) / 60);
    const secs = Math.floor(timestamp % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  const parts = timestamp.split(":");
  if (parts.length === 3) {
    const firstPart = parseInt(parts[0]);
    if (firstPart > 1000) {
      const totalSeconds = Math.floor(firstPart / 1000);
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
  }

  return timestamp;
};

export const TranscriptionSection = ({
  isLoading,
  transcriptData,
}: TranscriptionSectionProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-secondary text-lg sm:text-2xl">Transcription</h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-accent">Loading transcript...</span>
        </div>
      ) : transcriptData ? (
        <div className="space-y-4">
          {/* Transcript Segments */}
          <div className="space-y-3 bg-primary/5 p-4 rounded-lg max-h-96 overflow-y-auto text-accent text-sm leading-relaxed">
            {transcriptData.segments && transcriptData.segments.length > 0 ? (
                transcriptData.segments.map((segment, index: number) => (
                <div
                  key={segment.id || index}
                  className="pb-3 border-b last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <span className="min-w-fit font-semibold text-primary">
                      [{formatTranscriptTimestamp(segment.timestamp)}]
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-secondary">
                        {segment.speaker}:
                      </span>
                      <p className="mt-1 text-accent">{segment.text}</p>
                    </div>
                    {segment.isFinal && (
                      <span className="bg-green-100 px-2 py-1 rounded font-medium text-green-700 text-xs">
                        Final
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-accent italic">{transcriptData.rawText}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 pt-4 border-t">
            <div className="space-y-1 text-accent text-xs">
              <p className="font-medium text-secondary">Transcript Details:</p>
              <p>
                Word Count:{" "}
                <span className="font-semibold text-primary">
                  {transcriptData.wordCount}
                </span>
              </p>
              <p>
                Language:{" "}
                <span className="font-semibold text-primary capitalize">
                  {transcriptData.languageDetected}
                </span>
              </p>
              <p>
                Status:{" "}
                <span className="font-semibold text-primary">
                  {transcriptData.status}
                </span>
              </p>
              {transcriptData.confidenceScore && (
                <p>
                  Confidence:{" "}
                  <span className="font-semibold text-primary">
                    {(transcriptData.confidenceScore * 100).toFixed(2)}%
                  </span>
                </p>
              )}
            </div>
            {transcriptData.isEdited && (
              <span className="bg-blue-100 px-3 py-1 rounded-full font-medium text-blue-700 text-xs">
                ✓ Edited
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 bg-primary/5 p-4 rounded-lg text-accent text-sm leading-relaxed">
            <p className="py-4 text-center italic">
              No transcript found. Transcription was not enabled or not found.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
