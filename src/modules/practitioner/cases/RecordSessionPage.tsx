import { useState } from "react";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import fixWebmDuration from "fix-webm-duration";
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
  Trash2,
  Monitor,
  Info,
} from "lucide-react";
import {
  useCreateSession,
  useStartRecording,
  useStopRecording,
  useUploadRecording,
} from "@/hooks/useSessions";
import { useTranscription } from "@/hooks/useTranscription";
import { useGenerateSoapNote } from "@/hooks/useSoap";
import {
  resampleAudio,
  validatePCMBuffer,
  logAudioStats,
} from "@/utils/audioUtils";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "react-toastify";
import { getTranscriptBySession } from "@/services/transcriptService/transcriptService";

export const RecordSessionPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [sessionLanguage, setSessionLanguage] = useState(
    user?.language || "english",
  );
  const [patientSignature, setPatientSignature] = useState("");
  const [consentDate, setConsentDate] = useState(getCurrentDate());
  const [consent, setConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00:00");
  const [piiMasking, setPiiMasking] = useState(user?.piiMasking !== false);
  const [allowTranscript, setAllowTranscript] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState("0.00 MB");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // New state for audio capture mode
  const [captureMode, setCaptureMode] = useState<"mic" | "mic+system">("mic");
  const [systemAudioConsent, setSystemAudioConsent] = useState(false);

  // Audio level monitoring for source identification
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [activeSource, setActiveSource] = useState<
    "mic" | "system" | "both" | "none"
  >("none");

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // New refs for system audio
  const desktopStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  // Refs for audio level analysis
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const levelMonitorIntervalRef = useRef<number | null>(null);

  // API hooks
  const createSessionMutation = useCreateSession();
  const startRecordingMutation = useStartRecording();
  const stopRecordingMutation = useStopRecording();
  const uploadRecordingMutation = useUploadRecording();
  const generateSoapNoteMutation = useGenerateSoapNote();

  // Transcription hook - with speaker diarization config
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
  const recordPluginRef = useRef<ReturnType<typeof RecordPlugin.create> | null>(
    null,
  );

  const timerRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const pauseStartTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

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
    });

    waveSurferRef.current = waveSurfer;
    recordPluginRef.current = record;

    return () => {
      waveSurfer.destroy();
    };
  }, []);

  // Check browser support for system audio capture
  const checkSystemAudioSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      toast.error(
        "System audio capture is not supported in this browser. Please use Chrome or Edge.",
      );
      return false;
    }
    return true;
  };

  // Audio level monitoring function
  const startAudioLevelMonitoring = () => {
    if (captureMode !== "mic+system") return;

    const monitorLevels = () => {
      let micVol = 0;
      let sysVol = 0;

      if (micAnalyserRef.current) {
        const micData = new Uint8Array(
          micAnalyserRef.current.frequencyBinCount,
        );
        micAnalyserRef.current.getByteFrequencyData(micData);
        micVol = micData.reduce((sum, val) => sum + val, 0) / micData.length;
      }

      if (systemAnalyserRef.current) {
        const sysData = new Uint8Array(
          systemAnalyserRef.current.frequencyBinCount,
        );
        systemAnalyserRef.current.getByteFrequencyData(sysData);
        sysVol = sysData.reduce((sum, val) => sum + val, 0) / sysData.length;
      }

      // Normalize to 0-100 scale
      const micLevel = Math.min(100, (micVol / 128) * 100);
      const sysLevel = Math.min(100, (sysVol / 128) * 100);

      setMicLevel(micLevel);
      setSystemLevel(sysLevel);

      // Determine active source (threshold: 10)
      const micActive = micLevel > 10;
      const sysActive = sysLevel > 10;

      if (micActive && sysActive) {
        setActiveSource("both");
      } else if (micActive) {
        setActiveSource("mic");
      } else if (sysActive) {
        setActiveSource("system");
      } else {
        setActiveSource("none");
      }
    };

    levelMonitorIntervalRef.current = window.setInterval(monitorLevels, 100);
  };

  const stopAudioLevelMonitoring = () => {
    if (levelMonitorIntervalRef.current) {
      clearInterval(levelMonitorIntervalRef.current);
      levelMonitorIntervalRef.current = null;
    }
    setMicLevel(0);
    setSystemLevel(0);
    setActiveSource("none");
  };

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      if (!isPausedRef.current) {
        elapsedSecondsRef.current++;
      }
      const h = String(Math.floor(elapsedSecondsRef.current / 3600)).padStart(
        2,
        "0",
      );
      const m = String(
        Math.floor((elapsedSecondsRef.current % 3600) / 60),
      ).padStart(2, "0");
      const s = String(elapsedSecondsRef.current % 60).padStart(2, "0");
      setRecordingTime(`${h}:${m}:${s}`);

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
        console.log("[Pause/Resume] Reconnecting transcription...");
        try {
          // Pass speaker diarization config when connecting
          await connectTranscription(currentSessionId);
          await new Promise((resolve) => setTimeout(resolve, 300));
          console.log("[Pause/Resume] Transcription reconnected");
        } catch (error) {
          console.error("[Pause/Resume] Failed to reconnect:", error);
        }
      } else {
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

  const handleStartRecording = async () => {
    if (!consent || !caseId) return;

    // Additional check for system audio consent
    if (captureMode === "mic+system" && !systemAudioConsent) {
      toast.error("Please provide consent for system audio capture");
      return;
    }

    setIsStarting(true);

    try {
      // Step 1: Create session in backend
      const sessionResponse = await createSessionMutation.mutateAsync({
        caseId,
        sessionDate: new Date(sessionDate).toISOString(),
        language: sessionLanguage,
        piiMaskingEnabled: piiMasking,
        consentGiven: consent,
        consentTimestamp: new Date(consentDate).toISOString(),
      });

      const sessionId = sessionResponse.session._id;
      setCurrentSessionId(sessionId);

      // Step 2: Start recording in backend
      await startRecordingMutation.mutateAsync(sessionId);

      let finalStream: MediaStream;

      // Step 3: Get audio streams based on capture mode
      if (captureMode === "mic+system") {
        console.log("[System Audio] Starting system + microphone capture...");

        if (!checkSystemAudioSupport()) {
          throw new Error("System audio capture not supported");
        }

        try {
          // Get system audio via screen share
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: 1,
              height: 1,
              frameRate: 1,
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          desktopStreamRef.current = displayStream;

          // Listen for user stopping the screen share
          displayStream.getVideoTracks()[0].addEventListener("ended", () => {
            console.log("[System Audio] User stopped screen sharing");
            toast.warning(
              "Screen sharing stopped. Switching to microphone only.",
            );
            stopAudioLevelMonitoring();
          });

          // Get microphone audio
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });

          micStreamRef.current = micStream;

          // Create audio context to mix streams
          const audioContext = new AudioContext({ sampleRate: 16000 });
          audioContextRef.current = audioContext;

          // Create source nodes
          const micSource = audioContext.createMediaStreamSource(micStream);
          const desktopSource =
            audioContext.createMediaStreamSource(displayStream);

          // Create analysers for level monitoring
          const micAnalyser = audioContext.createAnalyser();
          const systemAnalyser = audioContext.createAnalyser();

          micAnalyser.fftSize = 256;
          systemAnalyser.fftSize = 256;

          micAnalyserRef.current = micAnalyser;
          systemAnalyserRef.current = systemAnalyser;

          // Create gain nodes for volume control
          const micGain = audioContext.createGain();
          const systemGain = audioContext.createGain();

          micGain.gain.value = 0.8; // 80% microphone volume
          systemGain.gain.value = 1.2; // 120% system audio (boost meeting audio)

          // Create destination for mixed audio
          const destination = audioContext.createMediaStreamDestination();

          // Connect with analysers: mic -> analyser -> gain -> destination
          micSource.connect(micAnalyser);
          micAnalyser.connect(micGain);
          micGain.connect(destination);

          // Connect: desktop -> analyser -> gain -> destination
          desktopSource.connect(systemAnalyser);
          systemAnalyser.connect(systemGain);
          systemGain.connect(destination);

          finalStream = destination.stream;
          mixedStreamRef.current = finalStream;

          // Start monitoring audio levels
          startAudioLevelMonitoring();

          console.log(
            "[System Audio] Successfully mixed microphone + system audio",
          );
          toast.success("Recording microphone + system audio");
        } catch (displayError) {
          console.error(
            "[System Audio] Failed to get display media:",
            displayError,
          );

          // Fallback to microphone only
          toast.warning("System audio capture failed. Using microphone only.");
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
          finalStream = micStream;
          micStreamRef.current = micStream;
        }
      } else {
        // Microphone only (original behavior)
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        finalStream = micStream;
        micStreamRef.current = micStream;
      }

      // Store stream reference
      mediaStreamRef.current = finalStream;

      // Step 4: Connect to transcription WebSocket with speaker diarization config
      if (allowTranscript) {
        await connectTranscription(sessionId);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Step 5: Set up AudioContext for PCM processing (transcription)
      let processingAudioContext: AudioContext;

      if (captureMode === "mic+system" && audioContextRef.current) {
        // Reuse existing audio context from mixing
        processingAudioContext = audioContextRef.current;
      } else {
        // Create new audio context for mic-only
        processingAudioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = processingAudioContext;
      }

      const sourceNode =
        processingAudioContext.createMediaStreamSource(finalStream);
      const processorNode = processingAudioContext.createScriptProcessor(
        4096,
        1,
        1,
      );

      audioSourceRef.current = sourceNode;
      processorRef.current = processorNode;

      processorNode.onaudioprocess = (e) => {
        if (!allowTranscript) return;

        try {
          const input = e.inputBuffer.getChannelData(0);
          const inputSampleRate = processingAudioContext.sampleRate;
          const targetSampleRate = 16000;

          const pcmData = resampleAudio(
            input,
            inputSampleRate,
            targetSampleRate,
          );

          const arrayBuffer = pcmData.buffer as ArrayBuffer;

          if (validatePCMBuffer(arrayBuffer)) {
            const processor = processorRef.current as ScriptProcessorNode & {
              debugLogged?: boolean;
            };
            if (processor && !processor.debugLogged) {
              logAudioStats(arrayBuffer, "First PCM Chunk");
              processor.debugLogged = true;
            }

            const pcmBlob = new Blob([arrayBuffer], {
              type: "application/octet-stream",
            });

            sendAudioChunk(pcmBlob);
          }
        } catch (error) {
          console.error("[Audio Processing] Error:", error);
        }
      };

      sourceNode.connect(processorNode);
      processorNode.connect(processingAudioContext.destination);

      // Step 6: Set up MediaRecorder for saving WebM
      const mediaRecorder = new MediaRecorder(finalStream, {
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

        // Stop all tracks
        if (finalStream) {
          finalStream.getTracks().forEach((track) => track.stop());
        }
        if (desktopStreamRef.current) {
          desktopStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Stop audio level monitoring
        stopAudioLevelMonitoring();

        // Clean up audio nodes
        if (processorNode) processorNode.disconnect();
        if (sourceNode) sourceNode.disconnect();
        if (
          processingAudioContext &&
          processingAudioContext.state !== "closed"
        ) {
          processingAudioContext.close();
        }
        audioContextRef.current = null;
        audioSourceRef.current = null;
        processorRef.current = null;
      };

      mediaRecorder.start(1000);

      // Step 7: Start WaveSurfer visualization
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
      recordingStartTimeRef.current = Date.now();
      startTimer();
    } catch (error) {
      console.error("Failed to start recording:", error);

      // Clean up on error
      if (desktopStreamRef.current) {
        desktopStreamRef.current.getTracks().forEach((track) => track.stop());
        desktopStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }

      stopAudioLevelMonitoring();

      alert("Failed to start recording. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopRecording = async () => {
    if (!currentSessionId) return;

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

    if (!result.isConfirmed) {
      console.log("[Stop Recording] User cancelled");
      return;
    }

    Swal.fire({
      title: "Processing Recording...",
      text: "Please wait while we upload and save your recording.",
      icon: "info",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();

        try {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }

          if (recordPluginRef.current) {
            await recordPluginRef.current.stopRecording();
          }

          if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
          }
          if (audioSourceRef.current) {
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
          }

          if (allowTranscript) {
            console.log("[Stop Recording] Disconnecting transcription...");
            disconnectTranscription();
          }

          // Stop audio level monitoring
          stopAudioLevelMonitoring();

          const durationSeconds = elapsedSecondsRef.current;
          console.log(
            "[Stop Recording] Duration:",
            `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
          );

          stopTimer();
          elapsedSecondsRef.current = 0;
          setIsRecording(false);
          setIsPaused(false);

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

          console.log("[Stop Recording] Fixing WebM duration metadata...");
          const fixedBlob = await fixWebmDuration(
            recordedBlobRef.current,
            durationSeconds * 1000,
            { logger: false },
          );
          recordedBlobRef.current = fixedBlob;
          setRecordedBlob(fixedBlob);
          console.log(
            "[Stop Recording] WebM duration fixed:",
            durationSeconds,
            "seconds",
          );

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

          await stopRecordingMutation.mutateAsync({
            sessionId: currentSessionId,
            data: {
              audioFileSizeBytes,
              durationSeconds,
            },
          });

          let transcriptTextForSoap = "";
          try {
            const transcriptResponse =
              await getTranscriptBySession(currentSessionId);

            const transcriptData =
              transcriptResponse?.transcript ||
              transcriptResponse?.data?.transcript ||
              transcriptResponse?.data;

            if (transcriptData?.rawText) {
              transcriptTextForSoap = transcriptData.rawText;
            } else if (
              transcriptData?.segments &&
              Array.isArray(transcriptData.segments) &&
              transcriptData.segments.length > 0
            ) {
              transcriptTextForSoap = transcriptData.segments
                .map((segment) => {
                  const ts = segment.timestamp || new Date().toISOString();
                  const speaker = segment.speaker || "Speaker";
                  const text = segment.text || "";
                  return `[${ts}] ${speaker}: ${text}`;
                })
                .join("\n");
            }

            console.log("[Stop Recording] Retrieved live transcript for SOAP", {
              hasTranscript: !!transcriptTextForSoap,
              segments: transcriptData?.segments?.length || 0,
            });
          } catch (transcriptError) {
            console.error(
              "[Stop Recording] Failed to fetch live transcript:",
              transcriptError,
            );

            if (transcriptEntries.length > 0) {
              transcriptTextForSoap = transcriptEntries
                .map(
                  (entry) =>
                    `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`,
                )
                .join("\n");
            }
          }

          try {
            console.log("[Stop Recording] Generating SOAP note...");
            const soapPayload: any = {
              sessionId: currentSessionId,
              framework: "SOAP",
              temperature: 0.2,
              maxTokens: 1200,
            };

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

  const handlePauseRecording = async () => {
    if (!mediaRecorderRef.current || !currentSessionId) return;

    if (isPaused) {
      console.log("[Pause] Resuming recording...");
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
      if (recordPluginRef.current) {
        recordPluginRef.current.resumeRecording();
      }

      if (pauseStartTimeRef.current) {
        totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }

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

      // Resume audio level monitoring
      if (captureMode === "mic+system") {
        startAudioLevelMonitoring();
      }

      isPausedRef.current = false;
      startTimer();
    } else {
      console.log("[Pause] Pausing recording...");
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
      if (recordPluginRef.current) {
        recordPluginRef.current.pauseRecording();
      }

      pauseStartTimeRef.current = Date.now();
      console.log("[Pause] Pause time recorded:", pauseStartTimeRef.current);

      if (allowTranscript) {
        console.log("[Pause] Disconnecting transcription...");
        disconnectTranscription();
      }
      stopAudioLevelMonitoring();

      isPausedRef.current = true;
      stopTimer();
    }

    setIsPaused(!isPaused);
  };

  const handleResetRecording = async () => {
    const result = await Swal.fire({
      title: "Reset Recording?",
      text: "Are you sure you want to discard the current recording and start fresh?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Clear Recording",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      console.log("[Reset Recording] Starting reset process...");

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        console.log("[Reset Recording] Stopped old MediaRecorder");
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      recordedBlobRef.current = null;
      setRecordedBlob(null);
      audioChunksRef.current = [];
      elapsedSecondsRef.current = 0;
      pauseStartTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      setRecordingTime("00:00:00");
      setFileSizeMb("0.00 MB");
      setIsPaused(false);
      isPausedRef.current = false;

      stopTimer();
      stopAudioLevelMonitoring();

      if (mediaStreamRef.current) {
        console.log("[Reset Recording] Recreating audio pipeline...");

        try {
          const isStreamActive = mediaStreamRef.current
            .getTracks()
            .some((track) => track.readyState === "live");

          if (!isStreamActive) {
            console.warn(
              "[Reset Recording] Media stream is dead, getting new stream...",
            );

            if (captureMode === "mic+system") {
              toast.info("Please select screen/window to share again");

              const displayStream =
                await navigator.mediaDevices.getDisplayMedia({
                  video: { width: 1, height: 1, frameRate: 1 },
                  audio: true,
                });

              const micStream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, sampleRate: 16000 },
              });

              desktopStreamRef.current = displayStream;
              micStreamRef.current = micStream;

              const audioContext = new AudioContext({ sampleRate: 16000 });
              const micSource = audioContext.createMediaStreamSource(micStream);
              const desktopSource =
                audioContext.createMediaStreamSource(displayStream);
              const destination = audioContext.createMediaStreamDestination();

              // Recreate analysers
              const micAnalyser = audioContext.createAnalyser();
              const systemAnalyser = audioContext.createAnalyser();
              micAnalyser.fftSize = 256;
              systemAnalyser.fftSize = 256;
              micAnalyserRef.current = micAnalyser;
              systemAnalyserRef.current = systemAnalyser;

              const micGain = audioContext.createGain();
              const systemGain = audioContext.createGain();
              micGain.gain.value = 0.8;
              systemGain.gain.value = 1.2;

              micSource
                .connect(micAnalyser)
                .connect(micGain)
                .connect(destination);
              desktopSource
                .connect(systemAnalyser)
                .connect(systemGain)
                .connect(destination);

              mediaStreamRef.current = destination.stream;
              audioContextRef.current = audioContext;

              // Restart audio level monitoring
              startAudioLevelMonitoring();
            } else {
              const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                },
              });
              mediaStreamRef.current = newStream;
              micStreamRef.current = newStream;
            }
          }

          const audioContext =
            audioContextRef.current || new AudioContext({ sampleRate: 16000 });
          const sourceNode = audioContext.createMediaStreamSource(
            mediaStreamRef.current,
          );
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

              const pcmData = resampleAudio(
                input,
                inputSampleRate,
                targetSampleRate,
              );

              const arrayBuffer = pcmData.buffer as ArrayBuffer;

              if (validatePCMBuffer(arrayBuffer)) {
                const pcmBlob = new Blob([arrayBuffer], {
                  type: "application/octet-stream",
                });

                sendAudioChunk(pcmBlob);
              }
            } catch (error) {
              console.error("[Reset Recording] Audio Processing Error:", error);
            }
          };

          sourceNode.connect(processorNode);
          processorNode.connect(audioContext.destination);

          console.log("[Reset Recording] Audio pipeline recreated");
        } catch (audioError) {
          console.error(
            "[Reset Recording] Failed to recreate audio pipeline:",
            audioError,
          );
        }
      }

      if (mediaStreamRef.current) {
        console.log(
          "[Reset Recording] Recreating MediaRecorder with existing stream...",
        );

        const newMediaRecorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: "audio/webm;codecs=opus",
        });

        mediaRecorderRef.current = newMediaRecorder;
        audioChunksRef.current = [];

        newMediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            const totalBytes = audioChunksRef.current.reduce(
              (acc, chunk) => acc + chunk.size,
              0,
            );
            console.log(
              "[Reset Recording] Data available, new size:",
              formatBytesToMb(totalBytes),
            );
            setFileSizeMb(formatBytesToMb(totalBytes));
          }
        };

        newMediaRecorder.onstop = () => {
          console.log("[Reset Recording] onstop event fired");
          const finalBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          recordedBlobRef.current = finalBlob;
          setRecordedBlob(finalBlob);
          setFileSizeMb(formatBytesToMb(finalBlob.size));
          console.log("Recorded blob:", finalBlob);
        };

        newMediaRecorder.start(1000);
        console.log("[Reset Recording] New MediaRecorder started");
      }

      if (allowTranscript && currentSessionId) {
        console.log("[Reset Recording] Reconnecting transcription...");
        try {
          disconnectTranscription();
          await new Promise((resolve) => setTimeout(resolve, 100));

          await connectTranscription(currentSessionId);
          await new Promise((resolve) => setTimeout(resolve, 300));
          console.log("[Reset Recording] Transcription reconnected");
        } catch (error) {
          console.error(
            "[Reset Recording] Failed to reconnect transcription:",
            error,
          );
        }
      }

      startTimer();

      Swal.fire({
        title: "Recording Cleared!",
        text: "Ready to record again from the beginning.",
        icon: "success",
        confirmButtonColor: "#188aec",
      });

      console.log("[Reset Recording] Recording cleared, ready for fresh start");
    } catch (error) {
      console.error("[Reset Recording] Error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to reset recording. Please try again.",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
    }
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
                onChange={(e) => {
                  setSessionLanguage(e.target.value);
                  if (e.target.value === "mandarin") {
                    setPiiMasking(false);
                    toast.info(
                      "PII Masking automatically disabled for Mandarin",
                    );
                  }
                }}
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

          {/* System Audio Consent - Only show if system audio is selected */}
          {captureMode === "mic+system" && (
            <label className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={systemAudioConsent}
                onChange={() => setSystemAudioConsent(!systemAudioConsent)}
                className="mt-1 rounded-full focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600 shrink-0"
              />
              <div className="text-secondary text-sm">
                <p className="flex items-center gap-2 mb-1 font-medium">
                  <Monitor className="w-4 h-4" />
                  System Audio Recording Consent
                </p>
                <ul className="space-y-1 pl-5 list-disc">
                  <li>
                    Recording system/desktop audio (e.g., Zoom/Meet calls)
                  </li>
                  <li>May capture background sounds and notifications</li>
                  <li>Screen sharing permission required</li>
                </ul>
              </div>
            </label>
          )}
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
          {/* Audio Capture Mode */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-2 bg-blue-50 p-4 rounded-lg">
            <div className="flex-1">
              <h3 className="flex items-center gap-2 font-medium text-secondary text-sm">
                <Monitor className="w-4 h-4" />
                Audio Capture Mode
              </h3>
              <p className="mt-1 text-accent text-xs">
                Choose to record microphone only or include system audio (for
                Zoom/Meet meetings)
              </p>
              <div className="flex items-start gap-2 mt-2 text-blue-600 text-xs">
                <Info className="mt-0.5 w-3 h-3 shrink-0" />
                <span>
                  System audio requires screen sharing permission and works best
                  in Chrome/Edge
                </span>
              </div>
            </div>
            <div className="relative">
              <select
                value={captureMode}
                onChange={(e) => {
                  const newMode = e.target.value as "mic" | "mic+system";
                  setCaptureMode(newMode);
                  if (newMode === "mic") {
                    setSystemAudioConsent(false);
                  }
                }}
                disabled={isRecording}
                className={`bg-white px-3 py-2 pr-10 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-primary text-sm appearance-none border-2 border-blue-200 min-w-[200px] ${
                  isRecording ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <option value="mic">🎤 Microphone Only</option>
                <option value="mic+system">🖥️ Microphone + System Audio</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Speaker Diarization Settings - NEW */}
          {/* <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-2 bg-purple-50 p-4 rounded-lg">
            <div className="flex-1">
              <h3 className="flex items-center gap-2 font-medium text-secondary text-sm">
                <Users className="w-4 h-4" />
                Speaker Identification (Diarization)
              </h3>
              <p className="mt-1 text-accent text-xs">
                Automatically identify and separate different speakers in the
                conversation
              </p>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSpeakerDiarization}
                    onChange={(e) =>
                      setEnableSpeakerDiarization(e.target.checked)
                    }
                    disabled={isRecording}
                    className="rounded focus:ring-2 focus:ring-purple-500 w-4 h-4 text-purple-600"
                  />
                  <span className="text-secondary text-xs">
                    Enable Speaker ID
                  </span>
                </label>
                {enableSpeakerDiarization && (
                  <div className="flex items-center gap-2">
                    <label className="text-secondary text-xs">
                      Max Speakers:
                    </label>
                    <select
                      value={maxSpeakers}
                      onChange={(e) => setMaxSpeakers(Number(e.target.value))}
                      disabled={isRecording}
                      className="bg-white px-2 py-1 border-2 border-purple-200 rounded text-purple-600 text-xs"
                    >
                      <option value={2}>2 (Recommended)</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div> */}

          {/* PII Masking */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-secondary text-sm">
                PII Masking (before AI processing)
              </h3>
              <p className="text-accent text-xs">
                Mask identifiers (NRIC, phone, address)
                {sessionLanguage !== "english" &&
                  " - Only available with English"}
              </p>
            </div>
            <div className="relative">
              <select
                value={piiMasking ? "on" : "off"}
                onChange={(e) => {
                  if (
                    e.target.value === "on" &&
                    sessionLanguage !== "english"
                  ) {
                    toast.error(
                      "PII Masking can only be enabled with English language",
                    );
                    return;
                  }
                  setPiiMasking(e.target.value === "on");
                }}
                disabled={sessionLanguage !== "english"}
                className={`bg-primary/10 px-3 py-2 pr-10 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-primary text-sm appearance-none ${
                  sessionLanguage !== "english"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="off">OFF</option>
                <option value="on">ON</option>
              </select>
              <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Audio Recording */}
      <Card ref={waveformRef} className="p-6">
        <h2 className="text-secondary text-xl">Audio Recording</h2>

        <div className="flex flex-col justify-center items-center py-8">
          {/* Mic Icon with Mode Indicator */}
          <div className="relative flex justify-center items-center bg-primary shadow-lg mb-6 rounded-full w-20 h-20">
            <Mic className="w-10 h-10 text-white" />
            {captureMode === "mic+system" && (
              <div className="-right-1 -bottom-1 absolute bg-blue-500 p-1.5 border-2 border-white rounded-full">
                <Monitor className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="mb-6 font-mono text-primary text-4xl">
            {recordingTime}
          </div>

          {/* Audio Source Indicators - NEW (only show when recording with system audio) */}
          {isRecording && captureMode === "mic+system" && (
            <div className="flex gap-4 bg-gray-50 mb-6 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic
                  className={`w-4 h-4 ${activeSource === "mic" || activeSource === "both" ? "text-green-500" : "text-gray-300"}`}
                />
                <span className="text-secondary text-xs">Microphone</span>
                <div className="bg-gray-200 rounded-full w-20 h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Monitor
                  className={`w-4 h-4 ${activeSource === "system" || activeSource === "both" ? "text-blue-500" : "text-gray-300"}`}
                />
                <span className="text-secondary text-xs">System Audio</span>
                <div className="bg-gray-200 rounded-full w-20 h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-100"
                    style={{ width: `${systemLevel}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Source Label - NEW */}
          {isRecording &&
            captureMode === "mic+system" &&
            activeSource !== "none" && (
              <div className="mb-4 text-sm">
                <span className="text-accent">Audio from: </span>
                <span className="font-medium text-primary">
                  {activeSource === "mic" && "🎤 Microphone"}
                  {activeSource === "system" && "🖥️ System/Zoom"}
                  {activeSource === "both" && "🎤 Microphone + 🖥️ System/Zoom"}
                </span>
              </div>
            )}

          {/* Recording Controls */}
          {!isRecording ? (
            <>
              {/* Start Recording Button */}
              <Button
                onClick={handleStartRecording}
                disabled={
                  !consent ||
                  (captureMode === "mic+system" && !systemAudioConsent) ||
                  isStarting ||
                  createSessionMutation.isPending ||
                  startRecordingMutation.isPending
                }
                className={`flex items-center gap-2 px-6 ${
                  !consent ||
                  (captureMode === "mic+system" && !systemAudioConsent)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80"
                } text-white`}
              >
                {isStarting ||
                createSessionMutation.isPending ||
                startRecordingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    {captureMode === "mic+system" && (
                      <Monitor className="w-4 h-4" />
                    )}
                  </>
                )}
                {isStarting ||
                createSessionMutation.isPending ||
                startRecordingMutation.isPending
                  ? "Preparing..."
                  : captureMode === "mic+system"
                    ? "Start Recording (Mic + System)"
                    : "Start Recording"}
              </Button>

              {/* Info Text */}
              <div className="space-y-1 mt-6 text-accent text-sm text-center">
                <p>
                  Please complete consent checkbox
                  {captureMode === "mic+system" ? "es" : ""} before starting
                </p>
                {captureMode === "mic+system" && (
                  <p className="font-medium text-primary">
                    📺 You'll be prompted to select a window/screen to share
                  </p>
                )}
                {/* {enableSpeakerDiarization && (
                  <p className="font-medium text-purple-600">
                    👥 Speaker identification enabled (max {maxSpeakers}{" "}
                    speakers)
                  </p>
                )} */}
                <p>Recording indicator will be visible throughout session</p>
                <p className="flex justify-center items-center gap-1">
                  <span>🔒</span> Audio will be encrypted and stored in
                  Singapore
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Stop, Pause, and Reset Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mb-4">
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
                  {isPaused ? (
                    <Triangle className="fill-current w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  onClick={handleResetRecording}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-6 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Audio
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
                {captureMode === "mic+system" && (
                  <>
                    <span className="text-primary/50">•</span>
                    <span className="font-medium text-blue-600">
                      🖥️ System Audio Active
                    </span>
                  </>
                )}
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
                    <span className="bg-primary/10 mr-2 p-1 rounded-sm font-mono text-primary">
                      [{entry.timestamp}]
                    </span>
                    <span className="font-medium text-secondary">
                      {entry.speaker}:
                    </span>{" "}
                    <span className="text-accent">{entry.text}</span>
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
