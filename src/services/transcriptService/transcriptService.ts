import { GetApiData } from "../../utils/http-client";

export interface TranscriptData {
  sessionId: string;
  rawText: string;
  editedText?: string;
  wordCount?: number;
  languageDetected?: string;
  confidenceScore?: number;
  segments?: any[];
  status?: "Draft" | "Reviewed" | "Approved";
  
  // PII Masking fields
  maskedText?: string;
  maskedEditedText?: string;
  piiMaskingEnabled?: boolean;
  piiMaskingMetadata?: any;
  hasPii?: boolean;
  maskedSegments?: any[];
}

export interface TranscriptResponse {
  _id: string;
  session: string;
  rawText: string;
  editedText: string | null;
  isEdited: boolean;
  
  // PII Masking fields
  maskedText?: string;
  maskedEditedText?: string;
  piiMaskingEnabled?: boolean;
  piiMaskingMetadata?: any;
  hasPii?: boolean;
  maskedSegments?: any[];
  displayMode?: 'masked' | 'unmasked';
  
  wordCount: number;
  languageDetected: string;
  confidenceScore: number | null;
  segments: any[];
  status: "Draft" | "Reviewed" | "Approved";
  createdAt: string;
  updatedAt: string;
}

export const createTranscript = async (data: TranscriptData) => {
  return GetApiData("/transcript", "POST", data);
};

export const getTranscriptBySession = async (sessionId: string, viewUnmasked: boolean = false) => {
  const params = viewUnmasked ? `?viewUnmasked=true` : '';
  return GetApiData(`/transcript/session/${sessionId}${params}`, "GET");
};

export const getTranscriptById = async (transcriptId: string, viewUnmasked: boolean = false) => {
  const params = viewUnmasked ? `?viewUnmasked=true` : '';
  return GetApiData(`/transcript/${transcriptId}${params}`, "GET");
};

export const updateTranscript = async (
  transcriptId: string,
  data: Partial<TranscriptData>,
) => {
  return GetApiData(`/transcript/${transcriptId}`, "PUT", data);
};

export const deleteTranscript = async (transcriptId: string) => {
  return GetApiData(`/transcript/${transcriptId}`, "DELETE");
};

// New PII-related endpoints
export const getPiiAuditLogs = async (sessionId: string, page: number = 1, limit: number = 50) => {
  return GetApiData(`/transcript/session/${sessionId}/pii-audit?page=${page}&limit=${limit}`, "GET");
};

export const getPiiStatistics = async (sessionId: string) => {
  return GetApiData(`/transcript/session/${sessionId}/pii-statistics`, "GET");
};
