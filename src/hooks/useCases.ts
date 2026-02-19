import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllCases,
  getMyCases,
  getCaseById,
  createCase,
  createSelfCase,
  updateCase,
  deleteCase,
  getCaseTimeline,
} from "@/services/caseService/caseService.js";

// Query Keys
export const caseKeys = {
  all: ["cases"] as const,
  allCases: () => [...caseKeys.all, "all"] as const,
  myCases: () => [...caseKeys.all, "my"] as const,
  detail: (id: string) => [...caseKeys.all, "detail", id] as const,
  timeline: (id: string) => [...caseKeys.all, "timeline", id] as const,
};

// Get all cases (Admin)
export const useAllCases = (params?: {
  search?: string;
  status?: string;
  assignedTo?: string;
  tags?: string[] | string;
}) => {
  return useQuery({
    queryKey: [...caseKeys.allCases(), params],
    queryFn: async () => {
      const response = await getAllCases(params || {});
      return response.data;
    },
  });
};

// Get my cases (Practitioner)
export const useMyCases = (params?: {
  search?: string;
  status?: string;
  sortBy?: string;
  tags?: string[] | string;
  limit?: string;
  page?: string;
}) => {
  return useQuery({
    queryKey: [...caseKeys.myCases(), params],
    queryFn: async () => {
      const response = await getMyCases(params || {});
      console.log("🔍 useMyCases - Full Response:", response);
      console.log("🔍 useMyCases - Response Data:", response.data);
      return response.data;
    },
  });
};

// Dashboard preview: fetch only a few cases for cards
export const useMyCasesPreview = (limit = "2") => {
  return useMyCases({ limit, sortBy: "lastSession" });
};

// Get case by ID
export const useCaseById = (caseId: string | undefined) => {
  return useQuery({
    queryKey: caseKeys.detail(caseId || ""),
    queryFn: async () => {
      if (!caseId) throw new Error("Case ID is required");
      const response = await getCaseById(caseId);
      return response.data;
    },
    enabled: !!caseId,
  });
};

// Get case timeline
export const useCaseTimeline = (
  caseId: string | undefined,
  params?: {
    eventType?: string;
    sessionStatus?: string;
    startDate?: string;
    sessionNameSearch?: string;
    endDate?: string;
    allEntries?: boolean;
  },
) => {
  return useQuery({
    queryKey: ["timelinesummary", ...caseKeys.timeline(caseId || ""), params],
    queryFn: async () => {
      if (!caseId) throw new Error("Case ID is required");
      const response = await getCaseTimeline(caseId, params || {});
      return response.data;
    },
    enabled: !!caseId,
  });
};

// Create case mutation (Admin)
export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await createCase(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: caseKeys.allCases() });
      queryClient.invalidateQueries({ queryKey: caseKeys.myCases() });
    },
  });
};

// Practitioners create their own case (self-assigned, always Active)
export const useCreateSelfCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await createSelfCase(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.myCases() });
    },
  });
};

// Update case mutation (Admin)
export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, data }: { caseId: string; data: any }) => {
      const response = await updateCase(caseId, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific case and lists
      queryClient.invalidateQueries({
        queryKey: caseKeys.detail(variables.caseId),
      });
      queryClient.invalidateQueries({ queryKey: caseKeys.allCases() });
      queryClient.invalidateQueries({ queryKey: caseKeys.myCases() });
    },
  });
};

// Delete case mutation (Admin)
export const useDeleteCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const response = await deleteCase(caseId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate case lists
      queryClient.invalidateQueries({ queryKey: caseKeys.allCases() });
      queryClient.invalidateQueries({ queryKey: caseKeys.myCases() });
    },
  });
};
