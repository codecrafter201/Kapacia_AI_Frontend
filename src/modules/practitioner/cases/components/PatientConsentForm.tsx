import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Monitor } from "lucide-react";

interface PatientConsentFormProps {
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  patientSignature: string;
  onPatientSignatureChange: (signature: string) => void;
  consentDate: string;
  onConsentDateChange: (date: string) => void;
  captureMode: "mic" | "mic+system";
  systemAudioConsent: boolean;
  onSystemAudioConsentChange: (consent: boolean) => void;
}

export const PatientConsentForm: React.FC<PatientConsentFormProps> = ({
  consent,
  onConsentChange,
  patientSignature,
  onPatientSignatureChange,
  consentDate,
  onConsentDateChange,
  captureMode,
  systemAudioConsent,
  onSystemAudioConsentChange,
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-secondary text-xl">Patient Consent</h2>
      <div className="space-y-3 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={() => onConsentChange(!consent)}
            className="mt-1 rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary shrink-0"
          />
          <div className="text-secondary text-sm">
            <p className="mb-1">
              Patient has been informed about session recording and consents to:
            </p>
            <ul className="space-y-1 pl-5 list-disc">
              <li>Audio recording</li>
              <li>Data storage in Singapore</li>
              <li>
                AI-assisted transcription & note generation (with human review)
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
              onChange={() => onSystemAudioConsentChange(!systemAudioConsent)}
              className="mt-1 rounded-full focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600 shrink-0"
            />
            <div className="text-secondary text-sm">
              <p className="flex items-center gap-2 mb-1 font-medium">
                <Monitor className="w-4 h-4" />
                System Audio Recording Consent
              </p>
              <ul className="space-y-1 pl-5 list-disc">
                <li>Recording system/desktop audio (e.g., Zoom/Meet calls)</li>
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
            onChange={(e) => onPatientSignatureChange(e.target.value)}
            placeholder="Enter initials"
            className="bg-primary/5 border-0 w-full text-accent text-sm"
          />
        </div>

        <div>
          <label className="block mb-2 text-secondary text-sm">Date</label>
          <Input
            type="date"
            value={consentDate}
            onChange={(e) => onConsentDateChange(e.target.value)}
            className="bg-primary/5 border-0 w-full text-accent text-sm"
          />
        </div>
      </div>
    </Card>
  );
};
