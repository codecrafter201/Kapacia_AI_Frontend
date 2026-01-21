import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { timelineSummaryService } from "@/services/timelineSummaryService/timelineSummaryService";

// Query Keys
export const timelineSummaryKeys = {
  all: ["timelinesummary"] as const,
  byCase: (caseId: string) => [...timelineSummaryKeys.all, "case", caseId] as const,
  detail: (summaryId: string) => [...timelineSummaryKeys.all, "detail", summaryId] as const,
};

// Generate timeline summary with AI
export const useGenerateTimelineSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      caseId: string;
      periodStart: string;
      periodEnd: string;
    }) => timelineSummaryService.generateWithAI(data),
    onSuccess: (data, variables) => {
      // Invalidate timeline summaries for this case
      queryClient.invalidateQueries({
        queryKey: timelineSummaryKeys.byCase(variables.caseId),
      });
      // Invalidate case timeline
      queryClient.invalidateQueries({
        queryKey: ["casetimeline", variables.caseId],
      });
    },
  });
};

// Get timeline summaries by case
export const useTimelineSummariesByCase = (caseId?: string, status?: string) => {
  return useQuery({
    queryKey: status 
      ? [...timelineSummaryKeys.byCase(caseId || ""), status]
      : timelineSummaryKeys.byCase(caseId || ""),
    queryFn: () => timelineSummaryService.getTimelineSummariesByCase(caseId!, status),
    enabled: !!caseId,
  });
};

// Get timeline summary by ID
export const useTimelineSummaryById = (summaryId?: string) => {
  return useQuery({
    queryKey: timelineSummaryKeys.detail(summaryId || ""),
    queryFn: () => timelineSummaryService.getTimelineSummaryById(summaryId!),
    enabled: !!summaryId,
  });
};

// Approve timeline summary
export const useApproveTimelineSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (summaryId: string) => timelineSummaryService.approveTimelineSummary(summaryId),
    onSuccess: (data, summaryId) => {
      // Invalidate the specific summary
      queryClient.invalidateQueries({
        queryKey: timelineSummaryKeys.detail(summaryId),
      });
      // Invalidate all summaries
      queryClient.invalidateQueries({
        queryKey: timelineSummaryKeys.all,
      });
    },
  });
};

// Delete timeline summary
export const useDeleteTimelineSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (summaryId: string) => timelineSummaryService.deleteTimelineSummary(summaryId),
    onSuccess: () => {
      // Invalidate all timeline summaries
      queryClient.invalidateQueries({
        queryKey: timelineSummaryKeys.all,
      });
    },
  });
};
