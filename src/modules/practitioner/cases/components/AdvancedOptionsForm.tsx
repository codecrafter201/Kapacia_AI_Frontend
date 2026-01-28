import { Card } from "@/components/ui/card";
import { ChevronDown, Monitor, Info } from "lucide-react";
import { toast } from "react-toastify";

interface AdvancedOptionsFormProps {
  captureMode: "mic" | "mic+system";
  onCaptureModeChange: (mode: "mic" | "mic+system") => void;
  isRecording: boolean;
  sessionLanguage: string;
  piiMasking: boolean;
  onPiiMaskingChange: (enabled: boolean) => void;
}

export const AdvancedOptionsForm: React.FC<AdvancedOptionsFormProps> = ({
  captureMode,
  onCaptureModeChange,
  isRecording,
  sessionLanguage,
  piiMasking,
  onPiiMaskingChange,
}) => {
  const handleCaptureModeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newMode = e.target.value as "mic" | "mic+system";
    onCaptureModeChange(newMode);
  };

  const handlePiiMaskingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (
      e.target.value === "on" &&
      sessionLanguage !== "english"
    ) {
      toast.error(
        "PII Masking can only be enabled with English language"
      );
      return;
    }
    onPiiMaskingChange(e.target.value === "on");
  };

  return (
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
              onChange={handleCaptureModeChange}
              disabled={isRecording}
              className={`bg-white px-3 py-2 pr-10 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-primary text-sm appearance-none border-2 border-blue-200 min-w-50 ${
                isRecording ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="mic">🎤 Microphone Only</option>
              <option value="mic+system">🖥️ Microphone + System Audio</option>
            </select>
            <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

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
              onChange={handlePiiMaskingChange}
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
  );
};
