import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  useSessionById,
  useDeleteSession,
  useUpdateSession,
  useSessionAudioUrl,
} from "@/hooks/useSessions";
import { useTranscriptBySession } from "@/hooks/useTranscript";
import { useSoapNotesBySession, useApproveSoapNote } from "@/hooks/useSoap";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SessionHeader } from "./components/SessionHeader";
import { SessionInfoCard } from "./components/SessionInfoCard";
import { AudioPlayer } from "./components/AudioPlayer";
import { TranscriptionSection } from "./components/TranscriptionSection";
import { SoapNoteSection } from "./components/SoapNoteSection";
import { ApprovalSection } from "./components/ApprovalSection";

export const SessionViewPage = () => {
  const { caseId, sessionId } = useParams();
  const navigate = useNavigate();
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const location = useLocation();

  const qc = useQueryClient();

  const { audioUrl } = location.state || {};

  // Fetch session data from API
  const {
    data: sessionResponse,
    isLoading: loadingSession,
    isError: sessionError,
  } = useSessionById(sessionId);

  // Fetch presigned audio URL with proper error handling
  const {
    data: presignedAudio,
    isLoading: loadingAudio,
    isError: audioFetchError,
    refetch: refetchAudio,
  } = useSessionAudioUrl(sessionId);

  const deleteSessionMutation = useDeleteSession();
  const updateSessionMutation = useUpdateSession();

  // Fetch transcript data
  const {
    data: transcriptResponse,
    isLoading: loadingTranscript,
    refetch: refetchTranscript,
  } = useTranscriptBySession(sessionId);

  // Fetch SOAP notes for this session
  const {
    data: soapResponse,
    isLoading: loadingSoapNotes,
    isError: soapError,
  } = useSoapNotesBySession(sessionId);

  // Mutations
  const approveSoapNoteMutation = useApproveSoapNote();

  const sessionData = sessionResponse?.session || null;
  const transcriptData = transcriptResponse?.data?.transcript || null;

  // Get the latest SOAP note (first one since they're sorted by version desc)
  const latestSoapNote = soapResponse?.soapNotes?.[0] || null;

  // Refetch transcript when sessionId changes
  useEffect(() => {
    if (sessionId) {
      refetchTranscript();
    }
  }, [sessionId, refetchTranscript]);

  // Format time helper function moved to AudioPlayer component
  // Kept here for backward compatibility if needed elsewhere

  // Helper function to parse SOAP content
  const parseSoapData = () => {
    if (!latestSoapNote) {
      return {
        subjective: "Patient information not yet available",
        objective: "Objective information not yet available",
        assessment: "Assessment not yet available",
        plan: "Treatment plan not yet available",
      };
    }

    // Use structured content directly from backend
    if (latestSoapNote.content) {
      return {
        subjective: latestSoapNote.content.subjective || "",
        objective: latestSoapNote.content.objective || "",
        assessment: latestSoapNote.content.assessment || "",
        plan: latestSoapNote.content.plan || "",
      };
    }

    // Fallback to contentText
    if (latestSoapNote.contentText) {
      const lines = latestSoapNote.contentText.split("\n");
      const result: {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
      } = {
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      };

      let currentSection: keyof typeof result | "" = "";
      let currentText = "";

      for (const line of lines) {
        if (line.includes("S (Subjective):")) {
          if (currentSection) result[currentSection] = currentText.trim();
          currentSection = "subjective";
          currentText = "";
        } else if (line.includes("O (Objective):")) {
          if (currentSection) result[currentSection] = currentText.trim();
          currentSection = "objective";
          currentText = "";
        } else if (line.includes("A (Assessment):")) {
          if (currentSection) result[currentSection] = currentText.trim();
          currentSection = "assessment";
          currentText = "";
        } else if (line.includes("P (Plan):")) {
          if (currentSection) result[currentSection] = currentText.trim();
          currentSection = "plan";
          currentText = "";
        } else if (currentSection) {
          currentText += (currentText ? "\n" : "") + line;
        }
      }

      if (currentSection) result[currentSection] = currentText.trim();

      return result;
    }

    return {
      subjective: "Patient information not yet available",
      objective: "Objective information not yet available",
      assessment: "Assessment not yet available",
      plan: "Treatment plan not yet available",
    };
  };

  const soapNoteData = parseSoapData();

  // Get status info with color coding
  const getStatusInfo = () => {
    const status = displaySessionData?.status;
    if (status === "Completed" || status === "Approved") {
      return { label: "Approved", color: "green" };
    } else if (status === "Pending" || status === "Created") {
      return { label: "Pending Review", color: "orange" };
    }
    return { label: status, color: "orange" };
  };

  const handleDownload = () => {
    const resolvedAudioUrl = stableAudioUrl || sessionData?.audioUrl;
    if (!resolvedAudioUrl) {
      console.warn("[Download] No audio URL available");
      return;
    }

    const a = document.createElement("a");
    a.href = resolvedAudioUrl;
    a.download = `session-${sessionId}-${sessionData?.sessionNumber || "recording"}.webm`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Stable reference for audio URL to prevent infinite re-renders
  const stableAudioUrl = useMemo(() => {
    let presignedUrl: string | null = null;

    if (presignedAudio) {
      const audioObj = presignedAudio as Record<string, unknown>;
      presignedUrl =
        (audioObj?.audio as Record<string, string>)?.url ||
        (audioObj?.data as Record<string, Record<string, string>>)?.audio
          ?.url ||
        (audioObj?.data as Record<string, string>)?.url ||
        (audioObj?.url as string);
    }

    return presignedUrl || audioUrl || null;
  }, [presignedAudio, audioUrl]);

  // Auto-refresh audio URL when it's about to expire
  useEffect(() => {
    if (!sessionId || !presignedAudio?.audio?.expiresAt) return;

    const expiresAt = new Date(presignedAudio.audio.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    const refreshTime = Math.max(timeUntilExpiry - 10 * 60 * 1000, 60000);

    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        refetchAudio();
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [presignedAudio, sessionId, refetchAudio]);

  const handleDeleteSession = async () => {
    if (!sessionId) return;

    const result = await Swal.fire({
      title: "Delete Session?",
      text: "Are you sure you want to delete this session? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      Swal.fire({
        title: "Deleted!",
        text: "Session has been deleted successfully.",
        icon: "success",
        confirmButtonColor: "#188aec",
      });
      navigate(`/practitioner/my-cases/${caseId}`);
    } catch (error) {
      console.error("Failed to delete session:", error);
      Swal.fire({
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to delete session. Please try again.",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
    }
  };

  const handleApproveSession = async () => {
    if (!sessionId) return;

    try {
      // Approve the session
      await updateSessionMutation.mutateAsync({
        sessionId,
        data: {
          status: "Approved",
        },
      });

      console.log("Session approved, latestSoapNote:", latestSoapNote);

      // Also approve the SOAP note if it exists
      if (latestSoapNote?._id) {
        try {
          console.log("Approving SOAP note with ID:", latestSoapNote._id);
          const soapApprovalResponse =
            await approveSoapNoteMutation.mutateAsync(latestSoapNote._id);
          console.log("SOAP note approved successfully:", soapApprovalResponse);
        } catch (soapError) {
          console.error("Failed to approve SOAP note:", soapError);
          Swal.fire({
            title: "Partial Success",
            text: "Session was approved, but there was an issue approving the SOAP note. Please refresh and try again.",
            icon: "warning",
            confirmButtonColor: "#188aec",
          });
          return;
        }
      } else {
        console.warn("No SOAP note found to approve");
      }

      await qc.invalidateQueries({ queryKey: ["soap-status"] });

      Swal.fire({
        title: "Success!",
        text: "Session and SOAP note have been approved successfully.",
        icon: "success",
        confirmButtonColor: "#188aec",
      });
    } catch (error) {
      console.error("Failed to approve session:", error);
      Swal.fire({
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to approve session. Please try again.",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
    }
  };

  // Show loading state
  if (loadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <span className="mt-4 text-accent">Loading session...</span>
      </div>
    );
  }

  // Show error state
  if (sessionError || !sessionData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          Session not found or error loading session
        </p>
        <Button
          onClick={() => navigate(`/practitioner/my-cases/${caseId}`)}
          className="mt-4"
        >
          Back to Case
        </Button>
      </Card>
    );
  }

  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0
        ? `${mins} minute${mins !== 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`
        : `${mins} minute${mins !== 1 ? "s" : ""}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0
        ? `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`
        : `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
  };

  // Session info for display
  const displaySessionData = {
    sessionNumber: sessionData.sessionNumber?.toString() || "N/A",
    date: sessionData.sessionDate
      ? new Date(sessionData.sessionDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A",
    duration: sessionData.durationSeconds
      ? formatDuration(sessionData.durationSeconds)
      : "N/A",
    case: sessionData.case
      ? // ? `${sessionData.case.internalRef} (${sessionData.case.displayName})`
        `${sessionData.case.displayName}`
      : "N/A",
    language:
      sessionData.language?.charAt(0).toUpperCase() +
        sessionData.language?.slice(1) || "English",
    practitioner: sessionData.createdBy?.name || "N/A",
    status: sessionData.status || "Created",
    transcriptionStatus: sessionData.hasTranscription ? "Obtained" : "Pending",
    soapNoteStatus: sessionData.hasSoapNote ? "Generated" : "Pending",
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <SessionHeader
        sessionNumber={displaySessionData.sessionNumber}
        date={displaySessionData.date}
        caseId={caseId!}
        caseName={displaySessionData.case}
        statusLabel={statusInfo?.label || "Pending"}
        statusColor={statusInfo?.color || "orange"}
        onDownload={handleDownload}
        onDelete={handleDeleteSession}
        onOpenChat={() => setIsChatOpen(true)}
        isDeleting={deleteSessionMutation.isPending}
        navigateToCaseTimeline={(id) =>
          navigate(`/practitioner/my-cases/${id}`)
        }
      />

      {/* Session Info */}
      <SessionInfoCard
        date={displaySessionData.date}
        duration={displaySessionData.duration}
        language={displaySessionData.language}
        practitioner={displaySessionData.practitioner}
        consentGiven={sessionData.consentGiven || false}
      />

      {/* Audio Player */}
      <AudioPlayer
        audioUrl={stableAudioUrl}
        isLoading={loadingAudio}
        hasError={!!audioError || audioFetchError}
        audioError={audioError}
        expiresAt={presignedAudio?.audio?.expiresAt}
        onRetry={() => {
          setAudioError(null);
          refetchAudio();
        }}
        onDownload={handleDownload}
      />

      {/* Transcription Section */}
      <TranscriptionSection
        isLoading={loadingTranscript}
        transcriptData={transcriptData}
      />

      {/* SOAP Note Section */}
      <SoapNoteSection
        latestSoapNote={latestSoapNote}
        soapNoteData={soapNoteData}
        isLoading={loadingSoapNotes}
        hasError={soapError}
        onEditClick={() =>
          navigate(`/practitioner/my-cases/${caseId}/session/${sessionId}/edit`)
        }
      />

      {/* Approval Section */}
      <ApprovalSection
        isApprovalConfirmed={approvalConfirmed}
        onApprovalChange={setApprovalConfirmed}
        onApprove={handleApproveSession}
        isApproving={updateSessionMutation.isPending}
        isSessionApproved={sessionData?.status === "Approved"}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessionData={soapNoteData}
      />
    </div>
  );
};
