import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { RotateCcw, Download, ChevronDown } from "lucide-react";

interface AuditEntry {
  id: string;
  userName: string;
  role: string;
  date: string;
  sessionInfo: string;
  details: string;
  status: {
    label: string;
    color: "blue" | "green" | "cyan" | "orange";
  };
}

export const AuditPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState("");
  const [actionType, setActionType] = useState("");
  const [user, setUser] = useState("");

  // Mock data - replace with real API data
  const auditEntries: AuditEntry[] = [
    {
      id: "1",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
    {
      id: "2",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Note Approved", color: "green" },
    },
    {
      id: "3",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Note Added", color: "cyan" },
    },
    {
      id: "4",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Case Accessed", color: "orange" },
    },
    {
      id: "5",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
    {
      id: "6",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
    {
      id: "7",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
    {
      id: "8",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
    {
      id: "9",
      userName: "Dr. Lim Cen",
      role: "Supervisor",
      date: "Jan 5, 2024",
      sessionInfo: "Sessions: 5 · SOAP Note · 123.542.12 (Singapore)",
      details: "Added comment on Supervisor on Approved notes",
      status: { label: "Comment Added", color: "blue" },
    },
  ];

  const totalPages = 24; // Example total pages

  const getStatusColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleApplyFilters = () => {
    console.log("Applying filters:", { dateRange, actionType, user });
    // Add filter logic here
  };

  const handleReset = () => {
    setDateRange("");
    setActionType("");
    setUser("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    console.log("Exporting data...");
    // Add export logic here
  };

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
              <option value="custom">Custom Range</option>
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
              <option value="comment">Comment Added</option>
              <option value="approved">Note Approved</option>
              <option value="added">Note Added</option>
              <option value="accessed">Data Accessed</option>
            </select>
            <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* User Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="bg-white px-3 py-2 border border-border/60 focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
            >
              <option value="">User</option>
              <option value="dr-lim">Dr. Lim Cen</option>
              <option value="dr-sarah">Dr. Sarah Tan</option>
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
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex flex-1 md:flex-none justify-center items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex flex-1 md:flex-none justify-center items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="space-y-3 bg-primary/5 p-4 rounded-lg">
        {auditEntries.map((entry) => (
          <Card
            key={entry.id}
            className="hover:shadow-md p-4 sm:p-5 transition-shadow"
          >
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 sm:gap-4">
              {/* Left Side - User Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-normal text-secondary text-xl">
                    {entry.userName}
                  </h3>
                  <span className="bg-cyan-100 px-2 py-0.5 rounded-full text-cyan-600 text-xs">
                    • {entry.role}
                  </span>
                </div>

                <div className="flex sm:flex-row flex-col gap-1 sm:gap-2 text-accent text-xs">
                  <span>{entry.date}</span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span>{entry.sessionInfo}</span>
                </div>

                <div className="flex">
                  <p className="bg-[#F2933911] px-2 rounded-full text-[#F29339] text-xs">
                    Details: {entry.details}
                  </p>
                </div>
              </div>

              {/* Right Side - Status Badge */}
              <div className="self-start sm:shrink-0">
                <span
                  className={`inline-block px-3 py-1.5 rounded-sm text-[10px] font-normal border ${getStatusColor(
                    entry.status.color
                  )}`}
                >
                  {entry.status.label}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
