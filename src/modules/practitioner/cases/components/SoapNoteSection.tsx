import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";

interface SoapNoteData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface LatestSoapNote {
  _id: string;
  version: number;
  createdAt: string;
  generatedBy: string;
  status: string;
  content?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  contentText?: string;
}

interface SoapNoteSectionProps {
  latestSoapNote: LatestSoapNote | null;
  soapNoteData: SoapNoteData;
  isLoading: boolean;
  hasError: boolean;
  onEditClick: () => void;
}

export const SoapNoteSection = ({
  latestSoapNote,
  soapNoteData,
  isLoading,
  hasError,
  onEditClick,
}: SoapNoteSectionProps) => {
  return (
    <Card className="p-6">
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-secondary text-lg sm:text-2xl">
            SOAP Note Draft - Version {latestSoapNote?.version || "1"}
          </h2>
          <p className="text-accent text-sm">
            {latestSoapNote ? (
              <>
                Generated:{" "}
                {new Date(latestSoapNote.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}{" "}
                <span className="ml-1 px-3 py-1 rounded-full bg-ring/10 text-ring text-sm">
                  ({latestSoapNote.generatedBy}) • Status: {latestSoapNote.status}
                </span>
              </>
            ) : (
              "No SOAP note generated yet"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEditClick}
            variant="link"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-accent">Loading SOAP note...</span>
        </div>
      ) : hasError ? (
        <div className="bg-primary/5 p-4 border border-border/10 rounded-lg">
          <p className="text-destructive text-sm">⚠️ Error loading SOAP note</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subjective */}
          <div>
            <h3 className="mb-2 text-md text-primary">S (Subjective):</h3>
            <p className="text-accent text-sm leading-relaxed">
              {soapNoteData.subjective}
            </p>
          </div>

          {/* Objective */}
          <div>
            <h3 className="mb-2 text-md text-primary">O (Objective):</h3>
            <p className="text-accent text-sm leading-relaxed">
              {soapNoteData.objective}
            </p>
          </div>

          {/* Assessment */}
          <div>
            <h3 className="mb-2 text-md text-primary">A (Assessment):</h3>
            <p className="text-accent text-sm leading-relaxed">
              {soapNoteData.assessment}
            </p>
          </div>

          {/* Plan */}
          <div>
            <h3 className="mb-2 text-md text-primary">P (Plan):</h3>
            <div className="text-accent text-sm leading-relaxed whitespace-pre-wrap">
              {soapNoteData.plan}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
