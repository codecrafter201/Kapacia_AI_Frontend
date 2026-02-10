import { GetApiData } from "../../utils/http-client";
import { AuditLogFilters } from "./auditService";

/**
 * Export audit logs to CSV or JSON
 */
export const exportAuditLogs = async (
  format: "csv" | "json" = "csv",
  filters: AuditLogFilters = {},
  isMyLogs: boolean = false,
): Promise<Blob> => {
  const params = new URLSearchParams();

  params.append("format", format);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.action) params.append("action", filters.action);
  if (filters.actionCategory)
    params.append("actionCategory", filters.actionCategory);
  if (filters.resourceType) params.append("resourceType", filters.resourceType);
  if (filters.caseId) params.append("caseId", filters.caseId);
  if (filters.sessionId) params.append("sessionId", filters.sessionId);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  // Use personal export endpoint if requested
  const url = isMyLogs 
    ? `/audit-logs/my-logs/export?${queryString}`
    : `/audit-logs/export?${queryString}`;

  const response = await GetApiData(url, "GET");
  
  // The response is the file content (CSV or JSON string)
  const contentType =
    format === "json" ? "application/json" : "text/csv";
  return new Blob([response.data], { type: contentType });
};
