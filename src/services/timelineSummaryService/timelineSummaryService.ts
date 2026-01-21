import { GetApiData } from "@/utils/http-client";

export const timelineSummaryService = {
  generateWithAI: async (data: {
    caseId: string;
    periodStart: string;
    periodEnd: string;
  }) => {
    const response = await GetApiData(
      "/timeline-summary/generate-with-ai",
      "POST",
      data,
    );
    return response.data;
  },

  getTimelineSummariesByCase: async (caseId: string, status?: string) => {
    const endpoint = status
      ? `/timeline-summary/case/${caseId}?status=${status}`
      : `/timeline-summary/case/${caseId}`;
    const response = await GetApiData(endpoint, "GET", null);
    return response.data;
  },

  getTimelineSummaryById: async (summaryId: string) => {
    const response = await GetApiData(
      `/timeline-summary/${summaryId}`,
      "GET",
      null,
    );
    return response.data;
  },

  approveTimelineSummary: async (summaryId: string) => {
    const response = await GetApiData(
      `/timeline-summary/${summaryId}/approve`,
      "POST",
      null,
    );
    return response.data;
  },

  deleteTimelineSummary: async (summaryId: string) => {
    const response = await GetApiData(
      `/timeline-summary/${summaryId}`,
      "DELETE",
      null,
    );
    return response.data;
  },
};
