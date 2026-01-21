import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSession,
  getSessionsByCase,
  getSessionById,
  updateSession,
  startRecording,
  stopRecording,
  uploadRecording,
  deleteSession,
  // @ts-expect-error - JS module without types
} from "@/services/sessionService/sessionService.js";
import { caseKeys } from "./useCases";

// Query Keys
export const sessionKeys = {
  all: ["sessions"] as const,
  byCase: (caseId: string) => [...sessionKeys.all, "case", caseId] as const,
  detail: (id: string) => [...sessionKeys.all, "detail", id] as const,
};

// Get sessions by case ID
export const useSessionsByCase = (
  caseId: string | undefined,
  params?: { status?: string; language?: string },
) => {
  return useQuery({
    queryKey: [...sessionKeys.byCase(caseId || ""), params],
    queryFn: async () => {
      if (!caseId) throw new Error("Case ID is required");
      const response = await getSessionsByCase(caseId, params || {});
      return response.data;
    },
    enabled: !!caseId,
  });
};

// Get session by ID
export const useSessionById = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID is required");
      const response = await getSessionById(sessionId);
      return response.data;
    },
    enabled: !!sessionId,
  });
};

// Create session mutation
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      caseId: string;
      sessionDate?: string;
      language?: string;
      piiMaskingEnabled?: boolean;
      consentGiven: boolean;
      consentTimestamp?: string;
    }) => {
      const response = await createSession(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate sessions list for this case
      if (data.session?.case?._id || data.session?.case) {
        const caseId =
          typeof data.session.case === "string"
            ? data.session.case
            : data.session.case._id;
        queryClient.invalidateQueries({ queryKey: sessionKeys.byCase(caseId) });
        queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
        queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) });
      }
    },
  });
};

// Update session mutation
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: {
        sessionDate?: string;
        language?: string;
        piiMaskingEnabled?: boolean;
        piiWarningAcknowledged?: boolean;
        consentGiven?: boolean;
        consentTimestamp?: string;
        status?: string;
        errorMessage?: string;
      };
    }) => {
      const response = await updateSession(sessionId, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
      // Invalidate sessions list for this case
      if (data.session?.case?._id || data.session?.case) {
        const caseId =
          typeof data.session.case === "string"
            ? data.session.case
            : data.session.case._id;
        queryClient.invalidateQueries({ queryKey: sessionKeys.byCase(caseId) });
        queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) });
      }
    },
  });
};

// Start recording mutation
export const useStartRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await startRecording(sessionId);
      return response.data;
    },
    onSuccess: (data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
      if (data.session?.case?._id || data.session?.case) {
        const caseId =
          typeof data.session.case === "string"
            ? data.session.case
            : data.session.case._id;
        queryClient.invalidateQueries({ queryKey: sessionKeys.byCase(caseId) });
      }
    },
  });
};

// Stop recording mutation
export const useStopRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: {
        audioUrl?: string;
        audioFileSizeBytes?: number;
        durationSeconds?: number;
      };
    }) => {
      const response = await stopRecording(sessionId, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
      if (data.session?.case?._id || data.session?.case) {
        const caseId =
          typeof data.session.case === "string"
            ? data.session.case
            : data.session.case._id;
        queryClient.invalidateQueries({ queryKey: sessionKeys.byCase(caseId) });
        queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) });
      }
    },
  });
};

// Upload recording mutation
export const useUploadRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      formData,
    }: {
      sessionId: string;
      formData: FormData;
    }) => {
      const response = await uploadRecording(sessionId, formData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
      if (data.session?.case?._id || data.session?.case) {
        const caseId =
          typeof data.session.case === "string"
            ? data.session.case
            : data.session.case._id;
        queryClient.invalidateQueries({ queryKey: sessionKeys.byCase(caseId) });
      }
    },
  });
};

// Delete session mutation
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await deleteSession(sessionId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all session queries
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
};
