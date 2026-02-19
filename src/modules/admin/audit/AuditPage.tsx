import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { RotateCcw, Download, ChevronDown, Loader2, X } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import {
  AuditLog,
  exportAuditLogs,
} from "@/services/auditService/auditService";
import Swal from "sweetalert2";

// Action filter mapping (UI option -> API params)
// Keep values aligned with stored audit log action/actionCategory strings.
const ACTION_FILTERS: Record<
  string,
  { action?: string; actionCategory?: string }
> = {
  // Backups / exports
  backupExport: { action: "EXPORT", actionCategory: "ADMIN" },
  // Auth logins
  login: { action: "LOGIN", actionCategory: "AUTH" },
  // Session lifecycle (create/upload/start/stop/update)
  sessionActivity: { actionCategory: "SESSION" },
  // SOAP generate/approve
  soap: { actionCategory: "SOAP" },
  // Timeline summaries created
  timelineCreated: { action: "CREATE", actionCategory: "TIMELINE_SUMMARY" },
  // Data retention (schedule/delete)
  dataRetention: { actionCategory: "DATA_RETENTION" },
};

// Status info mapping outside component
const ACTION_STATUS_MAP: Record<
  string,
  { label: string; color: "blue" | "green" | "cyan" | "orange" | "purple" }
> = {
  LOGIN: { label: "Login", color: "blue" },
  LOGOUT: { label: "Logout", color: "blue" },
  CREATE: { label: "Created", color: "cyan" },
  UPDATE: { label: "Updated", color: "orange" },
  DELETE: { label: "Deleted", color: "orange" },
  APPROVE: { label: "Approved", color: "green" },
  GENERATE: { label: "Generated", color: "purple" },
  EXPORT: { label: "Exported", color: "cyan" },
  UPLOAD: { label: "Uploaded", color: "blue" },
  DOWNLOAD: { label: "Downloaded", color: "blue" },
  REGISTER: { label: "Registered", color: "cyan" },
  RESET_PASSWORD: { label: "Password Reset", color: "orange" },
  UPDATE_PASSWORD: { label: "Password Updated", color: "orange" },
  UPDATE_PROFILE: { label: "Profile Updated", color: "orange" },
  UPDATE_CREDENTIALS: { label: "Credentials Updated", color: "orange" },
  TOGGLE_STATUS: { label: "Status Changed", color: "orange" },
};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
  orange: "bg-orange-50 text-orange-600 border-orange-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
};

export const AuditPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState("");
  const [actionType, setActionType] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate date filters
  const getDateFilters = useCallback(() => {
    // Always return start/end as full ISO strings; endDate is exclusive (next day)
    const today = new Date();

    // Helper: strip time and add days
    const stripTime = (d: Date) => {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };
    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy;
    };

    let start: Date | null = null;
    let endExclusive: Date | null = null;

    switch (dateRange) {
      case "today": {
        start = stripTime(today);
        endExclusive = addDays(start, 1);
        break;
      }
      case "week": {
        endExclusive = addDays(stripTime(today), 1);
        start = addDays(endExclusive, -7);
        break;
      }
      case "month": {
        endExclusive = addDays(stripTime(today), 1);
        start = addDays(endExclusive, -30);
        break;
      }
      default:
        return {};
    }

    return {
      startDate: start?.toISOString(),
      endDate: endExclusive?.toISOString(),
    };
  }, [dateRange]);

  const dateFilters = getDateFilters();

  // Fetch audit logs
  const selectedActionFilter = ACTION_FILTERS[actionType] || {};

  const { data, isLoading, error } = useAuditLogs({
    page: currentPage,
    limit: 50,
    action: selectedActionFilter.action,
    actionCategory: selectedActionFilter.actionCategory,
    startDate: dateFilters.startDate,
    endDate: dateFilters.endDate,
  });

  const getStatusInfo = useCallback((auditLog: AuditLog) => {
    return (
      ACTION_STATUS_MAP[auditLog.action] || {
        label: auditLog.action,
        color: "blue" as const,
      }
    );
  }, []);

  const getStatusColor = useCallback((color: string) => {
    return COLOR_MAP[color] || COLOR_MAP.blue;
  }, []);

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDateRange("");
    setActionType("");
    setCurrentPage(1);
  };

  const handleOpenModal = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedLog(null), 200);
  };

  const handleExport = async () => {
    try {
      // Show loading
      Swal.fire({
        title: "Exporting...",
        text: "Please wait while we prepare your export",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Get current filters
      const dateFilters = getDateFilters();
      const filters: Record<string, string> = {};

      if (dateFilters.startDate) filters.startDate = dateFilters.startDate;
      if (dateFilters.endDate) filters.endDate = dateFilters.endDate;
      if (actionType) {
        if (ACTION_FILTERS[actionType]?.action) {
          filters.action = ACTION_FILTERS[actionType].action as string;
        }
        if (ACTION_FILTERS[actionType]?.actionCategory) {
          filters.actionCategory = ACTION_FILTERS[actionType]
            .actionCategory as string;
        }
      }

      // Call API to export (exports all matching logs, not just current page)
      const blob = await exportAuditLogs("csv", filters);

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Exported",
        text: "Audit logs exported successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error("Export error:", err);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Failed to export audit logs",
      });
    }
  };

  const auditEntries = useMemo(() => {
    return data?.auditLogs || [];
  }, [data?.auditLogs]);

  const totalPages = data?.pagination?.totalPages || 1;
  const totalRecords = data?.pagination?.total || 0;

  // Show error state
  if (error) {
    console.error("Audit logs error:", error);
    return (
      <div className="space-y-4 w-full">
        <Card className="p-6 text-red-600 text-center">
          <p>Failed to load audit logs. Please try again.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/80 mt-4"
          >
            Reload Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Filters */}
      <div className="flex md:flex-row flex-col lg:justify-between md:items-center gap-2 lg:gap-4">
        {/* Filter Controls */}
        <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 mr-auto p-3 lg:p-4 rounded-lg w-full md:w-auto bg-accent-foreground/5">
          {/* Date Range Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white px-3 py-2 border border-border/60 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
            >
              <option value="">Date Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Type Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="bg-white px-3 py-2 border border-border/60 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
            >
              <option value="">Action Type</option>
              <option value="backupExport">Backups / Exports</option>
              <option value="login">Logins</option>
              <option value="sessionActivity">Session Activity</option>
              <option value="soap">Summary (Generate/Approve)</option>
              <option value="timelineCreated">
                Timeline Summaries Created
              </option>
              <option value="dataRetention">Data Retention</option>
            </select>
            <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Apply Filters Button */}
          <Button
            onClick={handleApplyFilters}
            className="bg-primary hover:bg-primary/80 w-full md:w-auto font-normal text-white"
          >
            Apply Filters
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end lg:justify-start gap-2 w-full md:w-auto">
          {/* <Button
            onClick={handleReset}
            variant="outline"
            className="flex flex-1 md:flex-none justify-center items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button> */}
          <Button
            onClick={handleExport}
            disabled={isLoading || auditEntries.length === 0}
            variant="outline"
            className="flex flex-1 md:flex-none justify-center items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-accent text-sm">
          Showing <span className="font-semibold">{auditEntries.length}</span>{" "}
          of <span className="font-semibold">{totalRecords}</span> audit logs
        </p>
      </div>

      {/* Audit Entries */}
      <div className="space-y-3 bg-primary/5 p-4 rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : auditEntries.length === 0 ? (
          <Card className="p-6 text-accent text-center">
            <p>No audit logs found. Try adjusting your filters.</p>
          </Card>
        ) : (
          auditEntries.map((entry) => {
            try {
              const statusInfo = getStatusInfo(entry);
              const userName =
                entry.user?.name || entry.userEmail || "Unknown User";
              const userRole = entry.user?.role || entry.userRole || "Unknown";
              const timestamp = new Date(entry.timestamp).toLocaleString();

              return (
                <Card
                  key={entry._id}
                  className="hover:shadow-md p-4 sm:p-5 transition-shadow cursor-pointer"
                  onClick={() => handleOpenModal(entry)}
                >
                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 sm:gap-4">
                    {/* Left Side - User Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-normal text-secondary text-lg">
                          {userName}
                        </h3>
                        <span className="bg-cyan-100 px-2 py-0.5 rounded-full text-cyan-600 text-xs">
                          • {userRole}
                        </span>
                      </div>

                      <div className="flex sm:flex-row flex-col gap-1 sm:gap-2 text-accent text-xs">
                        <span>{timestamp}</span>
                        <span className="hidden sm:inline text-gray-400">
                          •
                        </span>
                        <span className="capitalize">{entry.resourceType}</span>
                        {entry.actionCategory && (
                          <>
                            <span className="hidden sm:inline text-gray-400">
                              •
                            </span>
                            <span>{entry.actionCategory}</span>
                          </>
                        )}
                      </div>

                      {entry.details &&
                        Object.keys(entry.details).length > 0 && (
                          <div className="flex">
                            <p className="bg-[#F2933911] px-2 rounded-full max-w-md text-[#F29339] text-xs truncate">
                              Details: {JSON.stringify(entry.details)}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Right Side - Status Badge */}
                    <div className="self-start sm:shrink-0">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-sm text-[10px] font-normal border ${getStatusColor(
                          statusInfo.color,
                        )}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            } catch (err) {
              console.error("Error rendering audit entry:", err);
              return null;
            }
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && auditEntries.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Audit Log Details Modal */}
      {isModalOpen && selectedLog && (
        <div
          className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white shadow-xl rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="font-semibold text-secondary text-xl">
                  Audit Log Details
                </h2>
                <p className="mt-1 text-accent text-sm">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 p-6">
              {/* User Information */}
              <div>
                <h3 className="mb-3 font-medium text-secondary">
                  User Information
                </h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Name:</span>
                    <span className="font-medium text-secondary text-sm">
                      {selectedLog.user?.name ||
                        selectedLog.userEmail ||
                        "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Email:</span>
                    <span className="font-medium text-secondary text-sm">
                      {selectedLog.userEmail || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Role:</span>
                    <span className="inline-block bg-cyan-100 px-2 py-0.5 rounded-full text-cyan-600 text-xs">
                      {selectedLog.user?.role ||
                        selectedLog.userRole ||
                        "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Information */}
              <div>
                <h3 className="mb-3 font-medium text-secondary">
                  Action Information
                </h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Action:</span>
                    <span
                      className={`inline-block px-3 py-1 rounded-sm text-xs font-normal border ${getStatusColor(
                        getStatusInfo(selectedLog).color,
                      )}`}
                    >
                      {getStatusInfo(selectedLog).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Category:</span>
                    <span className="font-medium text-secondary text-sm">
                      {selectedLog.actionCategory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Resource Type:</span>
                    <span className="font-medium text-secondary text-sm capitalize">
                      {selectedLog.resourceType}
                    </span>
                  </div>
                  {selectedLog.resourceId && (
                    <div className="flex justify-between">
                      <span className="text-accent text-sm">Resource ID:</span>
                      <span className="font-mono text-secondary text-xs">
                        {selectedLog.resourceId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Case & Session Information */}
              {(selectedLog.case || selectedLog.session) && (
                <div>
                  <h3 className="mb-3 font-medium text-secondary">
                    Related Information
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {selectedLog.case && (
                      <div className="flex justify-between">
                        <span className="text-accent text-sm">Case:</span>
                        <span className="font-medium text-secondary text-sm">
                          {selectedLog.case.caseName ||
                            selectedLog.case.displayName ||
                            selectedLog.case._id}
                        </span>
                      </div>
                    )}
                    {selectedLog.session && (
                      <div className="flex justify-between">
                        <span className="text-accent text-sm">Session:</span>
                        <span className="font-medium text-secondary text-sm">
                          {selectedLog.session.sessionName ||
                            selectedLog.session._id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              {selectedLog.details &&
                Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <h3 className="mb-3 font-medium text-secondary">
                      Additional Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-secondary text-sm wrap-break-word whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {/* Technical Information */}
              <div>
                <h3 className="mb-3 font-medium text-secondary">
                  Technical Information
                </h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">IP Address:</span>
                    <span className="font-mono text-secondary text-xs">
                      {selectedLog.ipAddress || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-accent text-sm">User Agent:</span>
                    <span className="text-secondary text-xs break-all">
                      {selectedLog.userAgent || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent text-sm">Timestamp:</span>
                    <span className="font-mono text-secondary text-xs">
                      {new Date(selectedLog.timestamp).toISOString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t">
              <Button
                onClick={handleCloseModal}
                className="bg-primary hover:bg-primary/80 w-full text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
