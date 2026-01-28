import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecordingActionsProps {
  caseId: string;
  hasRecordedBlob: boolean;
  onSaveSession: () => void;
  createSessionMutationPending: boolean;
  stopRecordingMutationPending: boolean;
}

export const RecordingActions: React.FC<RecordingActionsProps> = ({
  caseId,
  hasRecordedBlob,
  onSaveSession,
  createSessionMutationPending,
  stopRecordingMutationPending,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end gap-3 pb-8">
      <Button
        variant="link"
        onClick={() => navigate(`/practitioner/my-cases/${caseId}`)}
        className=""
      >
        Cancel
      </Button>
      <Button
        disabled={
          !hasRecordedBlob ||
          createSessionMutationPending ||
          stopRecordingMutationPending
        }
        onClick={onSaveSession}
        className="text-white"
      >
        {createSessionMutationPending || stopRecordingMutationPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Session"
        )}
      </Button>
    </div>
  );
};
