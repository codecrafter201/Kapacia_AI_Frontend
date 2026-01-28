import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface SessionDetailsFormProps {
  sessionDate: string;
  onSessionDateChange: (date: string) => void;
  sessionLanguage: string;
  onSessionLanguageChange: (language: string) => void;
}

export const SessionDetailsForm: React.FC<SessionDetailsFormProps> = ({
  sessionDate,
  onSessionDateChange,
  sessionLanguage,
  onSessionLanguageChange,
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
      </div>
    </Card>
  );
};
