import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCaseData } from "@/services/caseService/caseService.js";

interface ExportCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  caseName?: string;
  onExportSuccess?: (exportData: ExportData) => void;
}

interface ExportData {
  exportType: string;
  contentToInclude: string[];
  dateRange: { from: string; to: string };
  exportFormat: string;
  privacyOptions: string[];
  caseId?: string;
}

export const ExportCaseModal = ({
  isOpen,
  onClose,
  caseId,
  caseName = "Case - 001 (Sara Cen)",
  onExportSuccess,
}: ExportCaseModalProps) => {
  const [exportType, setExportType] = useState("full-case");
  const [contentToInclude, setContentToInclude] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportFormat, setExportFormat] = useState("json");
  const [privacyOptions, setPrivacyOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContentToggle = (item: string) => {
    setContentToInclude((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handlePrivacyToggle = (item: string) => {
    setPrivacyOptions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleExport = async () => {
    if (!caseId) {
      setError("Missing caseId");
      return;
    }
    if (exportFormat !== "json") {
      setError("Only JSON export is available right now.");
      return;
    }

    const exportData: ExportData = {
      exportType,
      contentToInclude,
      dateRange: { from: dateFrom, to: dateTo },
      exportFormat,
      privacyOptions,
      caseId,
    };

    setIsExporting(true);
    setError(null);

    try {
      const response = await exportCaseData(caseId, {
        exportType,
        exportFormat,
        contentToInclude,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        privacyOptions,
      });

      const blob = response.data;
      const safeName = (caseName || "case").replace(/[^a-zA-Z0-9-_ ]/g, "_");
      const filename = `${safeName || "case"}.json`;
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      if (onExportSuccess) {
        onExportSuccess(exportData);
      }
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to export case data";
      setError(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="relative bg-white shadow-xl rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-gray-200 border-b">
          <h2 className="text-md text-secondary md:text-xl">
            Export Case Data - {caseName}
          </h2>
          <button
            onClick={onClose}
            className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Export Scope */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">EXPORT SCOPE</h3>
            <div className="space-y-2 p-4 border border-border rounded-lg">
              <p className="mb-2 font-medium text-sm text-accent-foreground">
                Export Type:
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "full-case"}
                  onChange={() => setExportType("full-case")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-secondary text-sm">
                  Full Case ( all session, files, summaries )
                </span>
              </label>
              {/* <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "single-sessions"}
                  onChange={() => setExportType("single-sessions")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-secondary text-sm">Single Sessions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "timeline-summary"}
                  onChange={() => setExportType("timeline-summary")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-secondary text-sm">
                  Timeline Summary Only
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportType === "custom"}
                  onChange={() => setExportType("custom")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 text-sm">Custom Selection</span>
              </label> */}
            </div>
          </div>

          {/* Content to Include */}
          {/* <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">CONTENT TO INCLUDE</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("case-info")}
                  onChange={() => handleContentToggle("case-info")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Case Information (Name, Dates, Tags)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("session-notes")}
                  onChange={() => handleContentToggle("session-notes")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  All Session Notes (SOAP Notes Only)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("timeline-summary")}
                  onChange={() => handleContentToggle("timeline-summary")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">Timeline Summary</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("uploaded-files")}
                  onChange={() => handleContentToggle("uploaded-files")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Uploaded Files ( PDF, DOCX )
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("audio-recordings")}
                  onChange={() => handleContentToggle("audio-recordings")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Audio Recordings ( ~ 500 MB Total )
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("transcripts")}
                  onChange={() => handleContentToggle("transcripts")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Full Transcripts ( Text Only )
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentToInclude.includes("approval-history")}
                  onChange={() => handleContentToggle("approval-history")}
                  className="rounded-full focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Approval history ( Who Approved what ,when )
                </span>
              </label>
            </div>
          </div> */}

          {/* Date Range */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">DATE RANGE</h3>
            <div className="gap-4 grid grid-cols-2 mb-3">
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-primary/5 px-3 py-2 border border-primary/5 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-accent text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-primary/5 px-3 py-2 border border-primary/5 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-accent text-sm"
                />
              </div>
            </div>
            <p className="text-gray-600 text-sm">Session Included: 5</p>
          </div>

          {/* Export Format */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">EXPORT FORMAT</h3>
            <div className="space-y-2">
              {/* <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportFormat === "pdf"}
                  onChange={() => setExportFormat("pdf")}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">PDF Report</span>
              </label> */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 text-sm">JSON</span>
              </label>
            </div>
          </div>

          {/* Privacy Options */}
          {/* <div className="p-4 border border-border rounded-lg">
            <h3 className="mb-3 text-primary text-sm">PRIVACY OPTIONS</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyOptions.includes("redact-patient-name")}
                  onChange={() => handlePrivacyToggle("redact-patient-name")}
                  className="rounded focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Redact Patient Name
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyOptions.includes("redact-nric")}
                  onChange={() => handlePrivacyToggle("redact-nric")}
                  className="rounded focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Redact NRIC/Phone/address
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyOptions.includes("watermark")}
                  onChange={() => handlePrivacyToggle("watermark")}
                  className="rounded focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Include watermark: Confidential - For Clinical Use Only
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyOptions.includes("password-protect")}
                  onChange={() => handlePrivacyToggle("password-protect")}
                  className="rounded focus:ring-2 focus:ring-primary w-4 h-4 text-primary"
                />
                <span className="text-secondary text-sm">
                  Password - protect exported file
                </span>
              </label>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-gray-200 border-t">
          {error ? (
            <span className="mr-auto text-red-600 text-sm">{error}</span>
          ) : null}
          <Button variant="outline" onClick={onClose} className="text-gray-700">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="text-white"
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>
    </div>
  );
};
