import { GetApiData } from "../../utils/http-client";
export { exportAuditLogs } from "./exportAuditLogs";

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  actionCategory?: string;
  resourceType?: string;
  caseId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
  isMyLogs?: boolean; // Flag to fetch current user's logs
}

export interface AuditLog {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userEmail?: string;
  userRole?: string;
  action: string;
  actionCategory: string;
  resourceType: string;
  resourceId?: string;
  case?: {
    _id: string;
    caseName?: string;
    displayName?: string;
  };
  session?: {
    _id: string;
    sessionName?: string;
  };
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch all audit logs with filtering and pagination
 */
export const getAllAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  // Use personal logs endpoint if requested
  if (filters.isMyLogs) {
    return getMyAuditLogs(filters);
  }

  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
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
  const url = queryString ? `/audit-logs?${queryString}` : "/audit-logs";

  const response = await GetApiData(url, "GET");
  return response.data.data;
};

/**
 * Fetch current user's own audit logs
 */
export const getMyAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.action) params.append("action", filters.action);
  if (filters.actionCategory)
    params.append("actionCategory", filters.actionCategory);
  if (filters.resourceType) params.append("resourceType", filters.resourceType);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  const url = queryString ? `/audit-logs/my-logs?${queryString}` : "/audit-logs/my-logs";

  const response = await GetApiData(url, "GET");
  return response.data.data;
};

/**
 * Fetch audit logs for a specific case
 */
export const getCaseAuditLogs = async (
  caseId: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/audit-logs/case/${caseId}?${queryString}`
    : `/audit-logs/case/${caseId}`;

  const response = await GetApiData(url, "GET");
  return response.data.data;
};

/**
 * Fetch audit logs for a specific user
 */
export const getUserAuditLogs = async (
  userId: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/audit-logs/user/${userId}?${queryString}`
    : `/audit-logs/user/${userId}`;

  const response = await GetApiData(url, "GET");
  return response.data.data;
};

/**
 * Fetch audit logs for a specific session
 */
export const getSessionAuditLogs = async (
  sessionId: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/audit-logs/session/${sessionId}?${queryString}`
    : `/audit-logs/session/${sessionId}`;

  const response = await GetApiData(url, "GET");
  return response.data.data;
};
