import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";
import { AudioStatus } from "@/components/AudioStatus";
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

import {
  ChevronLeft,
  Download,
  Edit,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Delete,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const SessionViewPage = () => {
  const { caseId, sessionId } = useParams();
  const navigate = useNavigate();
  const [audioProgress, setAudioProgress] = useState(0);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [duration, setDuration] = useState("00:00:00");
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();

  const qc = useQueryClient();

  const { audioUrl, audioBlob } = location.state || {};

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
    isError: transcriptError,
    error: transcriptErrorData,
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
  console.log("sessionResponse", sessionResponse);
  console.log("presignedAudio RAW:", presignedAudio);
  const transcriptData = transcriptResponse?.data?.transcript || null;
  console.log("transcriptResponse", transcriptData);

  // Check if transcript 404 (not found) - treat as "not available yet" not as error
  const transcriptNotFound =
    transcriptError && (transcriptErrorData as any)?.response?.status === 404;
  const hasTranscriptData = transcriptData && !transcriptError;

  // Get the latest SOAP note (first one since they're sorted by version desc)
  const latestSoapNote = soapResponse?.soapNotes?.[0] || null;

  // Refetch transcript when sessionId changes
  useEffect(() => {
    if (sessionId) {
      console.log(
        "[SessionViewPage] Refetching transcript for sessionId:",
        sessionId,
      );
      refetchTranscript();
    }
  }, [sessionId, refetchTranscript]);

  // Helper function to parse SOAP content - handles both direct content and contentText fallback
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

  // Format time helper function
  const formatTime = (seconds: number) => {
    // Handle invalid or infinite values
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "00:00:00";
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  // Format transcript timestamp to readable format
  const formatTranscriptTimestamp = (timestamp: string | number) => {
    if (typeof timestamp === "number") {
      // If it's a number, assume it's seconds
      const hrs = Math.floor(timestamp / 3600);
      const mins = Math.floor((timestamp % 3600) / 60);
      const secs = Math.floor(timestamp % 60);
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // If it's already a string, try to parse it
    const parts = timestamp.split(":");
    if (parts.length === 3) {
      // Check if first part is very large (milliseconds or similar)
      const firstPart = parseInt(parts[0]);
      if (firstPart > 1000) {
        // Likely milliseconds, convert to seconds
        const totalSeconds = Math.floor(firstPart / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
    }

    // Return as-is if already formatted
    return timestamp;
  };

  // Stable reference for audio URL to prevent infinite re-renders
  // Priority: 1) Fresh presigned URL from API, 2) Blob from navigation (just recorded)
  const stableAudioUrl = useMemo(() => {
    console.log("[stableAudioUrl] presignedAudio structure:", presignedAudio);
    console.log("[stableAudioUrl] audioUrl from nav:", audioUrl);

    // Backend returns: { success: true, message: "...", audio: { url, key, expiresIn, expiresAt } }
    let presignedUrl = null;

    if (presignedAudio) {
      // Try different possible structures
      presignedUrl =
        (presignedAudio as any)?.audio?.url || // Direct response: { audio: { url } }
        (presignedAudio as any)?.data?.audio?.url || // Wrapped: { data: { audio: { url } } }
        (presignedAudio as any)?.data?.url || // Alternative: { data: { url } }
        (presignedAudio as any)?.url; // Flat: { url }
    }

    console.log("[stableAudioUrl] presignedUrl extracted:", presignedUrl);

    if (presignedUrl) {
      return presignedUrl;
    }

    // Fallback to blob URL from navigation state (only available immediately after recording)
    if (audioUrl) {
      return audioUrl;
    }

    console.log("[stableAudioUrl] No URL found, returning null");
    return null;
  }, [presignedAudio, audioUrl]);

  // Auto-refresh audio URL when it's about to expire (every 90 minutes)
  useEffect(() => {
    if (!sessionId || !presignedAudio?.audio?.expiresAt) return;

    const expiresAt = new Date(presignedAudio.audio.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh 10 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 10 * 60 * 1000, 60000); // At least 1 minute

    if (refreshTime > 0) {
      console.log(
        `[Audio URL] Will refresh in ${Math.round(refreshTime / 60000)} minutes`,
      );
      const timer = setTimeout(() => {
        console.log("[Audio URL] Refreshing expired presigned URL");
        refetchAudio();
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [presignedAudio, sessionId, refetchAudio]);

  // Setup audio element when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stableAudioUrl) return;

    console.log(
      "[Audio] Setting up audio element with URL:",
      stableAudioUrl.substring(0, 80) + "...",
    );

    // Set audio source
    audio.src = stableAudioUrl;
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.volume = volume;

    // Audio event handlers
    const handleLoadedMetadata = () => {
      console.log("[Audio] Metadata loaded - duration:", audio.duration);
      setDuration(formatTime(audio.duration));
      setCurrentTime("00:00:00");
      setAudioProgress(0);
      setAudioError(null);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      const total = audio.duration || 1;
      setCurrentTime(formatTime(time));
      setAudioProgress((time / total) * 100);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTime("00:00:00");
    };

    const handleError = (e: Event) => {
      console.error("[Audio] Playback error:", e);
      const target = e.target as HTMLAudioElement;
      const error = target.error;

      if (error) {
        let errorMessage = "Audio playback failed";
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Audio playback was aborted";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error occurred while loading audio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio format not supported by browser";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio source not supported";
            break;
        }
        setAudioError(errorMessage);
      }
    };

    const handleCanPlay = () => {
      console.log("[Audio] Audio can start playing");
      setAudioError(null);
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    // Load the audio
    audio.load();

    return () => {
      // Cleanup event listeners
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [stableAudioUrl, volume]);

  const handleDownload = () => {
    const resolvedAudioUrl = stableAudioUrl || sessionData?.audioUrl;
    if (!resolvedAudioUrl) {
      console.warn("[Download] No audio URL available");
      return;
    }

    console.log(
      "[Download] Downloading audio from:",
      resolvedAudioUrl.substring(0, 80) + "...",
    );

    const a = document.createElement("a");
    a.href = resolvedAudioUrl;
    a.download = `session-${sessionId}-${sessionData?.sessionNumber || "recording"}.webm`;
    a.target = "_blank"; // Open in new tab for S3 URLs
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Audio control functions
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("[Audio] Play failed:", err);
        setAudioError("Failed to play audio. Please try again.");
      });
    }
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }

    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audio.duration;

    audio.currentTime = newTime;
  };

  console.log(
    "caseId:",
    caseId,
    "sessionId:",
    sessionId,
    "audioProgress:",
    audioProgress,
    "setAudioProgress:",
    setAudioProgress,
  );

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
      ? `${sessionData.case.internalRef} (${sessionData.case.displayName})`
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
      <Card className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 p-6">
        <div className="flex flex-col items-center sm:items-start gap-3">
          <Link
            to={`/practitioner/my-cases/${caseId}`}
            onClick={() => navigate(`/practitioner/my-cases/${caseId}`)}
            className="flex items-center gap-2 mr-auto mb-4 text-accent hover:text-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Case Timeline</span>
          </Link>

          <div className="flex items-center">
            <h1 className="font-medium text-secondary text-xl sm:text-2xl">
              Session {displaySessionData.sessionNumber} -{" "}
              {displaySessionData.date}
            </h1>
            <span
              className={`ml-1 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                statusInfo?.color === "green"
                  ? "bg-ring/10 text-ring"
                  : "bg-[#F2933911] text-[#F29339]"
              }`}
            >
              {statusInfo?.color === "green" && (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {statusInfo?.label}
            </span>
          </div>

          <p className="text-accent text-sm">{displaySessionData.case}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            className="flex items-center gap-2 text-white"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            onClick={handleDeleteSession}
            disabled={deleteSessionMutation.isPending}
            variant="link"
            className="flex items-center gap-2"
          >
            {deleteSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Delete className="w-4 h-4" />
            )}
            Delete Session
          </Button>
          <Button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 bg-[#7657FF] hover:bg-[#5e42cc] text-white"
          >
            Chat
          </Button>
        </div>
      </Card>

      {/* Session Info */}
      <Card className="bg-primary/5 p-6">
        <h2 className="mb-1 text-secondary text-lg">SESSION INFORMATION</h2>
        <div className="gap-x-6 gap-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          <div className="">
            <p className="text-accent text-sm">Date</p>
            <h2 className="text-secondary text-xl">
              {displaySessionData.date}
            </h2>
          </div>
          <div className="">
            <p className="text-accent text-sm">Duration</p>
            <h2 className="text-secondary text-xl">
              {displaySessionData.duration}
            </h2>
          </div>
          <div className="">
            <p className="text-accent text-sm">Language</p>
            <h2 className="text-secondary text-xl">
              {displaySessionData.language}
            </h2>
          </div>
          <div className="">
            <p className="text-accent text-sm">Conducted by</p>
            <h2 className="text-secondary text-xl">
              {displaySessionData.practitioner}
            </h2>
          </div>
          <div className="">
            <p className="text-accent text-sm">Consent</p>
            <h2 className="text-secondary text-xl">
              {sessionData.consentGiven ? "✓ Given" : "✗ Not Given"}
            </h2>
          </div>
        </div>
        {/* <div className="mt-3 pt-3 border-blue-200 border-t">
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Approved by:</span>{" "}
            {sessionData.approvedBy} on {sessionData.approvedDate}
          </p>
        </div> */}
      </Card>

      {/* Audio Recording */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-secondary text-lg sm:text-2xl">
            Audio Recording
          </h2>
          <AudioStatus
            isLoading={loadingAudio}
            hasError={!!audioError || audioFetchError}
            hasAudio={!!stableAudioUrl}
            expiresAt={presignedAudio?.audio?.expiresAt}
            onRetry={() => {
              setAudioError(null);
              refetchAudio();
            }}
          />
        </div>

        {/* Audio Loading State */}
        {loadingAudio && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading audio...</span>
          </div>
        )}

        {/* Audio Error State */}
        {(audioError || audioFetchError) && !loadingAudio && (
          <div className="bg-red-50 mb-4 p-4 border border-red-200 rounded-lg">
            <p className="mb-2 text-red-700 text-sm">⚠️ Audio Playback Error</p>
            <p className="mb-3 text-red-600 text-xs">
              {audioError || "Unable to load audio file"}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setAudioError(null);
                  refetchAudio();
                }}
                size="sm"
                variant="outline"
                className="hover:bg-red-50 border-red-300 text-red-700"
              >
                Try Again
              </Button>
              {stableAudioUrl && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                  className="hover:bg-blue-50 border-blue-300 text-blue-700"
                >
                  Download Audio
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Audio Player - Simple HTML5 Audio */}
        {(stableAudioUrl || loadingAudio) &&
          !audioError &&
          !audioFetchError && (
            <>
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                crossOrigin="anonymous"
                preload="metadata"
                style={{ display: "none" }}
              />

              {/* Custom Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-primary text-sm">
                    {currentTime}
                  </span>
                  <span className="text-accent text-sm">{duration}</span>
                </div>

                {/* Progress Bar */}
                <div
                  className="bg-gray-200 hover:bg-gray-300 rounded-full w-full h-2 transition-colors cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="bg-primary rounded-full h-full transition-all duration-100 ease-out"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={handleSkipBackward}
                  disabled={!stableAudioUrl}
                  className="hover:bg-gray-100 disabled:opacity-50 p-2 rounded-full transition-colors disabled:cursor-not-allowed"
                  aria-label="Skip backward 10 seconds"
                >
                  <SkipBack className="w-5 h-5 text-accent" />
                </button>

                <button
                  onClick={handlePlayPause}
                  disabled={!stableAudioUrl}
                  className="flex justify-center items-center bg-primary hover:bg-primary/80 disabled:opacity-50 shadow-lg rounded-full w-12 h-12 transition-colors disabled:cursor-not-allowed"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="fill-white w-6 h-6 text-white" />
                  ) : (
                    <Play className="fill-white w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={handleSkipForward}
                  disabled={!stableAudioUrl}
                  className="hover:bg-gray-100 disabled:opacity-50 p-2 rounded-full transition-colors disabled:cursor-not-allowed"
                  aria-label="Skip forward 10 seconds"
                >
                  <SkipForward className="w-5 h-5 text-accent" />
                </button>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={toggleMute}
                    disabled={!stableAudioUrl}
                    className="hover:bg-gray-100 disabled:opacity-50 p-1 rounded transition-colors disabled:cursor-not-allowed"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    <Volume2
                      className={`w-5 h-5 ${
                        isMuted ? "text-gray-400" : "text-accent"
                      }`}
                    />
                  </button>
                  <div className="relative w-24">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      disabled={!stableAudioUrl}
                      className="bg-gray-200 disabled:opacity-50 rounded-full w-full h-1 appearance-none cursor-pointer disabled:cursor-not-allowed volume-slider"
                      style={{
                        background: `linear-gradient(to right, #188aec 0%, #188aec ${
                          (isMuted ? 0 : volume) * 100
                        }%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`,
                      }}
                      aria-label="Volume control"
                    />
                    <style>{`
                    .volume-slider::-webkit-slider-thumb {
                      appearance: none;
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      background: #188aec;
                      cursor: pointer;
                    }
                    .volume-slider::-moz-range-thumb {
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      background: #188aec;
                      cursor: pointer;
                      border: none;
                    }
                  `}</style>
                  </div>
                </div>
              </div>
            </>
          )}

        {/* Standard HTML5 Audio Fallback - Show when there are errors */}
        {(audioError || audioFetchError) && stableAudioUrl && (
          <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
            <p className="mb-3 text-blue-700 text-sm">
              Using standard audio player
            </p>
            <audio
              controls
              className="w-full"
              crossOrigin="anonymous"
              preload="metadata"
            >
              <source src={stableAudioUrl} type="audio/webm" />
              <source src={stableAudioUrl} type="audio/mpeg" />
              <source src={stableAudioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* No Audio Available */}
        {!stableAudioUrl &&
          !loadingAudio &&
          !audioError &&
          !audioFetchError && (
            <div className="bg-gray-50 p-8 border border-gray-200 rounded-lg text-center">
              <p className="mb-2 text-gray-600">No audio recording available</p>
              <p className="text-gray-500 text-sm">
                This session doesn't have an audio recording yet.
              </p>
            </div>
          )}
      </Card>

      {/* Transcription Section */}
      <Card className="p-6">
        <h2 className="text-secondary text-lg sm:text-2xl">Transcription</h2>

        {loadingTranscript ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading transcript...</span>
          </div>
        ) : hasTranscriptData ? (
          <div className="space-y-4">
            {/* Transcript Segments */}
            <div className="space-y-3 bg-primary/5 p-4 rounded-lg max-h-96 overflow-y-auto text-accent text-sm leading-relaxed">
              {transcriptData.segments && transcriptData.segments.length > 0 ? (
                transcriptData.segments.map((segment: any, index: number) => (
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

            {/* Transcript Metadata */}
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 pt-4 border-t">
              <div className="space-y-1 text-accent text-xs">
                <p className="font-medium text-secondary">
                  Transcript Details:
                </p>
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

      {/* SOAP Note Section */}
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
                    {/* {displaySessionData.status} */}(
                    {latestSoapNote.generatedBy}) • Status:{" "}
                    {latestSoapNote.status}
                  </span>
                </>
              ) : (
                "No SOAP note generated yet"
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              className="flex items-center gap-2 bg-destructive/10 border-destructive/20 text-destructive"
            >
              <History className="w-4 h-4" />
              View History
            </Button> */}
            <Button
              onClick={() =>
                navigate(
                  `/practitioner/my-cases/${caseId}/session/${sessionId}/edit`,
                )
              }
              variant="link"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Note
            </Button>
          </div>
        </div>

        {loadingSoapNotes ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading SOAP note...</span>
          </div>
        ) : soapError ? (
          <div className="bg-primary/5 p-4 border border-border/10 rounded-lg">
            <p className="text-destructive text-sm">
              ⚠️ Error loading SOAP note
            </p>
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

      {/* Approval Section */}
      <Card className="p-6">
        <h2 className="text-secondary text-lg sm:text-2xl">Approval</h2>
        <p className="text-accent text-sm">
          Please review the transcript and SOAP note carefully before approving.
          Once approved, this becomes the official clinical record.
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={approvalConfirmed}
              onChange={() => setApprovalConfirmed(!approvalConfirmed)}
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
          {/* <Button
            onClick={() =>
              navigate(
                `/practitioner/my-cases/${caseId}/session/${sessionId}/edit`
              )
            }
            variant="outline"
            className="flex items-center gap-2 bg-[#9284FF22] border-[#9284FF] text-[#9284FF]"
          >
            <Edit className="w-4 h-4" />
            Edit Note
          </Button> */}
          <Button
            onClick={handleApproveSession}
            disabled={
              !approvalConfirmed ||
              updateSessionMutation.isPending ||
              sessionData?.status === "Approved"
            }
            className={`${
              !approvalConfirmed ||
              updateSessionMutation.isPending ||
              sessionData?.status === "Approved"
                ? "bg-primary/30 cursor-not-allowed"
                : "bg-primary hover:bg-primary/80"
            } text-white`}
          >
            {updateSessionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : sessionData?.status === "Approved" ? (
              "✓ Session Approved"
            ) : (
              "Approve Session"
            )}
          </Button>
        </div>
      </Card>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessionData={soapNoteData}
      />
    </div>
  );
};
