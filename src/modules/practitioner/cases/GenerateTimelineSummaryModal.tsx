import { useState } from "react";
import { X, Calendar, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerateTimelineSummary } from "@/hooks/useTimelineSummary";

interface GenerateTimelineSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onGenerateSuccess?: (summaryData: any) => void;
}

export const GenerateTimelineSummaryModal = ({
  isOpen,
  onClose,
  caseId,
  onGenerateSuccess,
}: GenerateTimelineSummaryModalProps) => {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const generateMutation = useGenerateTimelineSummary();

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) {
      alert("Please select both start and end dates for the summary period.");
      return;
    }

    if (!caseId) {
      alert("caseId is required to generate a timeline summary.");
      return;
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate > endDate) {
      alert("Start date must be before or equal to end date.");
      return;
    }

    try {
      console.log("Starting timeline summary generation...", {
        caseId,
        periodStart,
        periodEnd,
      });

      const response = await generateMutation.mutateAsync({
        caseId,
        periodStart,
        periodEnd,
      });

      console.log("Timeline summary generated successfully:", response);

      if (onGenerateSuccess) {
        onGenerateSuccess(response);
      }

      handleClose();
    } catch (error: any) {
      console.error("Error generating timeline summary:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate timeline summary. Please try again.";
      alert(message);
    }
  };

  const handleClose = () => {
    setPeriodStart("");
    setPeriodEnd("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="relative bg-white shadow-xl rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-gray-200 border-b">
          <h2 className="font-normal text-md text-secondary sm:text-xl">
            Generate Timeline Summary
          </h2>
          <button
            onClick={handleClose}
            className="bg-primary/10 p-1 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          <div className="bg-primary/5 p-4 border-2 border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 w-5 h-5 text-primary shrink-0" />
              <div className="space-y-1">
                <h3 className="font-medium text-secondary text-sm">
                  AI-Powered Summary
                </h3>
                <p className="text-accent text-xs">
                  Our AI will analyze all sessions, transcripts, Summary notes,
                  and uploaded files within the selected period to generate a
                  comprehensive timeline summary with key insights, treatment
                  progress, and recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Period Selection */}
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <h3 className="text-primary text-sm">SUMMARY PERIOD</h3>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="block font-medium text-sm text-accent-foreground">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="top-1/2 left-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="px-3 py-2 pl-10 border border-border focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full text-secondary text-sm"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="block font-medium text-sm text-accent-foreground">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="top-1/2 left-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="px-3 py-2 pl-10 border border-border focus:border-primary rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full text-secondary text-sm"
                  />
                </div>
              </div>
            </div>

            <p className="text-accent text-xs">
              Select the time period for which you want to generate the summary.
              All sessions, files, and data within this period will be included
              in the AI analysis.
            </p>
          </div>

          {/* What will be included */}
          <div className="space-y-3 bg-gray-50 p-4 border border-border rounded-lg">
            <h3 className="font-medium text-secondary text-sm">
              What's Included in the Summary
            </h3>
            <ul className="space-y-2 text-accent text-xs">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 rounded-full w-1.5 h-1.5 shrink-0"></span>
                <span>
                  <strong>Session data:</strong> All therapy sessions within the
                  selected period
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 rounded-full w-1.5 h-1.5 shrink-0"></span>
                <span>
                  <strong>Summary notes:</strong> Summary notes and session
                  transcripts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 rounded-full w-1.5 h-1.5 shrink-0"></span>
                <span>
                  <strong>Documents:</strong> All uploaded files and audio
                  records
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 rounded-full w-1.5 h-1.5 shrink-0"></span>
                <span>
                  <strong>Previous summaries:</strong> Context from prior
                  timeline summaries
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 rounded-full w-1.5 h-1.5 shrink-0"></span>
                <span>
                  <strong>AI Analysis:</strong> Themes, treatment progress,
                  protective/risk factors, and recommendations
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-gray-200 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={generateMutation.isPending}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!periodStart || !periodEnd || generateMutation.isPending}
            className={`flex items-center gap-2 ${
              !periodStart || !periodEnd || generateMutation.isPending
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            } text-white`}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
