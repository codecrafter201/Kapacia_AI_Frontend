import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ApprovalSectionProps {
  isApprovalConfirmed: boolean;
  onApprovalChange: (confirmed: boolean) => void;
  onApprove: () => void;
  isApproving: boolean;
  isSessionApproved: boolean;
}

export const ApprovalSection = ({
  isApprovalConfirmed,
  onApprovalChange,
  onApprove,
  isApproving,
  isSessionApproved,
}: ApprovalSectionProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-secondary text-lg sm:text-2xl">Approval</h2>
      <p className="text-accent text-sm">
        Please review the transcript and SOAP note carefully before approving.
        Once approved, this becomes the official clinical record.
      </p>

      <div className="space-y-3 mb-6">
        <label
          className={`flex items-start gap-3 ${
            isSessionApproved ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            checked={isSessionApproved || isApprovalConfirmed}
            disabled={isSessionApproved}
            onChange={() => {
              if (!isSessionApproved) {
                onApprovalChange(!isApprovalConfirmed);
              }
            }}
            className="mt-1 rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary shrink-0"
          />
          <div className="text-secondary text-sm">
            <p className="mb-2">I confirm that I have:</p>
            <ul className="space-y-1 pl-5 list-disc">
              <li>Reviewed the transcript and it is accurate</li>
              <li>
                Reviewed the SOAP note and it reflects my clinical assessment
              </li>
              <li>Verified all patient information is accurate</li>
            </ul>
          </div>
        </label>
      </div>

      <div className="flex justify-start gap-3">
        <Button
          onClick={onApprove}
          disabled={
            !isApprovalConfirmed || isApproving || isSessionApproved
          }
          className={`${
            !isApprovalConfirmed || isApproving || isSessionApproved
              ? "bg-primary/30 cursor-not-allowed"
              : "bg-primary hover:bg-primary/80"
          } text-white`}
        >
          {isApproving ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Approving...
            </>
          ) : isSessionApproved ? (
            "✓ Session Approved"
          ) : (
            "Approve Session"
          )}
        </Button>
      </div>
    </Card>
  );
};
