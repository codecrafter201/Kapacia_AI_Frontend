// FIXED TranscriptionWebSocket service - improved error handling and connection management

import { io, Socket } from "socket.io-client";

export interface TranscriptionMessage {
  type: "transcript" | "error" | "status" | "complete";
  data?: {
    transcript?: string;
    isFinal?: boolean;
    timestamp?: number;
    speaker?: string;
    confidence?: number;
    piiRedacted?: boolean;
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
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isConnecting: boolean = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.isConnecting = true;
      
      const serverUrl =
        import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
        "http://localhost:3001";

      try {
        console.log(`[WebSocket] Connecting to ${serverUrl} for session ${this.sessionId}`);

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          console.error("[WebSocket] Connection timeout");
          this.isConnecting = false;
          reject(new Error("Connection timeout"));
        }, 15000);

        // Create Socket.IO connection with auth in handshake
        this.socket = io(serverUrl, {
          auth: {
            token,
            sessionId: this.sessionId,
          },
          transports: ["websocket", "polling"],
          reconnection: false, // We'll handle reconnection manually
          timeout: 10000,
          forceNew: true, // Force new connection
        });

        // Connection established
        this.socket.on("connect", () => {
          console.log("[WebSocket] Socket.IO connected for transcription");
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Start transcription immediately after connection
          this.startTranscription();
          this.onOpenCallback?.();
          resolve();
        });

        // Listen for transcription events
        this.socket.on("transcript", (message: TranscriptionMessage) => {
          this.handleTranscriptMessage(message);
        });

        // Listen for error events
        this.socket.on("transcription-error", (error: string) => {
          console.error("[WebSocket] Transcription error:", error);
          this.onMessageCallback?.({
            type: "error",
            error,
          });
        });

        // Connection error
        this.socket.on("connect_error", (error) => {
          console.error("[WebSocket] Connection error:", error);
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this.isConnecting = false;
          
          const err = new Error(
            `Connection failed: ${error.message || "Unknown error"}`,
          );
          this.onErrorCallback?.(err);
          reject(err);
        });

        // Disconnection
        this.socket.on("disconnect", (reason) => {
          console.log("[WebSocket] Disconnected:", reason);
          this.transcriptionStarted = false;
          this.transcriptionReady = false;
          this.isConnecting = false;
          
          // Clear pending chunks on disconnect
          this.pendingChunks = [];
          
          this.onCloseCallback?.();
          
          // Attempt reconnection for certain disconnect reasons
          if (reason === "io server disconnect" || reason === "transport close") {
            this.attemptReconnection(token);
          }
        });

      } catch (error) {
        this.isConnecting = false;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        reject(error);
      }
    });
  }

  private handleTranscriptMessage(message: TranscriptionMessage): void {
    if (message.type === "status") {
      if (message.status?.includes("ready") || message.status?.includes("started")) {
        this.transcriptionReady = true;
        console.log("[WebSocket] Transcription backend is ready");
        
        // Process any pending chunks
        this.processPendingChunks();
      }
    }
    
    this.onMessageCallback?.(message);
  }

  private processPendingChunks(): void {
    if (this.pendingChunks.length > 0) {
      console.log(`[WebSocket] Processing ${this.pendingChunks.length} pending audio chunks`);
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

  private attemptReconnection(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnection attempts reached");
      this.onErrorCallback?.(new Error("Max reconnection attempts reached"));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // Exponential backoff, max 10s
    
    console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error(`[WebSocket] Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        this.attemptReconnection(token);
      });
    }, delay);
  }

  startTranscription(options = {}): void {
    if (!this.socket?.connected) {
      console.warn("[WebSocket] Socket not connected, cannot start transcription");
      return;
    }

    if (this.transcriptionStarted) {
      console.log("[WebSocket] Transcription already started, skipping");
      return;
    }

    console.log("[WebSocket] Starting transcription...");
    this.socket.emit("start-transcription", {
      sessionId: this.sessionId,
      languageCode: "en-US",
      sampleRate: 16000,
      encoding: "pcm",
      numberOfChannels: 1,
      showSpeakerLabel: true,
      ...options,
    });

    this.transcriptionStarted = true;
  }

  sendAudioChunk(audioChunk: Blob): void {
    if (!this.socket?.connected) {
      console.warn("[WebSocket] Socket not connected, cannot send audio chunk");
      return;
    }

    // Buffer chunks if transcription is not ready yet
    if (!this.transcriptionReady) {
      this.pendingChunks.push(audioChunk);
      
      // Limit buffer to prevent memory issues (keep last 50 chunks ~400KB)
      if (this.pendingChunks.length > 50) {
        this.pendingChunks.shift();
        console.warn("[WebSocket] Pending buffer full, dropping oldest chunk");
      }
      
      console.log(`[WebSocket] Transcription not ready yet, buffering chunk (${this.pendingChunks.length} pending)`);
      return;
    }

    try {
      console.log(
        `[WebSocket] Converting blob to buffer: ${audioChunk.size} bytes, type: ${audioChunk.type}`,
      );

      // Convert Blob to ArrayBuffer
      audioChunk
        .arrayBuffer()
        .then((buffer) => {
          if (!this.socket?.connected) {
            console.warn("[WebSocket] Socket disconnected before sending chunk");
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

          // Emit buffer directly
          this.socket.emit("audio-chunk", buffer);
        })
        .catch((error) => {
          console.error("[WebSocket] Error converting blob to buffer:", error);
          this.onErrorCallback?.(new Error("Audio processing error"));
        });
    } catch (error) {
      console.error("[WebSocket] Error sending audio chunk:", error);
      this.onErrorCallback?.(new Error("Audio sending error"));
    }
  }

  stopTranscription(): void {
    if (this.socket?.connected) {
      console.log("[WebSocket] Stopping transcription...");
      this.socket.emit("stop-transcription");
      this.transcriptionStarted = false;
      this.transcriptionReady = false;
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
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.socket) {
      this.stopTranscription();
      this.socket.disconnect();
      this.socket = null;
      this.transcriptionStarted = false;
      this.transcriptionReady = false;
      this.pendingChunks = [];
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get connection status for debugging
  getStatus(): {
    connected: boolean;
    transcriptionStarted: boolean;
    transcriptionReady: boolean;
    pendingChunks: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      transcriptionStarted: this.transcriptionStarted,
      transcriptionReady: this.transcriptionReady,
      pendingChunks: this.pendingChunks.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}