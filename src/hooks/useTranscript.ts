import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTranscript,
  getTranscriptBySession,
  getTranscriptById,
  updateTranscript,
  deleteTranscript,
  regenerateTranscriptBySession,
  TranscriptData,
} from "@/services/transcriptService/transcriptService";

/**
 * Hook to create a new transcript
 */
export const useCreateTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TranscriptData) => createTranscript(data),
    onSuccess: (response) => {
      // Invalidate the session transcript query
      if (response.transcript?.session) {
        queryClient.invalidateQueries({
          queryKey: ["transcript", "session", response.transcript.session],
        });
      }
      // Also invalidate list queries
      queryClient.invalidateQueries({
        queryKey: ["transcripts"],
      });
    },
  });
};

/**
 * Hook to fetch transcript by session ID
 */
export const useTranscriptBySession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ["transcript", "session", sessionId],
    queryFn: () => getTranscriptBySession(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch transcript by ID
 */
export const useTranscriptById = (transcriptId: string | undefined) => {
  return useQuery({
    queryKey: ["transcript", "id", transcriptId],
    queryFn: () => getTranscriptById(transcriptId!),
    enabled: !!transcriptId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update a transcript
 */
export const useUpdateTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transcriptId,
      data,
    }: {
      transcriptId: string;
      data: Partial<TranscriptData>;
    }) => updateTranscript(transcriptId, data),
    onSuccess: (response) => {
      // Invalidate specific transcript
      if (response.transcript?._id) {
        queryClient.invalidateQueries({
          queryKey: ["transcript", "id", response.transcript._id],
        });
      }
      // Invalidate session transcript
      if (response.transcript?.session) {
        queryClient.invalidateQueries({
          queryKey: ["transcript", "session", response.transcript.session],
        });
      }
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: ["transcripts"],
      });
    },
  });
};

/**
 * Hook to delete a transcript
 */
export const useDeleteTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transcriptId: string) => deleteTranscript(transcriptId),
    onSuccess: () => {
      // Invalidate all transcript queries
      queryClient.invalidateQueries({
        queryKey: ["transcript"],
      });
      queryClient.invalidateQueries({
        queryKey: ["transcripts"],
      });
    },
  });
};

/**
 * Hook to regenerate transcript from session audio
 */
export const useRegenerateTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => regenerateTranscriptBySession(sessionId),
    onSuccess: (_response, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: ["transcript", "session", sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transcripts"],
      });
    },
  });
};
