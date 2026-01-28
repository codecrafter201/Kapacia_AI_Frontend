import { RECORDING_TIME_LIMIT } from "./constants";

interface RecordingWarningsProps {
  isRecording: boolean;
  recordingTime: string;
}

export const RecordingWarnings: React.FC<RecordingWarningsProps> = ({
  isRecording,
  recordingTime,
}) => {
  if (!isRecording) return null;

  return (
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
                  {Math.floor(timeRemaining / 60) !== 1 ? "s" : ""} remaining
                </p>
              </div>
            );
          }
          return null;
        })()}
    </>
  );
};
