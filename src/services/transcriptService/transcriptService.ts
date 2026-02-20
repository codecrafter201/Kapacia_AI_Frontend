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
}

export interface TranscriptResponse {
  _id: string;
  session: string;
  rawText: string;
  editedText: string | null;
  isEdited: boolean;
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

export const getTranscriptBySession = async (sessionId: string) => {
  return GetApiData(`/transcript/session/${sessionId}`, "GET");
};

export const regenerateTranscriptBySession = async (sessionId: string) => {
  return GetApiData(`/transcript/session/${sessionId}/regenerate`, "POST");
};

export const getTranscriptById = async (transcriptId: string) => {
  return GetApiData(`/transcript/${transcriptId}`, "GET");
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
