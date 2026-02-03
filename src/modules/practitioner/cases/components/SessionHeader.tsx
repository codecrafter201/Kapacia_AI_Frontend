import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Delete, Loader2 } from "lucide-react";

interface SessionHeaderProps {
  sessionNumber: string;
  date: string;
  sessionName: string;
  caseId: string;
  caseName: string;
  statusLabel: string;
  statusColor: string;
  onDownload: () => void;
  onDelete: () => void;
  onOpenChat: () => void;
  isDeleting: boolean;
  navigateToCaseTimeline: (caseId: string) => void;
}

export const SessionHeader = ({
  sessionNumber,
  date,
  sessionName,
  caseId,
  caseName,
  statusLabel,
  statusColor,
  onDownload,
  onDelete,
  onOpenChat,
  isDeleting,
  navigateToCaseTimeline,
}: SessionHeaderProps) => {
  return (
    <Card className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 p-6">
      <div className="flex flex-col items-center sm:items-start gap-3">
        <button
          onClick={() => navigateToCaseTimeline(caseId)}
          className="flex items-center gap-2 mr-auto mb-4 text-accent hover:text-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Case Timeline</span>
        </button>

        <div className="flex items-center">
          <h1 className="font-medium text-secondary text-xl sm:text-2xl">
            Session {sessionNumber} - {date} {sessionName && `(${sessionName})`}
          </h1>
          <span
            className={`ml-1 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
              statusColor === "green"
                ? "bg-ring/10 text-ring"
                : "bg-[#F2933911] text-[#F29339]"
            }`}
          >
            {statusColor === "green" && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {statusLabel}
          </span>
        </div>

        <p className="text-accent text-sm">{caseName}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onDownload}
          className="flex items-center gap-2 text-white"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          variant="link"
          className="flex items-center gap-2"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Delete className="w-4 h-4" />
          )}
          Delete Session
        </Button>
        {/* <Button
          onClick={onOpenChat}
          className="flex items-center gap-2 bg-[#7657FF] hover:bg-[#5e42cc] text-white"
        >
          Chat
        </Button> */}
      </div>
    </Card>
  );
};
