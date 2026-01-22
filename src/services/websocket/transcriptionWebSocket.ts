// CORRECTED TranscriptionWebSocket service - fully aligned with backend

import { io, Socket } from "socket.io-client";

export interface TranscriptionMessage {
  type: "transcript" | "error" | "status" | "complete";
  data?: {
    transcript?: string;
    isFinal?: boolean;
    timestamp?: number;
    speaker?: string;
  };
  error?: string;
  status?: string;
}

export class TranscriptionWebSocket {
  private socket: Socket | null = null;
  private sessionId: string;
  private onMessageCallback?: (message: TranscriptionMessage) => void;
  private onErrorCallback?: (error: Error) => void;
  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;
  private transcriptionStarted: boolean = false;
  private transcriptionReady: boolean = false;
  private pendingChunks: Blob[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverUrl =
        import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
        "http://localhost:3001";

      try {
        // Create Socket.IO connection with auth in handshake
        this.socket = io(serverUrl, {
          auth: {
            token,
            sessionId: this.sessionId,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        // Connection established
        this.socket.on("connect", () => {
          console.log("Socket.IO connected for transcription");

          this.startTranscription();
          
          // Mark as ready immediately after starting transcription
          setTimeout(() => {
            if (!this.transcriptionReady) {
              console.log("[WebSocket] Force marking transcription as ready after 2 seconds");
              this.transcriptionReady = true;
            }
          }, 2000);
          
          this.onOpenCallback?.();
          resolve();
        });

        // Listen for transcription events
        this.socket.on("transcript", (message: TranscriptionMessage) => {
          console.log("[WebSocket] Received transcript message:", message);
          
          if (message.type === "status" && message.status?.includes("ready")) {
            this.transcriptionReady = true;
            console.log("Transcription backend is ready");
            
            // Process any pending chunks
            if (this.pendingChunks.length > 0) {
              console.log(`Processing ${this.pendingChunks.length} pending audio chunks`);
              const chunks = [...this.pendingChunks];
              this.pendingChunks = [];
              
              // Process chunks with small delays to avoid overwhelming the backend
              chunks.forEach((chunk, index) => {
                setTimeout(() => {
                  this.sendAudioChunk(chunk);
                }, index * 10); // 10ms delay between chunks
              });
            }
          }
          this.onMessageCallback?.(message);
        });

        // Listen for error events
        this.socket.on("transcription-error", (error: string) => {
          console.error("Transcription error:", error);
          
          // If we get an error and transcription was never ready, mark as ready anyway
          // This allows audio to flow even if AWS has issues
          if (!this.transcriptionReady) {
            console.log("[WebSocket] Marking transcription as ready despite error to allow audio flow");
            this.transcriptionReady = true;
            
            // Process any pending chunks
            if (this.pendingChunks.length > 0) {
              console.log(`Processing ${this.pendingChunks.length} pending audio chunks after error`);
              const chunks = [...this.pendingChunks];
              this.pendingChunks = [];
              
              chunks.forEach((chunk, index) => {
                setTimeout(() => {
                  this.sendAudioChunk(chunk);
                }, index * 10);
              });
            }
          }
          
          this.onMessageCallback?.({
            type: "error",
            error,
          });
        });

        // Connection error
        this.socket.on("connect_error", (error) => {
          console.error("Socket.IO connection error:", error);
          const err = new Error(
            `Connection failed: ${error.message || "Unknown error"}`,
          );
          this.onErrorCallback?.(err);
          reject(err);
        });

        // Disconnection
        this.socket.on("disconnect", (reason) => {
          console.log("Socket.IO disconnected:", reason);
          this.transcriptionStarted = false;
          this.onCloseCallback?.();
        });

        // Reconnection attempts
        this.socket.on("reconnect_attempt", (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}`);
        });

        this.socket.on("reconnect", (attemptNumber) => {
          console.log(`Reconnected after ${attemptNumber} attempts`);
          this.transcriptionStarted = false;
          this.transcriptionReady = false;
          this.pendingChunks = [];
          // Restart transcription after reconnection
          this.startTranscription();
          this.onOpenCallback?.();
        });

        this.socket.on("reconnect_failed", () => {
          console.error("Reconnection failed");
          this.onErrorCallback?.(new Error("Failed to reconnect"));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  startTranscription(options = {}): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot start transcription");
      return;
    }

    if (this.transcriptionStarted) {
      console.log("Transcription already started, skipping");
      return;
    }

    console.log("Starting transcription...");
    this.socket.emit("start-transcription", {
      sessionId: this.sessionId,
      languageCode: "en-US",
      sampleRate: 16000, // Changed from sampleRateHertz
      encoding: "pcm", // Changed from OGG_OPUS - AWS expects PCM
      numberOfChannels: 1,
      showSpeakerLabel: true,
      ...options,
    });

    this.transcriptionStarted = true;
  }

  sendAudioChunk(audioChunk: Blob): void {
    console.log(`[WebSocket] sendAudioChunk called: ${audioChunk.size} bytes, connected: ${this.socket?.connected}, ready: ${this.transcriptionReady}`);
    
    if (!this.socket?.connected) {
      console.warn("[WebSocket] Socket not connected, cannot send audio chunk");
      return;
    }

    // Wait for transcription to be ready
    if (!this.transcriptionReady) {
      this.pendingChunks.push(audioChunk);
      console.log(`[WebSocket] Transcription not ready yet, buffering chunk (${this.pendingChunks.length} pending)`);
      
      // Limit buffer to prevent memory issues
      if (this.pendingChunks.length > 50) {
        this.pendingChunks.shift();
        console.warn("[WebSocket] Pending buffer full, dropping oldest chunk");
      }
      return;
    }

    try {
      console.log(
        `[Audio] Converting blob to buffer: ${audioChunk.size} bytes, type: ${audioChunk.type}`,
      );

      // Convert Blob to ArrayBuffer
      audioChunk
        .arrayBuffer()
        .then((buffer) => {
          if (!this.socket?.connected) {
            console.warn(
              "[WebSocket] Socket disconnected before sending chunk",
            );
            return;
          }

          if (buffer.byteLength === 0) {
            console.warn("[WebSocket] Received empty audio buffer, skipping");
            return;
          }

          // Validate PCM format
          if (buffer.byteLength % 2 !== 0) {
            console.warn(`[WebSocket] Invalid PCM buffer size: ${buffer.byteLength} bytes`);
            return;
          }

          console.log(
            `[WebSocket] Sending PCM audio chunk: ${buffer.byteLength} bytes`,
          );

          // Emit buffer directly (sessionId already in socket auth/connection)
          this.socket.emit("audio-chunk", buffer);
        })
        .catch((error) => {
          console.error("[WebSocket] Error converting blob to buffer:", error);
        });
    } catch (error) {
      console.error("[WebSocket] Error sending audio chunk:", error);
    }
  }

  stopTranscription(): void {
    if (this.socket?.connected) {
      console.log("Stopping transcription...");
      this.socket.emit("stop-transcription");
      this.transcriptionStarted = false;
    }
  }

  sendMessage(message: Record<string, unknown>): void {
    if (this.socket?.connected) {
      this.socket.emit("message", message);
    }
  }

  onMessage(callback: (message: TranscriptionMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  disconnect(): void {
    if (this.socket) {
      this.stopTranscription();
      this.socket.disconnect();
      this.socket = null;
      this.transcriptionStarted = false;
      this.transcriptionReady = false;
      this.pendingChunks = [];
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
