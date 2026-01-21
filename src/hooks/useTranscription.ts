// CORRECTED useTranscription hook - removed duplicate startTranscription call

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TranscriptionWebSocket,
  type TranscriptionMessage,
} from "@/services/websocket/transcriptionWebSocket";

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  isFinal: boolean;
}

export const useTranscription = () => {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>(
    [],
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<TranscriptionWebSocket | null>(null);
  const [currentPartialTranscript, setCurrentPartialTranscript] =
    useState<string>("");

  const connect = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setError("Session ID is required");
      return;
    }

    try {
      // Get token from localStorage (stored as 'auth_token', not under user)
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("Authentication token not found");
        return;
      }

      // Create WebSocket connection
      const ws = new TranscriptionWebSocket(sessionId);
      wsRef.current = ws;

      // Set up event handlers
      ws.onOpen(() => {
        setIsConnected(true);
        setError(null);
        console.log("Transcription WebSocket connected");
      });

      ws.onMessage((message: TranscriptionMessage) => {
        console.log("Received transcription message:", message);

        if (message.type === "transcript" && message.data) {
          const { transcript, isFinal, timestamp, speaker } = message.data;

          if (isFinal) {
            // Add final transcript to entries
            const newEntry: TranscriptEntry = {
              id: `transcript-${Date.now()}-${Math.random()}`,
              timestamp: formatTimestamp(timestamp || Date.now()),
              speaker: speaker || "Unknown",
              text: transcript || "",
              isFinal: true,
            };

            setTranscriptEntries((prev) => [...prev, newEntry]);
            setCurrentPartialTranscript("");
          } else {
            // Update partial transcript
            setCurrentPartialTranscript(transcript || "");
          }
        } else if (message.type === "error") {
          setError(message.error || "Transcription error occurred");
        } else if (message.type === "status") {
          console.log("Status:", message.status);
        }
      });

      ws.onError((err) => {
        setError(err.message);
        setIsConnected(false);
      });

      ws.onClose(() => {
        setIsConnected(false);
        console.log("Transcription WebSocket disconnected");
      });

      // Connect
      await ws.connect(token);
    } catch (err) {
      console.error("Failed to connect to transcription service:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendAudioChunk = useCallback((audioChunk: Blob) => {
    if (!wsRef.current) {
      console.warn("[useTranscription] WebSocket not initialized");
      return;
    }

    // Check connection
    if (!wsRef.current.isConnected()) {
      console.warn("[useTranscription] WebSocket not connected yet");
      return;
    }

    // Send the chunk
    wsRef.current.sendAudioChunk(audioChunk);
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscriptEntries([]);
    setCurrentPartialTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    transcriptEntries,
    currentPartialTranscript,
    isConnected,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    clearTranscripts,
  };
};

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  const totalSeconds = Math.floor(timestamp / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
