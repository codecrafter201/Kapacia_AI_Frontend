import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface RecordHeaderProps {
  caseId: string;
}

export const RecordHeader: React.FC<RecordHeaderProps> = ({ caseId }) => {
  const navigate = useNavigate();

  return (
    <div>
      <Link
        to={`/practitioner/my-cases/${caseId}`}
        onClick={() => navigate(`/practitioner/my-cases/${caseId}`)}
        className="flex items-center gap-2 mr-auto mb-4 text-accent hover:text-secondary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">Back to Case</span>
      </Link>

      <h1 className="text-secondary text-lg sm:text-2xl">Record New Session</h1>
    </div>
  );
};
