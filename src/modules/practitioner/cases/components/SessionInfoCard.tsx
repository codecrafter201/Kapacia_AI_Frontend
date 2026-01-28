import { Card } from "@/components/ui/card";

interface SessionInfoCardProps {
  date: string;
  duration: string;
  language: string;
  practitioner: string;
  consentGiven: boolean;
}

export const SessionInfoCard = ({
  date,
  duration,
  language,
  practitioner,
  consentGiven,
}: SessionInfoCardProps) => {
  return (
    <Card className="bg-primary/5 p-6">
      <h2 className="mb-1 text-secondary text-lg">SESSION INFORMATION</h2>
      <div className="gap-x-6 gap-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-sm">
        <div className="">
          <p className="text-accent text-sm">Date</p>
          <h2 className="text-secondary text-xl">{date}</h2>
        </div>
        <div className="">
          <p className="text-accent text-sm">Duration</p>
          <h2 className="text-secondary text-xl">{duration}</h2>
        </div>
        <div className="">
          <p className="text-accent text-sm">Language</p>
          <h2 className="text-secondary text-xl">{language}</h2>
        </div>
        <div className="">
          <p className="text-accent text-sm">Conducted by</p>
          <h2 className="text-secondary text-xl">{practitioner}</h2>
        </div>
        <div className="">
          <p className="text-accent text-sm">Consent</p>
          <h2 className="text-secondary text-xl">
            {consentGiven ? "✓ Given" : "✗ Not Given"}
          </h2>
        </div>
      </div>
    </Card>
  );
};
