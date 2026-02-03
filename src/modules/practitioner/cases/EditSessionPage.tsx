import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Sparkles, Loader2 } from "lucide-react";
import {
  useSoapNotesBySession,
  useUpdateSoapNote,
  useGenerateSoapNote,
} from "@/hooks/useSoap";
import { useTranscriptBySession } from "@/hooks/useTranscript";
import Swal from "sweetalert2";

export const EditSessionPage = () => {
  const { caseId, sessionId } = useParams();
  const navigate = useNavigate();

  // Fetch SOAP notes and transcript
  const {
    data: soapResponse,
    isLoading: loadingSoapNotes,
    isError: soapError,
  } = useSoapNotesBySession(sessionId);

  const {
    data: transcriptResponse,
    isLoading: loadingTranscript,
    isError: transcriptError,
    error: transcriptErrorData,
  } = useTranscriptBySession(sessionId);

  const updateSoapNoteMutation = useUpdateSoapNote();
  const generateSoapNoteMutation = useGenerateSoapNote();

  // Get the latest SOAP note
  const latestSoapNote = soapResponse?.soapNotes?.[0] || null;
  const transcriptData = transcriptResponse?.data?.transcript || null;

  // Check if transcript 404 (not found) - treat as "not available yet" not as error
  const transcriptNotFound =
    transcriptError && (transcriptErrorData as any)?.response?.status === 404;
  const hasTranscriptData = transcriptData && !transcriptError;

  // Initialize SOAP note state with default placeholder text
  const [soapNote, setSoapNote] = useState({
    subjective: "Patient information not yet available",
    objective: "Objective information not yet available",
    assessment: "Assessment not yet available",
    plan: "Treatment plan not yet available",
    summary: "",
  });

  const [hasEdits, setHasEdits] = useState({
    subjective: false,
    objective: false,
    assessment: false,
    plan: false,
    summary: false,
  });

  const [showTranscript, setShowTranscript] = useState(false);

  const MAX_CHARS = 2000;

  // Initialize form with API data when SOAP note is loaded
  useEffect(() => {
    if (latestSoapNote?.content) {
      let parsedContent = latestSoapNote.content;

      // If content has nested JSON strings, try to parse
      if (
        typeof latestSoapNote.content?.subjective === "string" &&
        latestSoapNote.content.subjective.includes("subjective")
      ) {
        try {
          parsedContent = JSON.parse(latestSoapNote.content.subjective);
        } catch (e) {
          // Fallback to parsing contentText
          if (latestSoapNote.contentText) {
            parsedContent = parseContentText(latestSoapNote.contentText);
          }
        }
      }

      setSoapNote({
        subjective: parsedContent.subjective || "",
        objective: parsedContent.objective || "",
        assessment: parsedContent.assessment || "",
        plan: parsedContent.plan || "",
        summary: parsedContent.summary || "",
      });
    }
  }, [latestSoapNote]);

  // Helper to parse contentText
  const parseContentText = (contentText: string) => {
    const lines = contentText.split("\n");
    const result = {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      summary: "",
    };

    let currentSection = "";
    let currentText = "";

    for (const line of lines) {
      if (line.includes("S (Subjective):")) {
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
      } else if (line.includes("Summary:") || line.includes("SUMMARY:")) {
        if (currentSection) result[currentSection] = currentText.trim();
        currentSection = "summary";
        currentText = "";
      } else if (currentSection) {
        currentText += (currentText ? "\n" : "") + line;
      }
    }

    if (currentSection) result[currentSection] = currentText.trim();
    return result;
  };

  const handleChange = (section: keyof typeof soapNote, value: string) => {
    if (value.length <= MAX_CHARS) {
      setSoapNote((prev) => ({ ...prev, [section]: value }));
      setHasEdits((prev) => ({ ...prev, [section]: true }));
    }
  };

  const handleSave = async () => {
    try {
      // If no existing SOAP note, create a new one
      if (!latestSoapNote?._id) {
        let transcriptTextForSoap = "";
        if (transcriptData?.segments && transcriptData.segments.length > 0) {
          transcriptTextForSoap = transcriptData.segments
            .map((seg: any) => seg.text)
            .join("\n");
        } else if (transcriptData?.rawText) {
          transcriptTextForSoap = transcriptData.rawText;
        }

        await generateSoapNoteMutation.mutateAsync({
          sessionId: sessionId!,
          transcriptText: transcriptTextForSoap || undefined,
          manualContent: {
            subjective: soapNote.subjective,
            objective: soapNote.objective,
            assessment: soapNote.assessment,
            plan: soapNote.plan,
            summary: soapNote.summary,
          },
        });
      } else {
        // Update existing SOAP note
        await updateSoapNoteMutation.mutateAsync({
          soapId: latestSoapNote._id,
          data: {
            content: {
              subjective: soapNote.subjective,
              objective: soapNote.objective,
              assessment: soapNote.assessment,
              plan: soapNote.plan,
              summary: soapNote.summary,
            },
            contentText: formatContentText(soapNote),
            status: "Draft",
          },
        });
      }

      Swal.fire({
        title: "Success!",
        text: "SOAP note draft saved successfully.",
        icon: "success",
        confirmButtonColor: "#188aec",
      });

      navigate(`/practitioner/my-cases/${caseId}/session/${sessionId}`);
    } catch (error) {
      console.error("Failed to save SOAP note:", error);
      Swal.fire({
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save SOAP note. Please try again.",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
    }
  };

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

  const formatContentText = (content: typeof soapNote) => {
    const sections = [
      { label: "S (Subjective)", value: content.subjective },
      { label: "O (Objective)", value: content.objective },
      { label: "A (Assessment)", value: content.assessment },
      { label: "P (Plan)", value: content.plan },
      { label: "Summary", value: content.summary },
    ];

    return sections
      .filter((section) => section.value)
      .map((section) => `${section.label}:\n${section.value}`)
      .join("\n\n");
  };

  const handleRegenerateWithAI = async () => {
    if (!sessionId || !hasTranscriptData) {
      Swal.fire({
        title: "Error",
        text: "Transcript not found. Cannot regenerate SOAP note.",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Regenerate SOAP Note?",
      text: "This will generate a new SOAP note using AI. Your current unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#188aec",
      cancelButtonColor: "#ff0105",
      confirmButtonText: "Yes, Regenerate",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    // Show loading dialog
    Swal.fire({
      title: "Regenerating SOAP Note...",
      text: "Please wait while AI generates a new SOAP note from the transcript.",
      icon: "info",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();

        try {
          // Build transcript text from segments
          let transcriptTextForSoap = "";
          if (transcriptData.segments && transcriptData.segments.length > 0) {
            transcriptTextForSoap = transcriptData.segments
              .map(
                (seg: any) => `[${seg.timestamp}] ${seg.speaker}: ${seg.text}`,
              )
              .join("\n");
          } else if (transcriptData.rawText) {
            transcriptTextForSoap = transcriptData.rawText;
          }

          if (!transcriptTextForSoap) {
            throw new Error("No transcript content available");
          }

          // Generate SOAP note
          await generateSoapNoteMutation.mutateAsync({
            sessionId,
            transcriptText: transcriptTextForSoap,
          });

          Swal.fire({
            title: "Success!",
            text: "SOAP note has been regenerated successfully.",
            icon: "success",
            confirmButtonColor: "#188aec",
          });
        } catch (error) {
          console.error("Failed to regenerate SOAP note:", error);
          Swal.fire({
            title: "Error",
            text:
              error instanceof Error
                ? error.message
                : "Failed to regenerate SOAP note. Please try again.",
            icon: "error",
            confirmButtonColor: "#188aec",
          });
        }
      },
    });
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Loading State */}
      {loadingSoapNotes && (
        <Card className="p-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-2 text-accent">Loading SOAP note...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {soapError && !latestSoapNote && (
        <Card className="bg-amber-50 p-6 border border-amber-200">
          <p className="text-amber-700">
            No SOAP note found yet. You can manually create one below or
            generate it with AI.
          </p>
        </Card>
      )}

      {!loadingSoapNotes && (
        <>
          {/* Approved Note Warning */}
          {/* {latestSoapNote?.status === "Approved" && (
            <Card className="bg-red-50 p-6 border border-red-200">
              <div className="flex items-start gap-3">
                <span className="text-destructive text-2xl">🔒</span>
                <div>
                  <h3 className="mb-1 font-semibold text-destructive">
                    Cannot Edit Approved Note
                  </h3>
                  <p className="mb-3 text-destructive text-sm">
                    This SOAP note has been approved and cannot be edited. To
                    make changes, you need to create a new version instead.
                  </p>
                  <Link
                    to={`/practitioner/my-cases/${caseId}/session/${sessionId}`}
                    className="font-medium text-destructive hover:text-destructive/80 text-sm underline"
                  >
                    Go back to session
                  </Link>
                </div>
              </div>
            </Card>
          )} */}

          {/* Header */}
          <Card className="p-6">
            <Link
              to={`/practitioner/my-cases/${caseId}/session/${sessionId}`}
              className="flex items-center gap-2 mr-auto text-accent hover:text-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Session</span>
            </Link>

            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
              <div className="flex items-center gap-3">
                <h1 className="font-medium text-secondary text-lg sm:text-2xl">
                  {latestSoapNote
                    ? `Edit SOAP Note - Version ${latestSoapNote.version}`
                    : "Create SOAP Note"}
                </h1>
                {latestSoapNote && (
                  <span className="px-3 py-1 rounded-full bg-ring/10 text-ring text-xs">
                    {latestSoapNote.status}
                  </span>
                )}
              </div>
            </div>

            {latestSoapNote && (
              <p className="text-accent text-sm">
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
                • By {latestSoapNote.generatedBy}
              </p>
            )}

            <div className="flex sm:flex-row flex-col sm:items-center gap-2 mt-3">
              <div className="flex items-center bg-[#F2933911] p-2 rounded-lg text-[#F29339] text-sm">
                <span className="">⚠</span>
                <p className="ml-1 text-xs">
                  {latestSoapNote
                    ? "Editing will create a new version. Previous versions are preserved."
                    : "You can manually create a SOAP note or use AI to generate one from the transcript."}
                </p>
              </div>

              {latestSoapNote?.status === "Approved" ? (
                <div className="flex items-center bg-red-50 p-2 border border-red-200 rounded-lg text-red-600 text-sm">
                  <span className="">🔒</span>
                  <p className="ml-1 text-xs">
                    This note is approved and locked. You cannot make changes
                    now.
                  </p>
                </div>
              ) : !latestSoapNote ? (
                <div className="flex items-center bg-blue-50 p-2 border border-blue-200 rounded-lg text-blue-600 text-sm">
                  <span className="">💡</span>
                  <p className="ml-1 text-xs">
                    You can edit the placeholder text above and use "Regenerate
                    with AI" to create an AI-generated SOAP note.
                  </p>
                </div>
              ) : (
                <div className="flex items-center bg-[#F2933911] p-2 rounded-lg text-[#F29339] text-sm">
                  <span className="">⚠</span>
                  <p className="ml-1 text-xs">
                    Note: Saving will update the current version. You can
                    approve after saving.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Action Links */}
          <div className="flex flex-wrap gap-4 text-sm">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              {showTranscript ? "Hide" : "View"} Transcript
            </button>

            {latestSoapNote?.status !== "Approved" && (
              <button
                onClick={handleRegenerateWithAI}
                disabled={
                  loadingTranscript ||
                  !hasTranscriptData ||
                  generateSoapNoteMutation.isPending
                }
                className="flex items-center gap-2 disabled:opacity-50 text-accent hover:text-secondary cursor-pointer disabled:cursor-not-allowed"
              >
                {generateSoapNoteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Regenerate with AI
                  </>
                )}
              </button>
            )}
          </div>

          {/* Transcript Section */}
          {showTranscript && (
            <Card className="bg-primary/5 p-6">
              <h2 className="mb-4 text-secondary text-lg sm:text-2xl">
                Transcript
              </h2>

              {loadingTranscript ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-2 text-accent">
                    Loading transcript...
                  </span>
                </div>
              ) : hasTranscriptData ? (
                <div className="space-y-3 bg-white p-4 rounded-lg max-h-96 overflow-y-auto text-accent text-sm leading-relaxed">
                  {transcriptData.segments &&
                  transcriptData.segments.length > 0 ? (
                    transcriptData.segments.map(
                      (segment: any, index: number) => (
                        <div
                          key={segment.id || index}
                          className="pb-3 border-b last:border-b-0 max-h-96 overflow-y-auto"
                        >
                          <div className="flex items-start gap-2">
                            <span className="min-w-fit font-semibold text-primary">
                              {/* [{segment.timestamp}] */}[
                              {formatTranscriptTimestamp(segment.timestamp)}]
                            </span>
                            <div className="flex-1">
                              <span className="font-medium text-secondary">
                                {segment.speaker}:
                              </span>
                              <p className="mt-1 text-accent">{segment.text}</p>
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-accent italic">
                      {transcriptData.rawText}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-white p-4 rounded-lg text-accent text-sm leading-relaxed">
                  <p className="py-4 text-center italic">
                    No transcript found. Transcription was not enabled or not
                    found.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* <Card className="p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-secondary text-lg sm:text-2xl">
                S (SUBJECTIVE){" "}
                <span className="text-accent text-sm">
                  - What the patient reported
                </span>
              </h2>
              {hasEdits.subjective && (
                <span className="px-2 py-1 rounded text-[#F29339] text-sm">
                  ⚠ EDITED
                </span>
              )}
            </div>

            <textarea
              disabled={latestSoapNote?.status === "Approved"}
              value={soapNote.subjective}
              onChange={(e) => handleChange("subjective", e.target.value)}
              className="bg-primary/5 disabled:opacity-60 px-3 py-2 border border-primary/20 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-30 text-secondary text-sm disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-accent text-xs">
              Characters: {soapNote.subjective.length} / {MAX_CHARS}
            </p>
          </Card>

          <Card className="p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-secondary text-lg sm:text-2xl">
                O (OBJECTIVE){" "}
                <span className="text-accent text-sm">
                  - Observable behaviors and presentation
                </span>
              </h2>
              {hasEdits.objective && (
                <span className="px-2 py-1 rounded text-[#F29339] text-sm">
                  ⚠ EDITED
                </span>
              )}
            </div>

            <textarea
              disabled={latestSoapNote?.status === "Approved"}
              value={soapNote.objective}
              onChange={(e) => handleChange("objective", e.target.value)}
              className="bg-primary/5 disabled:opacity-60 px-3 py-2 border border-primary/20 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-30 text-secondary text-sm disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-accent text-xs">
              Characters: {soapNote.objective.length} / {MAX_CHARS}
            </p>
          </Card>

          <Card className="p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-secondary text-lg sm:text-2xl">
                A (ASSESSMENT){" "}
                <span className="text-accent text-sm">
                  - Clinical analysis and diagnosis
                </span>
              </h2>
              {hasEdits.assessment && (
                <span className="px-2 py-1 rounded text-[#F29339] text-sm">
                  ⚠ EDITED
                </span>
              )}
            </div>

            <textarea
              disabled={latestSoapNote?.status === "Approved"}
              value={soapNote.assessment}
              onChange={(e) => handleChange("assessment", e.target.value)}
              className="bg-primary/5 disabled:opacity-60 px-3 py-2 border border-primary/20 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-30 text-secondary text-sm disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-accent text-xs">
              Characters: {soapNote.assessment.length} / {MAX_CHARS}
            </p>
          </Card>

          <Card className="p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-secondary text-lg sm:text-2xl">
                P (PLAN){" "}
                <span className="text-accent text-sm">
                  - Treatment plan and next steps
                </span>
              </h2>
              {hasEdits.plan && (
                <span className="px-2 py-1 rounded text-[#F29339] text-sm">
                  ⚠ EDITED
                </span>
              )}
            </div>

            <textarea
              disabled={latestSoapNote?.status === "Approved"}
              value={soapNote.plan}
              onChange={(e) => handleChange("plan", e.target.value)}
              className="bg-primary/5 disabled:opacity-60 px-3 py-2 border border-primary/20 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-30 text-secondary text-sm disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-accent text-xs">
              Characters: {soapNote.plan.length} / {MAX_CHARS}
            </p>
          </Card> */}

          {/* SUMMARY SECTION */}
          <Card className="p-6 border border-primary/20">
            <div className="flex justify-between items-center mb-3">
              <h2 className="flex flex-col gap-1 font-bold text-secondary text-lg sm:text-2xl">
                SUMMARY
                <span className="text-accent text-sm">
                  - Overall summary of the session
                </span>
              </h2>
              {hasEdits.summary && (
                <span className="px-2 py-1 rounded text-[#F29339] text-sm">
                  ⚠ EDITED
                </span>
              )}
            </div>

            <textarea
              disabled={latestSoapNote?.status === "Approved"}
              value={soapNote.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="AI-generated summary will appear here..."
              className="bg-primary/5 disabled:opacity-60 px-3 py-2 border border-primary/20 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full min-h-30 text-secondary text-sm disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-accent text-xs">
              Characters: {soapNote.summary.length} / {MAX_CHARS}
            </p>
          </Card>

          {/* VERSION HISTORY */}
          {latestSoapNote && (
            <Card className="p-6 border border-primary/20">
              <h2 className="mb-3 text-secondary text-lg sm:text-2xl">
                VERSION HISTORY
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-accent">
                  <span className="font-semibold">Current:</span> Version{" "}
                  {latestSoapNote?.version} ({latestSoapNote?.status} - In
                  Progress)
                </p>
                <p className="text-accent">
                  <span className="font-semibold">Generated:</span>{" "}
                  {latestSoapNote
                    ? new Date(latestSoapNote.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "N/A"}{" "}
                  - {latestSoapNote?.generatedBy || "AI"}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="link"
              onClick={() =>
                navigate(
                  `/practitioner/my-cases/${caseId}/session/${sessionId}`,
                )
              }
              className=""
            >
              {latestSoapNote?.status === "Approved"
                ? "Back to Session"
                : "Cancel"}
            </Button>
            {latestSoapNote?.status !== "Approved" && (
              <Button
                onClick={handleSave}
                disabled={
                  updateSoapNoteMutation.isPending ||
                  generateSoapNoteMutation.isPending
                }
                className="text-white"
              >
                {updateSoapNoteMutation.isPending ||
                generateSoapNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Draft"
                )}
              </Button>
            )}
          </div>

          {/* Bottom Note */}
        </>
      )}
    </div>
  );
};
