import { useState } from "react";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
// import type RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  Mic,
  ChevronDown,
  Square,
  Triangle,
  Pause,
  Loader2,
} from "lucide-react";
import {
  useCreateSession,
  useStartRecording,
  useStopRecording,
  useUploadRecording,
} from "@/hooks/useSessions";
import { useCreateTranscript } from "@/hooks/useTranscript";
import { useTranscription } from "@/hooks/useTranscription";
import { useGenerateSoapNote } from "@/hooks/useSoap";
import {
  resampleAudio,
  validatePCMBuffer,
  logAudioStats,
} from "@/utils/audioUtils";

export const RecordSessionPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  // 2-hour recording limit in seconds (120 minutes * 60)
  const RECORDING_TIME_LIMIT = 2 * 60 * 60;

  const formatBytesToMb = (bytes: number) =>
    `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [sessionDate, setSessionDate] = useState(getCurrentDate());
  const [sessionLanguage, setSessionLanguage] = useState("english");
  const [patientSignature, setPatientSignature] = useState("");
  const [consentDate, setConsentDate] = useState(getCurrentDate());
  const [consent, setConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00:00");
  const [piiMasking, setPiiMasking] = useState("on");
  const [piiMaskingEnabled, setPiiMaskingEnabled] = useState(true);
  // const [advancedLanguage, setAdvancedLanguage] = useState("english");
  const [allowTranscript, setAllowTranscript] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState("0.00 MB");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // API hooks
  const createSessionMutation = useCreateSession();
  const startRecordingMutation = useStartRecording();
  const stopRecordingMutation = useStopRecording();
  const uploadRecordingMutation = useUploadRecording();
  const createTranscriptMutation = useCreateTranscript();
  const generateSoapNoteMutation = useGenerateSoapNote();

  // Transcription hook
  const {
    transcriptEntries,
    currentPartialTranscript,
    isConnected: isTranscriptionConnected,
    error: transcriptionError,
    connect: connectTranscription,
    disconnect: disconnectTranscription,
    sendAudioChunk,
  } = useTranscription();

  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  console.log("recordedBlob", recordedBlob);
  // const recordPluginRef = useRef<any>(null);
  const recordPluginRef = useRef<ReturnType<typeof RecordPlugin.create> | null>(
    null,
  );

  // const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const pauseStartTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#c7d2fe",
      progressColor: "#188aec",
      cursorColor: "#188aec",
      height: 80,
      barWidth: 3,
      barGap: 2,
      normalize: true,
    });

    const record = waveSurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      }),
    );

    record.on("record-end", (blob: Blob) => {
      console.log("Recorded blob:", blob);
      setRecordedBlob(blob);
      // TODO: upload blob / save session
    });

    waveSurferRef.current = waveSurfer;
    recordPluginRef.current = record;

    return () => {
      waveSurfer.destroy();
    };
  }, []);

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      elapsedSecondsRef.current++;
      const m = String(Math.floor(elapsedSecondsRef.current / 60)).padStart(
        2,
        "0",
      );
      const s = String(elapsedSecondsRef.current % 60).padStart(2, "0");
      setRecordingTime(`${m}:${s}`);

      // Auto-stop recording when 2-hour limit is reached
      if (elapsedSecondsRef.current >= RECORDING_TIME_LIMIT) {
        handleStopRecording();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle allow transcript toggle during recording
  useEffect(() => {
    if (!isRecording || !currentSessionId) return;

    const handleTranscriptToggle = async () => {
      if (allowTranscript) {
        // Reconnect transcription
        console.log("[Pause/Resume] Reconnecting transcription...");
        try {
          await connectTranscription(currentSessionId);
          await new Promise((resolve) => setTimeout(resolve, 300));
          console.log("[Pause/Resume] Transcription reconnected");
        } catch (error) {
          console.error("[Pause/Resume] Failed to reconnect:", error);
        }
      } else {
        // Disconnect transcription
        console.log("[Pause/Resume] Disconnecting transcription...");
        disconnectTranscription();
      }
    };

    handleTranscriptToggle();
  }, [
    allowTranscript,
    isRecording,
    currentSessionId,
    connectTranscription,
    disconnectTranscription,
  ]);

  const handleSaveSession = () => {
    if (!recordedBlobRef.current || !currentSessionId) return;

    const audioUrl = URL.createObjectURL(recordedBlobRef.current);

    navigate(`/practitioner/my-cases/${caseId}/session/${currentSessionId}`, {
      state: {
        audioUrl,
        audioBlob: recordedBlobRef.current,
        sessionMeta: {
          date: sessionDate,
          language: sessionLanguage,
          piiMasking,
        },
      },
    });
  };

  // const handleStartRecording = () => {
  //   if (allConsentsChecked) {
  //     setIsRecording(true);
  //     // Add recording logic here
  //   }
  // };

  const handleStartRecording = async () => {
    if (!consent || !caseId) return;

    setIsStarting(true);

    try {
      // Step 1: Create session in backend
      const sessionResponse = await createSessionMutation.mutateAsync({
        caseId,
        sessionDate: new Date(sessionDate).toISOString(),
        language: sessionLanguage,
        piiMaskingEnabled: piiMasking === "on",
        consentGiven: consent,
        consentTimestamp: new Date(consentDate).toISOString(),
      });

      const sessionId = sessionResponse.session._id;
      setCurrentSessionId(sessionId);

      // Step 2: Start recording in backend
      await startRecordingMutation.mutateAsync(sessionId);

      // Step 3: Get user media with mono audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Force mono
        },
      });

      // Step 4: Connect to transcription WebSocket with sessionId
      if (allowTranscript) {
        await connectTranscription(sessionId);
        // Wait a bit for WebSocket to fully establish
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Step 5: Set up AudioContext to produce PCM 16k mono for transcription
      // IMPORTANT: Force 16kHz sample rate to match AWS Transcribe requirements
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const processorNode = audioContext.createScriptProcessor(4096, 1, 1);

      audioContextRef.current = audioContext;
      audioSourceRef.current = sourceNode;
      processorRef.current = processorNode;

      processorNode.onaudioprocess = (e) => {
        if (!allowTranscript) return;

        try {
          const input = e.inputBuffer.getChannelData(0);
          const inputSampleRate = audioContext.sampleRate;
          const targetSampleRate = 16000;

          // Convert and resample to PCM 16-bit at 16kHz
          const pcmData = resampleAudio(
            input,
            inputSampleRate,
            targetSampleRate,
          );

          // Get ArrayBuffer from Int16Array
          const arrayBuffer = pcmData.buffer as ArrayBuffer;

          // Validate and log (for debugging - remove in production)
          if (validatePCMBuffer(arrayBuffer)) {
            // Log first chunk only
            const processor = processorRef.current as ScriptProcessorNode & {
              debugLogged?: boolean;
            };
            if (processor && !processor.debugLogged) {
              logAudioStats(arrayBuffer, "First PCM Chunk");
              processor.debugLogged = true;
            }

            // Create blob with PCM data
            const pcmBlob = new Blob([arrayBuffer], {
              type: "application/octet-stream",
            });

            // Send to transcription service
            sendAudioChunk(pcmBlob);
          }
        } catch (error) {
          console.error("[Audio Processing] Error:", error);
        }
      };

      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);

      // Step 6: Set up MediaRecorder only for saving WebM (not for transcription)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          const totalBytes = audioChunksRef.current.reduce(
            (acc, chunk) => acc + chunk.size,
            0,
          );
          setFileSizeMb(formatBytesToMb(totalBytes));
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        recordedBlobRef.current = finalBlob;
        setRecordedBlob(finalBlob);
        setFileSizeMb(formatBytesToMb(finalBlob.size));
        console.log("Recorded blob:", finalBlob);

        stream.getTracks().forEach((track) => track.stop());

        // Clean up audio nodes
        processorNode.disconnect();
        sourceNode.disconnect();
        audioContext.close();
        audioContextRef.current = null;
        audioSourceRef.current = null;
        processorRef.current = null;
      };

      mediaRecorder.start(1000);

      // Step 6: Start WaveSurfer visualization (optional)
      if (recordPluginRef.current) {
        await recordPluginRef.current.startRecording();
      }

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime("00:00:00");
      setSessionStartTime(
        new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
      setFileSizeMb("0.00 MB");
      elapsedSecondsRef.current = 0;
      pauseStartTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      // eslint-disable-next-line react-hooks/purity
      recordingStartTimeRef.current = Date.now();
      startTimer();
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // const handleStopRecording = () => {
  //   setIsRecording(false);
  //   setIsPaused(false);
  //   // Add stop recording logic here
  // };

  const handleStopRecording = async () => {
    if (!currentSessionId) return;

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: "Stop Recording?",
      text: "Are you sure you want to stop recording and save this session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#188aec",
      cancelButtonColor: "#ff0105",
      confirmButtonText: "Yes, Stop & Save",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // If user cancels, return
    if (!result.isConfirmed) {
      console.log("[Stop Recording] User cancelled");
      return;
    }

    // Show loading dialog
    Swal.fire({
      title: "Processing Recording...",
      text: "Please wait while we upload and save your recording.",
      icon: "info",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();

        try {
          // Stop MediaRecorder
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }

          // Stop WaveSurfer recording (if used)
          if (recordPluginRef.current) {
            await recordPluginRef.current.stopRecording();
          }

          // Cleanup audio context and nodes if still present
          if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
          }
          if (audioSourceRef.current) {
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
          }
          // Don't close AudioContext yet - let it finish processing
          // We'll close it after blob is ready

          // Disconnect transcription WebSocket
          if (allowTranscript) {
            console.log("[Stop Recording] Disconnecting transcription...");
            disconnectTranscription();
          }

          stopTimer();
          elapsedSecondsRef.current = 0;
          setIsRecording(false);
          setIsPaused(false);

          // Calculate duration - use ref to avoid Date.now() in render
          const durationSeconds = recordingStartTimeRef.current
            ? Math.floor(
                (Date.now() -
                  recordingStartTimeRef.current -
                  totalPausedTimeRef.current) /
                  1000,
              )
            : 0;

          // Wait for the blob to be ready (use ref, not state which is async)
          let attempts = 0;
          while (!recordedBlobRef.current && attempts < 50) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            attempts++;
          }

          if (!recordedBlobRef.current) {
            throw new Error("No audio recording found after timeout");
          }

          console.log(
            "[Stop Recording] Blob ready:",
            recordedBlobRef.current.size,
            "bytes",
          );

          // NOW close the audio context after blob is ready
          if (
            audioContextRef.current &&
            audioContextRef.current.state !== "closed"
          ) {
            try {
              await audioContextRef.current.close();
            } catch (err) {
              console.warn(
                "[Stop Recording] AudioContext already closed:",
                err,
              );
            }
            audioContextRef.current = null;
          }

          const audioFileSizeBytes = recordedBlobRef.current.size;

          // Create FormData and send blob to backend for S3 upload
          const formData = new FormData();
          formData.append("sessionId", currentSessionId);
          formData.append(
            "audio",
            recordedBlobRef.current,
            `session-${currentSessionId}.webm`,
          );
          formData.append("durationSeconds", durationSeconds.toString());
          formData.append("audioFileSizeBytes", audioFileSizeBytes.toString());

          console.log("[Stop Recording] Uploading audio to S3...");

          // Upload using the hook mutation
          const uploadData = await uploadRecordingMutation.mutateAsync({
            sessionId: currentSessionId,
            formData,
          });

          console.log("[Stop Recording] S3 upload successful:", uploadData);

          const uploadedAudioUrl =
            uploadData?.session?.audioUrl || uploadData?.audioUrl;

          console.log(
            "[Stop Recording] Finalizing session...",
            uploadedAudioUrl,
          );

          if (!uploadedAudioUrl) {
            throw new Error("Audio URL missing from upload response");
          }

          // Update session with recording data (audioUrl should come from backend S3 response)
          await stopRecordingMutation.mutateAsync({
            sessionId: currentSessionId,
            data: {
              audioUrl: uploadedAudioUrl,
              audioFileSizeBytes,
              durationSeconds,
            },
          });

          // Save transcript with all collected transcript entries
          let transcriptTextForSoap = "";
          if (transcriptEntries.length > 0) {
            console.log(
              "[Stop Recording] Saving transcript with entries:",
              transcriptEntries.length,
            );

            // Format transcript text from entries
            const transcriptText = transcriptEntries
              .map(
                (entry) =>
                  `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`,
              )
              .join("\n");

            const wordCount = transcriptText.split(/\s+/).length;
            transcriptTextForSoap = transcriptText;

            try {
              const transcriptResult =
                await createTranscriptMutation.mutateAsync({
                  sessionId: currentSessionId,
                  rawText: transcriptText,
                  wordCount,
                  languageDetected: sessionLanguage,
                  segments: transcriptEntries,
                  status: "Draft",
                });
              console.log(
                "[Stop Recording] Transcript saved successfully",
                transcriptResult,
              );
            } catch (transcriptError) {
              console.error(
                "[Stop Recording] Failed to save transcript:",
                transcriptError,
              );
              // Continue anyway - transcript error shouldn't block the session save
            }
          }

          // Generate SOAP note (using transcript if available, or let backend fetch it)
          try {
            console.log("[Stop Recording] Generating SOAP note...");
            const soapPayload: any = {
              sessionId: currentSessionId,
              framework: "SOAP",
              temperature: 0.2,
              maxTokens: 1200,
            };

            // Include transcript text if we have it
            if (transcriptTextForSoap) {
              soapPayload.transcriptText = transcriptTextForSoap;
            }

            const soapResult =
              await generateSoapNoteMutation.mutateAsync(soapPayload);
            console.log("[Stop Recording] SOAP note generated:", soapResult);
          } catch (soapError) {
            console.error(
              "[Stop Recording] Failed to generate SOAP note:",
              soapError,
            );
            // Continue anyway - SOAP generation error shouldn't block the session save
          }

          Swal.fire({
            title: "Success!",
            text: "Recording has been saved successfully.",
            icon: "success",
            confirmButtonColor: "#188aec",
          });
          handleSaveSession();
        } catch (error) {
          console.error("Failed to stop recording:", error);
          Swal.fire({
            title: "Error",
            text:
              error instanceof Error
                ? error.message
                : "Failed to save recording. Please try again.",
            icon: "error",
            confirmButtonColor: "#188aec",
          });
        }
      },
    });
  };

  // const handlePauseRecording = () => {
  //   setIsPaused(!isPaused);
  //   // Add pause/resume logic here
  // };
  const handlePauseRecording = async () => {
    if (!mediaRecorderRef.current || !currentSessionId) return;

    if (isPaused) {
      // Resume recording
      console.log("[Pause] Resuming recording...");
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
      if (recordPluginRef.current) {
        recordPluginRef.current.resumeRecording();
      }

      // Add pause duration to total paused time
      if (pauseStartTimeRef.current) {
        totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }

      // Reconnect transcription if enabled
      if (allowTranscript) {
        console.log("[Pause] Reconnecting transcription...");
        try {
          await connectTranscription(currentSessionId);
          await new Promise((resolve) => setTimeout(resolve, 300));
          console.log("[Pause] Transcription reconnected");
        } catch (error) {
          console.error("[Pause] Failed to reconnect transcription:", error);
        }
      }

      // Resume timer from where it was
      startTimer();
    } else {
      // Pause recording
      console.log("[Pause] Pausing recording...");
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
      if (recordPluginRef.current) {
        recordPluginRef.current.pauseRecording();
      }

      // Record pause start time
      pauseStartTimeRef.current = Date.now();
      console.log("[Pause] Pause time recorded:", pauseStartTimeRef.current);

      // Disconnect transcription
      if (allowTranscript) {
        console.log("[Pause] Disconnecting transcription...");
        disconnectTranscription();
      }

      stopTimer();
    }

    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col space-y-6 mx-auto">
      {/* Header */}
      <div>
        <Link
          to={`/practitioner/my-cases/${caseId}`}
          onClick={() => navigate(`/practitioner/my-cases/${caseId}`)}
          className="flex items-center gap-2 mr-auto mb-4 text-accent hover:text-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Case</span>
        </Link>

        <h1 className="text-secondary text-lg sm:text-2xl">
          Record New Session
        </h1>
      </div>

      {/* Session Details */}
      <Card className="p-6">
        <h2 className="text-secondary text-xl">Session Details</h2>
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
          {/* Session Date */}
          <div>
            <label className="block mb-2 text-secondary text-sm">
              Session Date
            </label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-primary/5 border-0 w-full text-accent text-sm"
            />
          </div>

          {/* Session Language */}
          <div>
            <label className="block mb-2 text-secondary text-sm">
              Session Language
            </label>
            <div className="relative">
              <select
                value={sessionLanguage}
                onChange={(e) => setSessionLanguage(e.target.value)}
                className="bg-primary/5 px-3 py-2 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full text-accent text-sm appearance-none"
              >
                <option value="english">English</option>
                <option value="mandarin">Mandarin</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Patient Consent */}
      <Card className="p-6">
        <h2 className="text-secondary text-xl">Patient Consent</h2>
        <div className="space-y-3 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={() => setConsent(!consent)}
              className="mt-1 rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary shrink-0"
            />
            <div className="text-secondary text-sm">
              <p className="mb-1">
                Patient has been informed about session recording and consents
                to:
              </p>
              <ul className="space-y-1 pl-5 list-disc">
                <li>Audio recording</li>
                <li>Data storage in Singapore</li>
                <li>
                  AI-assisted transcription & note generation (with human
                  review)
                </li>
              </ul>
            </div>
          </label>
        </div>

        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 pt-4">
          <div>
            <label className="block mb-2 text-secondary text-sm">
              Patient Signature/Initials
            </label>
            <Input
              type="text"
              value={patientSignature}
              onChange={(e) => setPatientSignature(e.target.value)}
              placeholder="Enter initials"
              className="bg-primary/5 border-0 w-full text-accent text-sm"
            />
          </div>

          <div>
            <label className="block mb-2 text-secondary text-sm">Date</label>
            <Input
              type="date"
              value={consentDate}
              onChange={(e) => setConsentDate(e.target.value)}
              className="bg-primary/5 border-0 w-full text-accent text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Advanced Options */}
      <Card className="p-6">
        <h2 className="text-secondary text-xl">Advanced Options</h2>

        <div className="space-y-4">
          {/* PII Masking */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-secondary text-sm">
                PII Masking (before AI processing)
              </h3>
              <p className="text-accent text-xs">
                Mask identifiers (NRIC, phone, address)
              </p>
            </div>
            <div className="relative">
              <select
                value={piiMasking}
                onChange={(e) => setPiiMasking(e.target.value)}
                className="bg-primary/10 px-3 py-2 pr-10 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-primary text-sm appearance-none"
              >
                <option value="off">OFF</option>
                <option value="on">ON</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Language */}
          {/* <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-secondary text-sm">Language</h3>
              <p className="text-accent text-xs">Choose the Language</p>
            </div>
            <div className="relative">
              <select
                value={advancedLanguage}
                onChange={(e) => setAdvancedLanguage(e.target.value)}
                className="bg-primary/10 px-3 py-2 pr-10 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-primary text-sm appearance-none"
              >
                <option value="english">English</option>
                <option value="mandarin">Mandarin</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div> */}
        </div>
      </Card>

      {/* Audio Recording */}
      <Card ref={waveformRef} className="p-6">
        <h2 className="text-secondary text-xl">Audio Recording</h2>

        <div className="flex flex-col justify-center items-center py-8">
          {/* Mic Icon */}
          <div className="flex justify-center items-center bg-primary shadow-lg mb-6 rounded-full w-20 h-20">
            <Mic className="w-10 h-10 text-white" />
          </div>

          {/* Timer */}
          <div className="mb-6 font-mono text-primary text-4xl">
            {recordingTime}
          </div>

          {/* Recording Controls */}
          {!isRecording ? (
            <>
              {/* Start Recording Button */}
              <Button
                onClick={handleStartRecording}
                disabled={
                  !consent ||
                  isStarting ||
                  createSessionMutation.isPending ||
                  startRecordingMutation.isPending
                }
                className={`flex items-center gap-2 px-6 ${
                  !consent
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80"
                } text-white`}
              >
                {isStarting ||
                createSessionMutation.isPending ||
                startRecordingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {isStarting ||
                createSessionMutation.isPending ||
                startRecordingMutation.isPending
                  ? "Preparing..."
                  : "Start Recording"}
              </Button>

              {/* Info Text */}
              <div className="space-y-1 mt-6 text-accent text-sm text-center">
                <p>Please complete consent checkboxe before starting</p>
                <p>Recording indicator will be visible throughout session</p>
                <p className="flex justify-center items-center gap-1">
                  <span>🔒</span> Audio will be encrypted and stored in
                  Singapore
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Stop and Pause Buttons */}
              <div className="flex gap-3 mb-4">
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="flex items-center gap-2 px-6"
                >
                  <Square className="fill-current w-4 h-4" />
                  Stop Recording
                </Button>
                <Button
                  onClick={handlePauseRecording}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 px-6 text-white"
                >
                  {/* <Pause className="w-4 h-4" /> */}
                  {isPaused ? (
                    <Triangle className="fill-current w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              </div>

              {/* Session Info */}
              <div className="space-x-2 text-accent text-sm text-center">
                <span>
                  Session Started: {sessionStartTime || "Not started"}
                </span>
                <span className="text-primary/50">•</span>
                <span>
                  Language:{" "}
                  {sessionLanguage === "english" ? "English" : sessionLanguage}
                </span>
                <span className="text-primary/50">•</span>
                <span className="text-primary">File Size: {fileSizeMb}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Transcript Section - Only show when recording */}
      {isRecording && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-secondary text-xl">Real-time Transcript</h2>
            <div className="flex items-center gap-3">
              {/* PII Masking Status */}
              {piiMaskingEnabled && (
                <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-700 text-xs font-medium">
                    PII Protected
                  </span>
                </div>
              )}
              
              {/* Connection Status */}
              {allowTranscript && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isTranscriptionConnected
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-accent text-xs">
                    {isTranscriptionConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              )}
              <Button
                onClick={() => setAllowTranscript(!allowTranscript)}
                className={`text-sm ${
                  allowTranscript
                    ? "bg-primary hover:bg-primary/80 text-white"
                    : "bg-accent hover:bg-accent/80 text-secondary"
                }`}
              >
                {allowTranscript ? "✓ " : ""}Allow Transcript
              </Button>
            </div>
          </div>

          {allowTranscript && (
            <>
              {/* Error Message */}
              {transcriptionError && (
                <div className="bg-red-50 mb-4 p-3 border border-red-200 rounded-lg">
                  <p className="text-destructive text-sm">
                    ⚠️ Transcription Error: {transcriptionError}
                  </p>
                </div>
              )}

              {/* Transcript Entries */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcriptEntries.length === 0 &&
                  !currentPartialTranscript && (
                    <div className="py-8 text-accent text-sm text-center">
                      <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin" />
                      Waiting for speech...
                    </div>
                  )}

                {transcriptEntries.map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <div className="flex items-start gap-2">
                      <span className="bg-primary/10 p-1 rounded-sm font-mono text-primary text-xs">
                        [{entry.timestamp}]
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-secondary">
                            {entry.speaker}:
                          </span>
                          {entry.piiMasked && (
                            <span className="bg-amber-100 px-2 py-0.5 rounded text-xs text-amber-700 font-medium">
                              PII Masked
                            </span>
                          )}
                          {entry.isFinal && (
                            <span className="bg-green-100 px-2 py-0.5 rounded text-xs text-green-700 font-medium">
                              Final
                            </span>
                          )}
                        </div>
                        <span className="text-accent">{entry.text}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Current Partial Transcript */}
                {currentPartialTranscript && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <span className="bg-blue-100 mr-2 p-1 rounded-sm font-mono text-blue-600">
                      [Live]
                    </span>
                    <span className="font-medium text-secondary italic">
                      Speaker:
                    </span>{" "}
                    <span className="opacity-70 text-accent italic">
                      {currentPartialTranscript}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Warning Message - Only show when recording */}
      {isRecording && (
        <>
          <div className="flex items-center bg-[#F2933911] mr-auto p-2 rounded-lg text-[#F29339] text-sm">
            <span className="">⚠</span>
            <p className="ml-1 text-xs">
              Please click <strong>"STOP THE RECORDING"</strong> when session is
              complete
            </p>
          </div>
          {/* Time Limit Warning */}
          {recordingTime &&
            (() => {
              const [hours, minutes, seconds] = recordingTime
                .split(":")
                .map(Number);
              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
              const timeRemaining = RECORDING_TIME_LIMIT - totalSeconds;

              if (timeRemaining <= 300 && timeRemaining > 0) {
                return (
                  <div className="flex items-center bg-descuctive/10 mr-auto p-2 rounded-lg text-destructive text-sm">
                    <span className="">⏱</span>
                    <p className="ml-1 text-xs">
                      <strong>Recording limit approaching:</strong>{" "}
                      {Math.floor(timeRemaining / 60)} minute
                      {Math.floor(timeRemaining / 60) !== 1 ? "s" : ""}{" "}
                      remaining
                    </p>
                  </div>
                );
              }
              return null;
            })()}
        </>
      )}

      {/* Action Buttons */}
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
            !recordedBlobRef.current ||
            createSessionMutation.isPending ||
            stopRecordingMutation.isPending
          }
          onClick={handleSaveSession}
          className="text-white"
        >
          {createSessionMutation.isPending ||
          stopRecordingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Session"
          )}
        </Button>
      </div>
    </div>
  );
};
