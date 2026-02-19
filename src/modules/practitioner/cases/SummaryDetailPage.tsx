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
  Loader2,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import Swal from "sweetalert2";
import { useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { SummaryPDFDocument } from "@/components/SummaryPDFDocument";

export const SummaryDetailPage = () => {
  const { caseId, summaryId } = useParams();
  const navigate = useNavigate();

  const { mutate: approveSummary, isPending: approving } =
    useApproveTimelineSummary();
  const { mutate: regenerateSummary, isPending: regenerating } =
    useGenerateTimelineSummary();

  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch summary data
  const {
    data: summaryData,
    isLoading,
    error,
  } = useTimelineSummaryById(summaryId);

  const summary = summaryData?.summary;

  // Normalize markdown to avoid excessive blank gaps
  const normalizeMarkdown = (s?: string) => {
    if (!s) return "";
    let t = s.replace(/\r\n/g, "\n"); // normalize CRLF → LF
    // Remove orphan list markers like "7." or lone "-" / "*"
    t = t
      .split("\n")
      .filter(
        (line) =>
          !/^\s*\d+\.\s*$/.test(line) && // lines that are only a number followed by a dot
          !/^\s*[-*]\s*$/.test(line), // lines that are only a dash or asterisk
      )
      .join("\n");
    // Collapse excessive blank lines and trim
    t = t.replace(/\n{3,}/g, "\n\n").trim();
    return t;
  };

  // Controlled spacing for markdown elements
  const markdownComponents = {
    p: (props: any) => (
      <p
        className="mb-3 last:mb-0 wrap-break-words leading-relaxed"
        {...props}
      />
    ),
    h1: (props: any) => (
      <h1
        className="mt-6 mb-2 font-semibold text-secondary text-xl"
        {...props}
      />
    ),
    h2: (props: any) => (
      <h2
        className="mt-6 mb-2 font-semibold text-secondary text-lg"
        {...props}
      />
    ),
    h3: (props: any) => (
      <h3
        className="mt-5 mb-2 font-semibold text-secondary text-base"
        {...props}
      />
    ),
    ul: (props: any) => (
      <ul className="space-y-1 mb-3 pl-5 list-disc" {...props} />
    ),
    ol: (props: any) => (
      <ol className="space-y-1 mb-3 pl-5 list-decimal" {...props} />
    ),
    li: (props: any) => <li className="leading-relaxed" {...props} />,
    blockquote: (props: any) => (
      <blockquote
        className="my-3 pl-3 border-border border-l-2 text-accent/80"
        {...props}
      />
    ),
    hr: () => <hr className="my-4 border-border" />,
    br: () => <br />,
  } as const;

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

  const handleExportPdf = async () => {
    if (!summary) return;

    try {
      setExporting(true);

      // Generate PDF blob
      const blob = await pdf(<SummaryPDFDocument summary={summary} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const start = new Date(summary.periodStart).toISOString().slice(0, 10);
      const end = new Date(summary.periodEnd).toISOString().slice(0, 10);
      const filename = `Timeline_Summary_v${summary.version}_${start}_to_${end}.pdf`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "PDF exported successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Export failed",
        text: e instanceof Error ? e.message : "Unable to create PDF",
      });
    } finally {
      setExporting(false);
    }
  };

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

              <div className="flex flex-wrap justify-between gap-2 w-full">
                <div className="flex gap-3">
                  <Button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 text-white"
                    disabled={exporting}
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? "Exporting..." : "Export Summary"}
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
                </div>
                {/* <Button variant="link" className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share with Supervisor
                </Button> */}
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
            </div>

            {/* Summary Info */}
            <div ref={printRef} className="mt-6">
              <Card className="bg-primary/10 p-6 border-primary/20">
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
                    {new Date(summary.periodStart).toLocaleDateString("en-US")}{" "}
                    -{new Date(summary.periodEnd).toLocaleDateString("en-US")})
                  </p>
                  <p>
                    <span className="font-medium">Included:</span>{" "}
                    {summary.sessionCount} Summary notes, {summary.fileCount}{" "}
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
              <Card className="mt-6">
                <h2 className="text-secondary text-lg sm:text-2xl">
                  Timeline Summary Details
                </h2>

                <div className="space-y-6">
                  {/* Full Summary Text */}
                  <div className="bg-gray-50 p-4 border border-border rounded-lg">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      className="max-w-none text-accent text-sm"
                      components={markdownComponents}
                    >
                      {normalizeMarkdown(summary.summaryText) ||
                        "No summary text available"}
                    </ReactMarkdown>
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
                                        .replace(/^./, (str) =>
                                          str.toUpperCase(),
                                        )
                                        .trim()}
                                    </h4>
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm, remarkBreaks]}
                                      className="max-w-none text-accent text-sm"
                                      components={markdownComponents}
                                    >
                                      {normalizeMarkdown(value) ||
                                        "No content provided."}
                                    </ReactMarkdown>
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
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
