import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  Triangle,
  Pause,
  Loader2,
  Trash2,
  Monitor,
} from "lucide-react";

interface AudioRecordingPanelProps {
  waveformRef: React.RefObject<HTMLDivElement | null>;
  isRecording: boolean;
  recordingTime: string;
  captureMode: "mic" | "mic+system";
  activeSource: "mic" | "system" | "both" | "none";
  micLevel: number;
  systemLevel: number;
  isPaused: boolean;
  isStarting: boolean;
  consent: boolean;
  systemAudioConsent: boolean;
  createSessionMutationPending: boolean;
  startRecordingMutationPending: boolean;
  sessionStartTime: string | null;
  sessionLanguage: string;
  fileSizeMb: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResetRecording: () => void;
}

export const AudioRecordingPanel: React.FC<AudioRecordingPanelProps> = ({
  waveformRef,
  isRecording,
  recordingTime,
  captureMode,
  activeSource,
  micLevel,
  systemLevel,
  isPaused,
  isStarting,
  consent,
  systemAudioConsent,
  createSessionMutationPending,
  startRecordingMutationPending,
  sessionStartTime,
  sessionLanguage,
  fileSizeMb,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResetRecording,
}) => {
  const isStartDisabled =
    !consent ||
    (captureMode === "mic+system" && !systemAudioConsent) ||
    isStarting ||
    createSessionMutationPending ||
    startRecordingMutationPending;

  return (
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
        <div className="mb-6 font-mono text-primary text-4xl">{recordingTime}</div>

        {/* Audio Source Indicators - only show when recording with system audio */}
        {isRecording && captureMode === "mic+system" && (
          <div className="flex gap-4 bg-gray-50 mb-6 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Mic
                className={`w-4 h-4 ${
                  activeSource === "mic" || activeSource === "both"
                    ? "text-green-500"
                    : "text-gray-300"
                }`}
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
                className={`w-4 h-4 ${
                  activeSource === "system" || activeSource === "both"
                    ? "text-blue-500"
                    : "text-gray-300"
                }`}
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

        {/* Active Source Label */}
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
              onClick={onStartRecording}
              disabled={isStartDisabled}
              className={`flex items-center gap-2 px-6 ${
                isStartDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/80"
              } text-white`}
            >
              {isStarting ||
              createSessionMutationPending ||
              startRecordingMutationPending ? (
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
              createSessionMutationPending ||
              startRecordingMutationPending
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
              <p>Recording indicator will be visible throughout session</p>
              <p className="flex justify-center items-center gap-1">
                <span>🔒</span> Audio will be encrypted and stored in Singapore
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Stop, Pause, and Reset Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Button
                onClick={onStopRecording}
                variant="destructive"
                className="flex items-center gap-2 px-6"
              >
                <Square className="fill-current w-4 h-4" />
                Stop Recording
              </Button>
              <Button
                onClick={onPauseRecording}
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
                onClick={onResetRecording}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-6 text-white"
              >
                <Trash2 className="w-4 h-4" />
                Clear Audio
              </Button>
            </div>

            {/* Session Info */}
            <div className="space-x-2 text-accent text-sm text-center">
              <span>Session Started: {sessionStartTime || "Not started"}</span>
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
  );
};
