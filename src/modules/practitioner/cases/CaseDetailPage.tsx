import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadFileModal } from "./UploadFileModal";
import { ExportCaseModal } from "./ExportCaseModal";
import { GenerateTimelineSummaryModal } from "./GenerateTimelineSummaryModal";
import { useCaseById, useCaseTimeline } from "@/hooks/useCases";
import { getFilePresignedUrl } from "@/services/fileService/fileService";
import {
  ChevronLeft,
  Mic,
  Upload,
  Download,
  Calendar,
  User,
  Hash,
  Clock,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  File,
  Loader2,
} from "lucide-react";
import { TagsList } from "@/components/TagsList";

// interface TimelineEntry {
//   id: string;
//   date: string;
//   type: "summary" | "session" | "file";
//   title: string;
//   status?: {
//     label: string;
//     color: "green" | "orange";
//   };
//   details?: string[];
//   comment?: string;
//   fileName?: string;
//   fileSize?: string;
//   uploadedBy?: string;
// }

export const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [timelineFilter, setTimelineFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [loadAllEntries, setLoadAllEntries] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerateSummaryModalOpen, setIsGenerateSummaryModalOpen] =
    useState(false);

  // Fetch case data
  const {
    data: caseData,
    isLoading: loadingCase,
    isError: caseError,
  } = useCaseById(caseId);

  // Fetch timeline data
  const { data: timelineData, isLoading: loadingTimeline } = useCaseTimeline(
    caseId,
    {
      eventType: timelineFilter,
      sessionStatus: sessionFilter,
      allEntries: loadAllEntries,
    },
  );

  const handleViewSummary = (summaryId: string) => {
    navigate(`/practitioner/my-cases/${caseId}/summary/${summaryId}`);
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/practitioner/my-cases/${caseId}/session/${sessionId}`);
  };

  // Extract case info from API response
  const caseInfo = caseData?.case || {};
  const timelineEntries = timelineData?.timeline || [];
  const paginationInfo = timelineData?.pagination || {};

  // Show loading state
  if (loadingCase) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <span className="mt-4 text-accent">Loading case details...</span>
      </div>
    );
  }

  // Show error state
  if (caseError || !caseInfo._id) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Case not found or error loading case</p>
        <Button
          onClick={() => navigate("/practitioner/my-cases")}
          className="mt-4"
        >
          Back to Cases
        </Button>
      </Card>
    );
  }

  const handleViewFile = async (fileId?: string) => {
    if (!fileId) return;
    try {
      const response = await getFilePresignedUrl(fileId);
      const url = response.data?.file?.url || response.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const handleDownloadFile = async (fileId?: string, fileName?: string) => {
    if (!fileId) return;
    try {
      const response = await getFilePresignedUrl(fileId);
      const url = response.data?.file?.url || response.data?.url;
      if (!url) return;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "file";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <Card className="px-6 py-4">
        <Link
          to={"/practitioner/my-cases"}
          // onClick={() => navigate("/practitioner/my-cases")}
          className="flex items-center gap-2 mr-auto text-accent hover:text-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Cases</span>
        </Link>

        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-medium text-secondary text-xl sm:text-2xl">
              {/* {caseInfo.internalRef || "N/A"} - {caseInfo.displayName || "N/A"} */}
              {caseInfo.displayName || "N/A"}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                caseInfo.status === "Active"
                  ? "bg-ring/10 text-ring"
                  : "border border-border bg-border/30 text-accent"
              }`}
            >
              {caseInfo.status || "Active"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                navigate(`/practitioner/my-cases/${caseId}/record-session`)
              }
              disabled={caseInfo.status !== "Active"}
              className="flex items-center gap-2 disabled:opacity-50 text-white disabled:cursor-not-allowed"
              title={
                caseInfo.status !== "Active"
                  ? `Cannot record session - case status is ${caseInfo.status}`
                  : "Record new session"
              }
            >
              <Mic className="w-4 h-4" />
              Record Session
            </Button>
            {/* <Button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={caseInfo.status !== "Active"}
              variant="outline"
              className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                caseInfo.status !== "Active"
                  ? `Cannot upload file - case status is ${caseInfo.status}`
                  : "Upload file"
              }
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Button> */}
            <Button
              onClick={() => setIsExportModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-row justify-between items-center gap-3 p-4">
          <div className="gap-1 grid">
            <p className="text-accent text-sm">Created</p>
            <p className="text-secondary text-xl">
              {caseInfo.createdAt
                ? new Date(caseInfo.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div className="flex justify-center items-center bg-primary/10 rounded-full w-12 h-12">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </Card>

        <Card className="flex flex-row justify-between items-center gap-3 p-4">
          <div className="gap-1 grid">
            <p className="text-accent text-sm">Assigned to</p>
            <p className="text-secondary text-xl">
              {caseInfo.assignedTo?.name || "N/A"}
            </p>
          </div>
          <div className="flex justify-center items-center bg-primary/10 rounded-full w-12 h-12">
            <User className="w-6 h-6 text-primary" />
          </div>
        </Card>

        {/* <Card className="flex flex-row justify-between items-center gap-3 p-4">
          <div className="gap-1 grid">
            <p className="text-accent text-sm">Created by</p>
            <p className="text-secondary text-xl">
              {caseInfo.createdBy?.name || "N/A"}
            </p>
          </div>
          <div className="flex justify-center items-center bg-primary/10 rounded-full w-12 h-12">
            <Users className="w-6 h-6 text-primary" />
          </div>
        </Card> */}

        <Card className="flex flex-row justify-between items-center gap-3 p-4">
          <div className="flex-1 gap-1 grid">
            {/* <p className="mb-1 text-accent text-sm">Tags</p>
            <div className="flex flex-wrap gap-1">
              {caseInfo.tags && caseInfo.tags.length > 0 ? (
                caseInfo.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-primary/10 px-2 py-0.5 rounded text-primary text-xs"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-accent text-xs">No tags</span>
              )}
            </div> */}
            <p className="mb-1 text-accent text-sm">Tags</p>
            <TagsList tags={caseInfo.tags} maxVisible={2} />
          </div>
          <div className="flex justify-center items-center bg-primary/10 rounded-full w-12 h-12">
            <Hash className="w-6 h-6 text-primary" />
          </div>
        </Card>
      </div>

      {/* Case Summary */}
      <Card className="bg-primary/5 p-6">
        <h2 className="text-secondary text-2xl">Case Summary</h2>
        <div className="gap-6 sm:gap-8 grid grid-cols-2 sm:grid-cols-4">
          <div>
            <p className="mb-1 text-accent text-sm">Total Sessions</p>
            <p className="text-secondary text-xl">
              {caseInfo.sessionsCount || 0}
            </p>
          </div>
          <div>
            <p className="mb-1 text-accent text-sm">Last Updated</p>
            <p className="text-secondary text-xl">
              {caseInfo.updatedAt
                ? new Date(caseInfo.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-accent text-sm">Files Uploaded</p>
            <p className="text-secondary text-xl">
              {caseInfo.fileUploadsCount || 0}
            </p>
          </div>
          <div>
            <p className="mb-1 text-accent text-sm">Notes Count</p>
            <p className="font-semibold text-ring text-lg">
              {caseInfo.notesCount || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div>
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-secondary text-2xl">Timeline</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsGenerateSummaryModalOpen(true)}
              disabled={caseInfo.status !== "Active"}
              className="disabled:opacity-50 text-white disabled:cursor-not-allowed"
              title={
                caseInfo.status !== "Active"
                  ? `Cannot generate summary - case status is ${caseInfo.status}`
                  : "Generate timeline summary"
              }
            >
              Generate Timelines Summary
            </Button>
            <div className="relative">
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="px-3 py-2 pr-8 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 text-accent text-sm appearance-none"
              >
                <option value="">All Types</option>
                <option value="timeline_summary">Summary</option>
                <option value="session">Sessions</option>
                <option value="file_upload">Files</option>
              </select>
              <ChevronDown className="top-1/2 right-2 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="px-3 py-2 pr-8 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 text-accent text-sm appearance-none"
              >
                <option value="">All Sessions</option>
                <option value="Created">Created</option>
                <option value="Recording">Recording</option>
                <option value="Processing">Processing</option>
                {/* <option value="TranscriptionComplete">Transcription Complete</option> */}
                {/* <option value="Ready">Ready</option> */}
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                {/* <option value="Error">Error</option> */}
              </select>
              <ChevronDown className="top-1/2 right-2 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Timeline Entries */}
        {loadingTimeline ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading timeline...</span>
          </div>
        ) : timelineEntries.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-accent">No timeline entries found</p>
          </Card>
        ) : (
          <div className="relative space-y-6">
            {/* Timeline line */}
            <div className="top-0 bottom-0 left-3 absolute border-primary/10 border-l-2"></div>

            {timelineEntries.map((entry: any) => {
              // Determine status based on event type
              const getStatusInfo = () => {
                if (entry.eventType === "session" && entry.session) {
                  const status = entry.session.status;
                  if (status === "Completed" || status === "Approved") {
                    return { label: "Approved", color: "green" };
                  } else if (status === "Pending" || status === "Created") {
                    return { label: "Pending Review", color: "orange" };
                  }
                  return { label: status, color: "orange" };
                }
                return null;
              };

              const statusInfo = getStatusInfo();

              return (
                <div key={entry._id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="top-1.5 left-1 absolute flex justify-center items-center bg-white border-2 border-primary rounded-full w-4 h-4"></div>

                  <Card className="p-5">
                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-accent text-sm">
                            {entry.eventDate
                              ? new Date(entry.eventDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "N/A"}
                          </span>
                          <span className="text-accent-foreground">-</span>
                          <h3 className="font-medium text-md text-secondary">
                            {entry.eventDescription || "Event"}
                          </h3>
                          {statusInfo && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                statusInfo.color === "green"
                                  ? "bg-ring/10 text-ring"
                                  : "bg-[#F2933911] text-[#F29339]"
                              }`}
                            >
                              {statusInfo.color === "green" && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {statusInfo.label}
                            </span>
                          )}
                        </div>

                        {/* Session Details */}
                        {entry.eventType === "session" && entry.session && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-accent text-sm">
                              <Clock className="w-4 h-4" />
                              <span>
                                Session #{entry.session.sessionNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-accent text-sm">
                              <FileText className="w-4 h-4" />
                              <span>
                                Language: {entry.session.language || "N/A"}
                              </span>
                            </div>
                            {entry.performedBy && (
                              <div className="flex items-center gap-2 text-accent text-sm">
                                <User className="w-4 h-4" />
                                <span>By: {entry.performedBy.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-accent text-sm">
                              <span>
                                Recording:{" "}
                                {entry.session.hasRecording ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* File Upload Details */}
                        {entry.eventType === "file_upload" && entry.file && (
                          <div className="flex items-center gap-3 bg-primary/5 p-3 rounded">
                            <File className="w-8 h-8 text-accent-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-secondary text-sm">
                                {entry.file.fileName || "File"}
                              </p>
                              <p className="text-accent text-xs">
                                {entry.file.fileSizeBytes
                                  ? `${(
                                      entry.file.fileSizeBytes /
                                      1024 /
                                      1024
                                    ).toFixed(2)} MB`
                                  : ""}{" "}
                                • Uploaded by:{" "}
                                {entry.performedBy?.name || "N/A"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Summary Details */}
                        {entry.eventType === "summary" && entry.summary && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-secondary text-sm italic">
                              {entry.summary.summaryText || "Summary generated"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {entry.eventType === "timeline_summary" && (
                        <Button
                          onClick={() =>
                            handleViewSummary(entry.timelineSummary._id)
                          }
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-ring bg-ring/10 text-ring"
                        >
                          View Full Summary
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                      {entry.eventType === "session" && entry.session && (
                        <Button
                          onClick={() => handleViewSession(entry.session._id)}
                          variant="outline"
                          size="sm"
                          className={`flex items-center gap-1 ${
                            statusInfo?.color === "orange"
                              ? "text-[#F29339] border-[#F29339] bg-[#F2933911] "
                              : "text-[#31B8C6] border-[#31B8C6] bg-[#31B8C6]/10 "
                          }`}
                        >
                          {statusInfo?.color === "orange"
                            ? "Review & Approve"
                            : "View Session"}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                      {entry.eventType === "file_upload" && entry.file && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-primary/10 border-primary text-primary"
                            onClick={() => handleViewFile(entry.file._id)}
                          >
                            View File
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            className="bg-primary/10 border-primary text-primary"
                            onClick={() =>
                              handleDownloadFile(
                                entry.file._id,
                                entry.file.fileName,
                              )
                            }
                          >
                            Download
                          </Button> */}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Load Earlier Entries */}
        {!loadAllEntries && paginationInfo.hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="link"
              className="font-semibold"
              onClick={() => setLoadAllEntries(true)}
              disabled={loadingTimeline}
            >
              {loadingTimeline ? "Loading..." : "Load Earlier Entries"}
            </Button>
          </div>
        )}
        {loadAllEntries && (
          <div className="flex justify-center mt-6">
            <p className="text-accent text-sm">
              Showing all {paginationInfo.total || timelineEntries.length}{" "}
              entries
            </p>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        caseId={caseId}
        onUploadSuccess={(fileData) => {
          console.log("File uploaded successfully:", fileData);
          // Add file to timeline or refresh data
        }}
      />

      {/* Export Case Modal */}
      <ExportCaseModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        caseId={caseId}
        // caseName={`${caseInfo.internalRef || ""} (${
        //   caseInfo.displayName || ""
        // })`}
        caseName={`${caseInfo.displayName || ""}`}
        onExportSuccess={(exportData) => {
          console.log("Export case data:", exportData);
          // Trigger export download
        }}
      />

      {/* Generate Timeline Summary Modal */}
      <GenerateTimelineSummaryModal
        isOpen={isGenerateSummaryModalOpen}
        onClose={() => setIsGenerateSummaryModalOpen(false)}
        caseId={caseId}
        onGenerateSuccess={(summaryData) => {
          console.log("Timeline summary generated:", summaryData);
          // Timeline and summaries will be auto-refreshed via query invalidation
        }}
      />
    </div>
  );
};
