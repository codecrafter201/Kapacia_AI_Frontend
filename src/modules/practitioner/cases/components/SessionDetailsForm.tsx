import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface SessionDetailsFormProps {
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  sessionDate: string;
  onSessionDateChange: (date: string) => void;
  sessionLanguage: string;
  onSessionLanguageChange: (language: string) => void;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
}

export const SessionDetailsForm: React.FC<SessionDetailsFormProps> = ({
  sessionName,
  onSessionNameChange,
  sessionDate,
  onSessionDateChange,
  sessionLanguage,
  onSessionLanguageChange,
  remarks,
  onRemarksChange,
}) => {
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    onSessionLanguageChange(newLanguage);
    if (newLanguage === "mandarin") {
      toast.info("PII Masking automatically disabled for Mandarin");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-secondary text-xl">Session Details</h2>
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block mb-2 text-secondary text-sm">
            Session Name
          </label>
          <Input
            type="text"
            value={sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            placeholder="e.g. Intake Session"
            className="bg-primary/5 border-0 w-full text-accent text-sm"
          />
        </div>
        {/* Session Date */}
        <div>
          <label className="block mb-2 text-secondary text-sm">
            Session Date
          </label>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => onSessionDateChange(e.target.value)}
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
              onChange={handleLanguageChange}
              className="bg-primary/5 px-3 py-2 focus:border-primary/40 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full text-accent text-sm appearance-none"
            >
              <option value="english">English</option>
              <option value="mandarin">Mandarin</option>
            </select>
            <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-accent -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-2 text-secondary text-sm">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="Add remarks"
            rows={3}
            className="bg-primary/5 px-3 py-2 rounded-lg w-full text-accent text-sm resize-none"
          />
        </div>
      </div>
    </Card>
  );
};
