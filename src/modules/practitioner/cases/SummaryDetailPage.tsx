import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useTimelineSummaryById,
  useApproveTimelineSummary,
  useGenerateTimelineSummary,
} from "@/hooks/useTimelineSummary";
import {
  ChevronLeft,
  Download,
  RefreshCw,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export const SummaryDetailPage = () => {
  const { caseId, summaryId } = useParams();
  const navigate = useNavigate();

  const { mutate: approveSummary, isPending: approving } =
    useApproveTimelineSummary();
  const { mutate: regenerateSummary, isPending: regenerating } =
    useGenerateTimelineSummary();

  // Fetch summary data
  const {
    data: summaryData,
    isLoading,
    error,
  } = useTimelineSummaryById(summaryId);

  const summary = summaryData?.summary;

  const handleApprove = () => {
    if (!summaryId) return;
    approveSummary(summaryId, {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "The timeline summary has been approved.",
          showConfirmButton: false,
          timer: 1500,
        });
      },
    });
  };

  const handleRegenerate = () => {
    if (!caseId || !summary?.periodStart || !summary?.periodEnd) return;
    regenerateSummary(
      {
        caseId,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
      },
      {
        onSuccess: (data: {
          summary?: { _id?: string };
          timelineSummary?: { _id?: string };
          _id?: string;
        }) => {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Timeline summary regenerated successfully",

            showConfirmButton: false,
            timer: 1500,
          });
          const newId = data?.timelineSummary?._id || data?._id;
          if (newId) {
            navigate(`/practitioner/my-cases/${caseId}/summary/${newId}`);
          }
        },
      },
    );
  };

  // const progressData = {
  //   panicAttackFrequency: [
  //     { session: 1, value: 80, label: "6-8 per week" },
  //     { session: 2, value: 60, label: "3-4 per week" },
  //     { session: 3, value: 40, label: "2 per week" },
  //     { session: 4, value: 30, label: "1 per week" },
  //     { session: 5, value: 20, label: "1 per week" },
  //   ],
  //   sleepQuality: [
  //     { session: 4, hours: "4-5 hours" },
  //     { session: 5, hours: "6-7 hours" },
  //   ],
  // };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <Card className="p-6">
        <Link
          to={`/practitioner/my-cases/${caseId}`}
          className="flex items-center gap-2 mr-auto text-accent hover:text-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Case Timeline</span>
        </Link>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading summary...</span>
          </div>
        ) : error || !summary ? (
          <Card className="p-6 text-center">
            <AlertCircle className="mx-auto mb-2 w-8 h-8 text-red-500" />
            <p className="text-red-600">Failed to load summary details</p>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:justify-between sm:items-start gap-4">
              <div className="flex justify-between items-center gap-3 w-full">
                <h1 className="font-medium text-secondary text-xl sm:text-2xl">
                  Timeline Summary - v{summary.version}
                </h1>
                <p className="text-accent text-xs">
                  Status:
                  <span
                    className={`ml-1 px-3 py-1 rounded-full text-xs uppercase font-medium ${
                      summary.status === "Approved"
                        ? "bg-ring/10 text-ring"
                        : "bg-[#F2933911] text-[#F29339]"
                    }`}
                  >
                    {summary.status}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="flex items-center gap-2 text-white">
                  <Download className="w-4 h-4" />
                  Export Summary
                </Button>
                <Button
                  onClick={handleRegenerate}
                  variant="link"
                  className="flex items-center gap-2"
                  disabled={regenerating}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
                  />
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </Button>
                <Button variant="link" className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share with Supervisor
                </Button>
              </div>
            </div>

            {/* Summary Info */}
            <Card className="bg-primary/10 mt-6 p-6 border-primary/20">
              <h2 className="text-gray-900 text-lg sm:text-2xl">
                TIMELINE SUMMARY INFO
              </h2>
              <div className="space-y-1 mt-4 text-secondary text-sm">
                <p>
                  <span className="font-medium">Generated:</span>{" "}
                  {new Date(summary.createdAt).toLocaleDateString("en-US")}
                </p>
                {summary.approvedBy && (
                  <p>
                    <span className="font-medium">Approved by:</span>{" "}
                    {summary.approvedBy.name} on{" "}
                    {new Date(summary.approvedAt).toLocaleString("en-US")}
                  </p>
                )}
                <p>
                  <span className="font-medium">Coverage:</span>{" "}
                  {summary.sessionCount} sessions (
                  {new Date(summary.periodStart).toLocaleDateString("en-US")} -
                  {new Date(summary.periodEnd).toLocaleDateString("en-US")})
                </p>
                <p>
                  <span className="font-medium">Included:</span>{" "}
                  {summary.sessionCount} SOAP notes, {summary.fileCount}{" "}
                  uploaded files
                </p>
                <p>
                  <span className="font-medium">Version:</span>{" "}
                  {summary.version}
                </p>
                <p>
                  <span className="font-medium">Generated by:</span>{" "}
                  {summary.generatedBy?.name || "System"}
                </p>
              </div>
            </Card>

            {/* Timeline Summary */}
            <Card className="">
              <h2 className="text-secondary text-lg sm:text-2xl">
                Timeline Summary Details
              </h2>

              <div className="space-y-6">
                {/* Full Summary Text */}
                <div className="bg-gray-50 p-4 border border-border rounded-lg">
                  <p className="text-accent text-sm leading-relaxed whitespace-pre-wrap">
                    {summary.summaryText || "No summary text available"}
                  </p>
                </div>

                {/* Summary Sections */}
                {summary.summaryContent?.sections && (
                  <>
                    <div className="pt-6 border-t">
                      <h3 className="mb-4 font-medium text-secondary text-lg">
                        Summary Sections
                      </h3>
                      <div className="space-y-4">
                        {summary.summaryContent?.sections &&
                          Object.keys(summary.summaryContent.sections).map(
                            (key: string) => {
                              const value =
                                summary.summaryContent.sections[key];
                              return (
                                <div
                                  key={key}
                                  className="bg-gray-50 p-4 border border-border rounded-lg"
                                >
                                  <h4 className="mb-2 font-semibold text-secondary text-sm uppercase">
                                    {key
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (str) => str.toUpperCase())
                                      .trim()}
                                  </h4>
                                  <p className="text-accent text-sm leading-relaxed">
                                    {value || "No content provided."}
                                  </p>
                                </div>
                              );
                            },
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Approve Summary Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleApprove}
                className="text-white"
                disabled={approving || summary.status === "Approved"}
              >
                {summary.status === "Approved"
                  ? "Already Approved"
                  : approving
                    ? "Approving..."
                    : "Approve Summary"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
