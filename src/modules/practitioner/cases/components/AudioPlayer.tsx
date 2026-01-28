import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Loader2,
} from "lucide-react";
import { AudioStatus } from "@/components/AudioStatus";

interface AudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
  audioError: string | null;
  expiresAt?: string;
  onRetry: () => void;
  onDownload: () => void;
}

export const AudioPlayer = ({
  audioUrl,
  isLoading,
  hasError,
  audioError,
  expiresAt,
  onRetry,
  onDownload,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [duration, setDuration] = useState("00:00:00");
  const [audioProgress, setAudioProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "00:00:00";
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup audio element when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.volume = volume;

    const handleLoadedMetadata = () => {
      setDuration(formatTime(audio.duration));
      setCurrentTime("00:00:00");
      setAudioProgress(0);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      const total = audio.duration || 1;
      setCurrentTime(formatTime(time));
      setAudioProgress((time / total) * 100);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTime("00:00:00");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }

    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audio.duration;

    audio.currentTime = newTime;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-secondary text-lg sm:text-2xl">Audio Recording</h2>
        <AudioStatus
          isLoading={isLoading}
          hasError={hasError}
          hasAudio={!!audioUrl}
          expiresAt={expiresAt}
          onRetry={onRetry}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-accent">Loading audio...</span>
        </div>
      )}

      {/* Error State */}
      {(audioError || hasError) && !isLoading && (
        <div className="bg-red-50 mb-4 p-4 border border-red-200 rounded-lg">
          <p className="mb-2 text-red-700 text-sm">⚠️ Audio Playback Error</p>
          <p className="mb-3 text-red-600 text-xs">
            {audioError || "Unable to load audio file"}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="hover:bg-red-50 border-red-300 text-red-700"
            >
              Try Again
            </Button>
            {audioUrl && (
              <Button
                onClick={onDownload}
                size="sm"
                variant="outline"
                className="hover:bg-blue-50 border-blue-300 text-blue-700"
              >
                Download Audio
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {(audioUrl || isLoading) && !audioError && !hasError && (
        <>
          <audio
            ref={audioRef}
            crossOrigin="anonymous"
            preload="metadata"
            style={{ display: "none" }}
          />

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-primary text-sm">
                {currentTime}
              </span>
              <span className="text-accent text-sm">{duration}</span>
            </div>

            <div
              className="bg-gray-200 hover:bg-gray-300 rounded-full w-full h-2 transition-colors cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="bg-primary rounded-full h-full transition-all duration-100 ease-out"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handleSkipBackward}
              disabled={!audioUrl}
              className="hover:bg-gray-100 disabled:opacity-50 p-2 rounded-full transition-colors disabled:cursor-not-allowed"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack className="w-5 h-5 text-accent" />
            </button>

            <button
              onClick={handlePlayPause}
              disabled={!audioUrl}
              className="flex justify-center items-center bg-primary hover:bg-primary/80 disabled:opacity-50 shadow-lg rounded-full w-12 h-12 transition-colors disabled:cursor-not-allowed"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="fill-white w-6 h-6 text-white" />
              ) : (
                <Play className="fill-white w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              disabled={!audioUrl}
              className="hover:bg-gray-100 disabled:opacity-50 p-2 rounded-full transition-colors disabled:cursor-not-allowed"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5 text-accent" />
            </button>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={toggleMute}
                disabled={!audioUrl}
                className="hover:bg-gray-100 disabled:opacity-50 p-1 rounded transition-colors disabled:cursor-not-allowed"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                <Volume2
                  className={`w-5 h-5 ${
                    isMuted ? "text-gray-400" : "text-accent"
                  }`}
                />
              </button>
              <div className="relative w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  disabled={!audioUrl}
                  className="bg-gray-200 disabled:opacity-50 rounded-full w-full h-1 appearance-none cursor-pointer disabled:cursor-not-allowed volume-slider"
                  style={{
                    background: `linear-gradient(to right, #188aec 0%, #188aec ${
                      (isMuted ? 0 : volume) * 100
                    }%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`,
                  }}
                  aria-label="Volume control"
                />
                <style>{`
                  .volume-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #188aec;
                    cursor: pointer;
                  }
                  .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #188aec;
                    cursor: pointer;
                    border: none;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Audio */}
      {!audioUrl && !isLoading && !audioError && !hasError && (
        <div className="bg-gray-50 p-8 border border-gray-200 rounded-lg text-center">
          <p className="mb-2 text-gray-600">No audio recording available</p>
          <p className="text-gray-500 text-sm">
            This session doesn't have an audio recording yet.
          </p>
        </div>
      )}
    </Card>
  );
};
