import { useQuery } from "@tanstack/react-query";
import {
  getAllAuditLogs,
  AuditLogFilters,
  AuditLogsResponse,
  getMyAuditLogs,
} from "@/services/auditService/auditService";

interface UseAuditLogsOptions extends AuditLogFilters {
  enabled?: boolean;
}

const queryKeys = {
  all: ["auditLogs"] as const,
  list: (filters: AuditLogFilters) =>
    [...queryKeys.all, "list", filters] as const,
};

/**
 * Custom hook to fetch audit logs with filters and pagination
 */
export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { enabled = true, ...filters } = options;

  return useQuery<AuditLogsResponse>({
    queryKey: queryKeys.list(filters),
    queryFn: () =>
      getAllAuditLogs({
        page: filters.page || 1,
        limit: filters.limit || 50,
        userId: filters.userId,
        action: filters.action,
        actionCategory: filters.actionCategory,
        resourceType: filters.resourceType,
        caseId: filters.caseId,
        sessionId: filters.sessionId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
};

export const useMyAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { enabled = true, ...filters } = options;

  return useQuery<AuditLogsResponse>({
    queryKey: queryKeys.list(filters),
    queryFn: () =>
      getMyAuditLogs({
        page: filters.page || 1,
        limit: filters.limit || 50,
        userId: filters.userId,
        action: filters.action,
        actionCategory: filters.actionCategory,
        resourceType: filters.resourceType,
        caseId: filters.caseId,
        sessionId: filters.sessionId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
};
