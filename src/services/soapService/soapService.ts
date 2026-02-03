import { GetApiData } from "../../utils/http-client";
export interface SoapContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary?: string;
}

export interface SoapNote {
  _id: string;
  session: string;
  version: number;
  framework: string;
  content: SoapContent;
  contentText: string;
  generatedBy: string;
  aiModelVersion?: string;
  piiMasked: boolean;
  maskingMetadata?: Record<string, unknown>;
  status: "Draft" | "Reviewed" | "Approved";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSoapNoteRequest {
  sessionId: string;
  transcriptId?: string;
  transcriptText?: string;
  framework?: "SOAP" | "DAP";
  temperature?: number;
  maxTokens?: number;
  piiMasked?: boolean;
  maskingMetadata?: Record<string, unknown>;
}

export interface GenerateSoapNoteResponse {
  success: boolean;
  message: string;
  soapNote: SoapNote;
  stats?: {
    modelId: string;
  };
}

export interface GetSoapNotesBySessionResponse {
  success: boolean;
  message: string;
  soapNotes: SoapNote[];
  stats: {
    total: number;
    draft: number;
    reviewed: number;
    approved: number;
  };
}

export interface CreateSoapNoteRequest {
  sessionId: string;
  framework: "SOAP" | "DAP";
  content: SoapContent;
  contentText: string;
  generatedBy?: string;
  aiModelVersion?: string;
  piiMasked?: boolean;
  maskingMetadata?: Record<string, unknown>;
}

export interface UpdateSoapNoteRequest {
  content?: SoapContent;
  contentText?: string;
  piiMasked?: boolean;
  maskingMetadata?: Record<string, unknown>;
  status?: "Draft" | "Reviewed";
}

/**
 * Generate a SOAP note from a transcript using AI
 */
export const generateSoapNote = async (
  data: GenerateSoapNoteRequest,
): Promise<GenerateSoapNoteResponse> => {
  const response = await GetApiData("/soap/generate", "POST", data, true);
  return response.data;
};

/**
 * Create a SOAP note manually
 */
export const createSoapNote = async (
  data: CreateSoapNoteRequest,
): Promise<{ success: boolean; message: string; soapNote: SoapNote }> => {
  return GetApiData("/soap", "POST", data, true);
};

/**
 * Get all SOAP notes for a session
 */
export const getSoapNotesBySession = async (
  sessionId: string,
  params?: { status?: string; framework?: string },
): Promise<GetSoapNotesBySessionResponse> => {
  const queryString = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  const response = await GetApiData(
    `/soap/session/${sessionId}${queryString}`,
    "GET",
    null,
    true,
  );
  return response.data;
};

/**
 * Get a single SOAP note by ID
 */
export const getSoapNoteById = async (
  id: string,
): Promise<{ success: boolean; message: string; soapNote: SoapNote }> => {
  return GetApiData(`/soap/${id}`, "GET", null, true);
};

/**
 * Update a SOAP note
 */
export const updateSoapNote = async (
  id: string,
  data: UpdateSoapNoteRequest,
): Promise<{ success: boolean; message: string; soapNote: SoapNote }> => {
  return GetApiData(`/soap/${id}`, "PUT", data, true);
};

/**
 * Approve a SOAP note
 */
export const approveSoapNote = async (
  id: string,
): Promise<{ success: boolean; message: string; soapNote: SoapNote }> => {
  return GetApiData(`/soap/${id}/approve`, "POST", null, true);
};

/**
 * Delete a SOAP note
 */
export const deleteSoapNote = async (
  id: string,
): Promise<{ success: boolean; message: string; data: { id: string } }> => {
  return GetApiData(`/soap/${id}`, "DELETE", null, true);
};
