import { useState } from "react";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import fixWebmDuration from "fix-webm-duration";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
import {
  RecordHeader,
  SessionDetailsForm,
  PatientConsentForm,
  AdvancedOptionsForm,
  AudioRecordingPanel,
  TranscriptPanel,
  RecordingWarnings,
  RecordingActions,
  RECORDING_TIME_LIMIT,
  formatBytesToMb,
  getCurrentDate,
} from "./components";

export const RecordSessionPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Audio capture mode state
  const [captureMode, setCaptureMode] = useState<"mic" | "mic+system">("mic");
  const [systemAudioConsent, setSystemAudioConsent] = useState(false);

  // Audio level monitoring state
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [activeSource, setActiveSource] = useState<
    "mic" | "system" | "both" | "none"
  >("none");

  // Audio context and stream refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const desktopStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  // Audio level analysis refs
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const levelMonitorIntervalRef = useRef<number | null>(null);

  // API mutations
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

  const waveformRef = useRef<HTMLDivElement>(null) as React.RefObject<
    HTMLDivElement | null
  >;
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
                .map((segment: Record<string, unknown>) => {
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
            const soapPayload = {
              sessionId: currentSessionId,
              framework: "SOAP" as const,
              temperature: 0.2,
              maxTokens: 1200,
              ...(transcriptTextForSoap && { transcriptText: transcriptTextForSoap }),
            };

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
      <RecordHeader caseId={caseId!} />

      {/* Session Details */}
      <SessionDetailsForm
        sessionDate={sessionDate}
        onSessionDateChange={setSessionDate}
        sessionLanguage={sessionLanguage}
        onSessionLanguageChange={(language) => {
          setSessionLanguage(language);
          if (language === "mandarin") {
            setPiiMasking(false);
          }
        }}
      />

      {/* Patient Consent */}
      <PatientConsentForm
        consent={consent}
        onConsentChange={setConsent}
        patientSignature={patientSignature}
        onPatientSignatureChange={setPatientSignature}
        consentDate={consentDate}
        onConsentDateChange={setConsentDate}
        captureMode={captureMode}
        systemAudioConsent={systemAudioConsent}
        onSystemAudioConsentChange={setSystemAudioConsent}
      />

      {/* Advanced Options */}
      <AdvancedOptionsForm
        captureMode={captureMode}
        onCaptureModeChange={(mode) => {
          setCaptureMode(mode);
          if (mode === "mic") {
            setSystemAudioConsent(false);
          }
        }}
        isRecording={isRecording}
        sessionLanguage={sessionLanguage}
        piiMasking={piiMasking}
        onPiiMaskingChange={setPiiMasking}
      />

      {/* Audio Recording */}
      <AudioRecordingPanel
        waveformRef={waveformRef}
        isRecording={isRecording}
        recordingTime={recordingTime}
        captureMode={captureMode}
        activeSource={activeSource}
        micLevel={micLevel}
        systemLevel={systemLevel}
        isPaused={isPaused}
        isStarting={isStarting}
        consent={consent}
        systemAudioConsent={systemAudioConsent}
        createSessionMutationPending={createSessionMutation.isPending}
        startRecordingMutationPending={startRecordingMutation.isPending}
        sessionStartTime={sessionStartTime}
        sessionLanguage={sessionLanguage}
        fileSizeMb={fileSizeMb}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPauseRecording={handlePauseRecording}
        onResetRecording={handleResetRecording}
      />

      {/* Transcript Section */}
      <TranscriptPanel
        isRecording={isRecording}
        allowTranscript={allowTranscript}
        onAllowTranscriptChange={setAllowTranscript}
        isTranscriptionConnected={isTranscriptionConnected}
        transcriptionError={transcriptionError}
        transcriptEntries={transcriptEntries}
        currentPartialTranscript={currentPartialTranscript}
      />

      {/* Warning Messages */}
      <RecordingWarnings
        isRecording={isRecording}
        recordingTime={recordingTime}
      />

      {/* Action Buttons */}
      <RecordingActions
        caseId={caseId!}
        hasRecordedBlob={!!recordedBlobRef.current}
        onSaveSession={handleSaveSession}
        createSessionMutationPending={createSessionMutation.isPending}
        stopRecordingMutationPending={stopRecordingMutation.isPending}
      />
    </div>
  );
};
