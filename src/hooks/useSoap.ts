import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateSoapNote,
  createSoapNote,
  getSoapNotesBySession,
  getSoapNoteById,
  updateSoapNote,
  approveSoapNote,
  deleteSoapNote,
  type GenerateSoapNoteRequest,
  type CreateSoapNoteRequest,
  type UpdateSoapNoteRequest,
} from "@/services/soapService/soapService";
import { sessionKeys } from "./useSessions";

// Query Keys
export const soapKeys = {
  all: ["soap"] as const,
  bySession: (sessionId: string) =>
    [...soapKeys.all, "session", sessionId] as const,
  detail: (id: string) => [...soapKeys.all, "detail", id] as const,
};

// Get SOAP notes by session ID
export const useSoapNotesBySession = (
  sessionId: string | undefined,
  params?: { status?: string; framework?: string },
) => {
  const queryKey = [
    "soap-status",
    params
      ? [...soapKeys.bySession(sessionId || ""), params]
      : soapKeys.bySession(sessionId || ""),
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID is required");
      return await getSoapNotesBySession(sessionId, params);
    },
    enabled: !!sessionId,
  });
};

// Get SOAP note by ID
export const useSoapNoteById = (soapId: string | undefined) => {
  return useQuery({
    queryKey: soapKeys.detail(soapId || ""),
    queryFn: async () => {
      if (!soapId) throw new Error("SOAP note ID is required");
      return await getSoapNoteById(soapId);
    },
    enabled: !!soapId,
  });
};

// Generate SOAP note from transcript (AI)
export const useGenerateSoapNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateSoapNoteRequest) => {
      return await generateSoapNote(data);
    },
    onSuccess: (response, variables) => {
      // Invalidate SOAP notes list for this session
      queryClient.invalidateQueries({
        queryKey: soapKeys.bySession(variables.sessionId),
      });
      // Invalidate session detail (to update hasSoapNote flag)
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
    },
  });
};

// Create SOAP note manually
export const useCreateSoapNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSoapNoteRequest) => {
      return await createSoapNote(data);
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: soapKeys.bySession(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
    },
  });
};

// Update SOAP note
export const useUpdateSoapNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      soapId,
      data,
    }: {
      soapId: string;
      data: UpdateSoapNoteRequest;
    }) => {
      return await updateSoapNote(soapId, data);
    },
    onSuccess: (response, variables) => {
      // Invalidate the specific SOAP note
      queryClient.invalidateQueries({
        queryKey: soapKeys.detail(variables.soapId),
      });
      // Invalidate list (sessionId comes from response)
      if (response.soapNote?.session) {
        const sessionId =
          typeof response.soapNote.session === "string"
            ? response.soapNote.session
            : response.soapNote.session;
        queryClient.invalidateQueries({
          queryKey: soapKeys.bySession(sessionId),
        });
      }
    },
  });
};

// Approve SOAP note
export const useApproveSoapNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soapId: string) => {
      return await approveSoapNote(soapId);
    },
    onSuccess: (response, soapId) => {
      queryClient.invalidateQueries({
        queryKey: soapKeys.detail(soapId),
      });
      if (response.soapNote?.session) {
        const sessionId =
          typeof response.soapNote.session === "string"
            ? response.soapNote.session
            : response.soapNote.session;
        queryClient.invalidateQueries({
          queryKey: soapKeys.bySession(sessionId),
        });
      }
    },
  });
};

// Delete SOAP note
export const useDeleteSoapNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soapId: string) => {
      return await deleteSoapNote(soapId);
    },
    onSuccess: () => {
      // Invalidate all SOAP queries since we don't have sessionId in delete response
      queryClient.invalidateQueries({
        queryKey: soapKeys.all,
      });
    },
  });
};
