import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useSessionById, useSessionAudioUrl } from "@/hooks/useSessions";
import { useTranscriptBySession } from "@/hooks/useTranscript";
import { useSoapNotesBySession } from "@/hooks/useSoap";

import WaveSurfer from "wavesurfer.js";
import {
  ChevronLeft,
  Download,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Loader2,
} from "lucide-react";

export const AdminSessionViewPage = () => {
  const { caseId, sessionId } = useParams();
  const navigate = useNavigate();
  const [audioProgress, setAudioProgress] = useState(46);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [duration, setDuration] = useState("00:00:00");
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const location = useLocation();

  const { audioUrl, audioBlob } = location.state || {};

  // Fetch session data from API
  const {
    data: sessionResponse,
    isLoading: loadingSession,
    isError: sessionError,
  } = useSessionById(sessionId);
  const { data: presignedAudio, refetch: refetchAudioUrl } =
    useSessionAudioUrl(sessionId);

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

  const sessionData = sessionResponse?.session || null;
  const transcriptData = transcriptResponse?.data?.transcript || null;

  // Check if transcript 404 (not found)
  const transcriptNotFound =
    transcriptError && (transcriptErrorData as any)?.response?.status === 404;
  const hasTranscriptData = transcriptData && !transcriptError;

  // Get the latest SOAP note
  const latestSoapNote = soapResponse?.soapNotes?.[0] || null;

  // Refetch transcript when sessionId changes
  useEffect(() => {
    if (sessionId) {
      refetchTranscript();
    }
  }, [sessionId, refetchTranscript]);

  // Helper function to parse SOAP content
  const parseSoapData = () => {
    if (!latestSoapNote) {
      return {
        subjective: "Client's information not yet available",
        objective: "Objective information not yet available",
        assessment: "Assessment not yet available",
        plan: "Treatment plan not yet available",
      };
    }

    if (latestSoapNote.content) {
      return {
        subjective: latestSoapNote.content.subjective || "",
        objective: latestSoapNote.content.objective || "",
        assessment: latestSoapNote.content.assessment || "",
        plan: latestSoapNote.content.plan || "",
      };
    }

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
      subjective: "Client's information not yet available",
      objective: "Objective information not yet available",
      assessment: "Assessment not yet available",
      plan: "Treatment plan not yet available",
    };
  };

  const soapNoteData = parseSoapData();

  // Format time helper function
  const formatTime = (seconds: number) => {
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

  // Format transcript timestamp
  const formatTranscriptTimestamp = (timestamp: string | number) => {
    if (typeof timestamp === "number") {
      const hrs = Math.floor(timestamp / 3600);
      const mins = Math.floor((timestamp % 3600) / 60);
      const secs = Math.floor(timestamp % 60);
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    const parts = timestamp.split(":");
    if (parts.length === 3) {
      const firstPart = parseInt(parts[0]);
      if (firstPart > 1000) {
        const totalSeconds = Math.floor(firstPart / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
    }

    return timestamp;
  };

  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#D1D5DB",
      progressColor: "#188aec",
      cursorColor: "#188aec",
      height: 60,
      barWidth: 2,
      barGap: 2,
    });

    const loadPublicAudio = () => {
      console.warn("Falling back to public audio");
      ws.load("/audio/recording.ogg");
    };

    const resolvedAudioUrl =
      (presignedAudio as any)?.audio?.url ||
      (presignedAudio as any)?.url ||
      sessionData?.audioUrl ||
      audioUrl;

    if (audioBlob) {
      try {
        ws.loadBlob(audioBlob);
      } catch (err) {
        console.error("WaveSurfer loadBlob failed, falling back", err);
        if (resolvedAudioUrl) {
          ws.load(resolvedAudioUrl);
        } else {
          loadPublicAudio();
        }
      }
    } else if (resolvedAudioUrl) {
      ws.load(resolvedAudioUrl);
    } else {
      loadPublicAudio();
    }

    ws.on("ready", () => {
      setDuration(formatTime(ws.getDuration()));
    });

    ws.on("audioprocess", () => {
      const time = ws.getCurrentTime();
      const total = ws.getDuration() || 1;
      setCurrentTime(formatTime(time));
      setAudioProgress((time / total) * 100);
    });

    ws.on("error", (err) => {
      console.error("WaveSurfer error:", err);
      refetchAudioUrl()
        .then((r) => {
          const freshUrl = (r.data as any)?.audio?.url || (r.data as any)?.url;
          if (freshUrl) {
            try {
              ws.load(freshUrl);
              return;
            } catch (_) {
              // fallthrough to public audio
            }
          }
          if (resolvedAudioUrl !== "/audio/recording.ogg") {
            loadPublicAudio();
          }
        })
        .catch(() => {
          if (resolvedAudioUrl !== "/audio/recording.ogg") {
            loadPublicAudio();
          }
        });
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
      waveSurferRef.current = null;
    };
  }, [
    audioBlob,
    audioUrl,
    sessionData?.audioUrl,
    (presignedAudio as any)?.audio?.url,
    (presignedAudio as any)?.url,
  ]);

  useEffect(() => {
    return () => {
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, []);

  const handleDownload = () => {
    const resolvedAudioUrl =
      presignedAudio?.url || sessionData?.audioUrl || audioUrl;
    if (!resolvedAudioUrl) return;

    const a = document.createElement("a");
    a.href = resolvedAudioUrl;
    a.download = `session-${sessionId}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Audio control functions
  const handlePlayPause = () => {
    waveSurferRef.current?.playPause();
  };

  const handleSkipBackward = () => {
    const currentTime = waveSurferRef.current?.getCurrentTime() || 0;
    waveSurferRef.current?.seekTo(
      Math.max(
        0,
        (currentTime - 10) / (waveSurferRef.current?.getDuration() || 1),
      ),
    );
  };

  const handleSkipForward = () => {
    const currentTime = waveSurferRef.current?.getCurrentTime() || 0;
    const duration = waveSurferRef.current?.getDuration() || 1;
    waveSurferRef.current?.seekTo(Math.min(1, (currentTime + 10) / duration));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    waveSurferRef.current?.setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      waveSurferRef.current?.setVolume(volume);
      setIsMuted(false);
    } else {
      waveSurferRef.current?.setVolume(0);
      setIsMuted(true);
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
          onClick={() => navigate(`/admin/cases/${caseId}`)}
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
      <Card className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 p-6">
        <div className="flex flex-col items-center sm:items-start gap-3">
          <Link
            to={`/admin/cases/${caseId}`}
            onClick={() => navigate(`/admin/cases/${caseId}`)}
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
      </Card>

      {/* Audio Recording */}
      <Card className="p-6">
        <h2 className="mb-4 text-secondary text-lg sm:text-2xl">
          Audio Recording
        </h2>

        {/* Waveform */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-primary text-sm">
              {currentTime}
            </span>
            <span className="text-accent text-sm">{duration}</span>
          </div>
          <div ref={waveformRef} className="w-full" />
        </div>

        {/* Audio Controls */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={handleSkipBackward}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
            aria-label="Skip backward 10 seconds"
          >
            <SkipBack className="w-5 h-5 text-accent" />
          </button>

          <button
            onClick={handlePlayPause}
            className="flex justify-center items-center bg-primary hover:bg-primary/80 shadow-lg rounded-full w-12 h-12 transition-colors"
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
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="w-5 h-5 text-accent" />
          </button>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={toggleMute}
              className="hover:bg-gray-100 p-1 rounded transition-colors"
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
                className="bg-gray-200 rounded-full w-full h-1 appearance-none cursor-pointer volume-slider"
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

      {/* SOAP Note Section - READ ONLY */}
      <Card className="p-6">
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-secondary text-lg sm:text-2xl">
              Summary Draft - Version {latestSoapNote?.version || "1"}
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
                    ({latestSoapNote.generatedBy}) • Status:{" "}
                    {latestSoapNote.status}
                  </span>
                </>
              ) : (
                "No Summary generated yet"
              )}
            </p>
          </div>
        </div>

        {loadingSoapNotes ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading Summary...</span>
          </div>
        ) : soapError ? (
          <div className="bg-primary/5 p-4 border border-border/10 rounded-lg">
            <p className="text-destructive text-sm">⚠️ Error loading Summary</p>
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
    </div>
  );
};
