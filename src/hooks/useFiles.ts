import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile, getFilesByCase, deleteFile } from "@/services/fileService/fileService";

export const fileKeys = {
  all: ["files"] as const,
  byCase: (caseId: string) => [...fileKeys.all, "case", caseId] as const,
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await uploadFile(formData);
    },
    onSuccess: (_response, variables) => {
      const caseId = variables.get("caseId") as string | null;
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: fileKeys.byCase(caseId) });
      }
    },
  });
};

export const useFilesByCase = (caseId: string | undefined) => {
  const queryClient = useQueryClient();
  return {
    fetch: async () => {
      if (!caseId) throw new Error("caseId is required");
      const response = await getFilesByCase(caseId);
      return response.data;
    },
    invalidate: () => {
      if (caseId) queryClient.invalidateQueries({ queryKey: fileKeys.byCase(caseId) });
    },
  };
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, caseId }: { fileId: string; caseId?: string }) => {
      return await deleteFile(fileId);
    },
    onSuccess: (_response, variables) => {
      if (variables.caseId) {
        queryClient.invalidateQueries({ queryKey: fileKeys.byCase(variables.caseId) });
      } else {
        queryClient.invalidateQueries({ queryKey: fileKeys.all });
      }
    },
  });
};