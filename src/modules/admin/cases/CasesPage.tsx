import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/Pagination";
import { Search, ChevronDown, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCaseModal } from "./CreateCaseModal";
import { useAllCases } from "@/hooks/useCases";
import { useAllUsers } from "@/hooks/useUsers";

export const AdminCasesPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  // const [sortBy, setSortBy] = useState("");
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false);

  // Fetch all users for filter dropdown
  const { data: usersData } = useAllUsers({ limit: 100 });
  const users = usersData?.users || [];

  // Fetch all cases using React Query (Admin view)
  const { data, isLoading, isError, error } = useAllCases({
    status: statusFilter,
    assignedTo: assignedToFilter,
  });

  const handleCaseClick = (caseId: string) => {
    navigate(`/admin/cases/${caseId}`);
  };

  const handleCreateCaseSuccess = () => {
    setIsCreateCaseModalOpen(false);
  };

  // Extract cases from API response
  const cases = data?.cases || [];
  const totalCases = data?.cases?.length || 0;

  const totalPages = Math.ceil(totalCases / 10) || 1;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex sm:flex-row flex-col sm:justify-between items-center gap-4">
        <div>
          <h1 className="font-medium text-secondary text-lg sm:text-xl">
            All Cases Management
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateCaseModalOpen(true)}
          className="bg-primary hover:bg-primary/80 rounded-lg w-full sm:w-auto text-white"
        >
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>
      {/* Search and Filters */}
      {/* <Card className="p-4 sm:p-6"> */}
      <div className="gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-8">
          <Search className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases..."
            className="py-2.5 pl-10 h-auto"
          />
        </div>

        {/* User Filter */}
        <div className="relative sm:col-span-1 lg:col-span-2">
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="px-3 py-2.5 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
          >
            <option value="">All Practitioners</option>
            {users
              .filter((user: any) => user.role === "practitioner")
              .map((user: any) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                  {/* ({user.role}) */}
                </option>
              ))}
          </select>
          <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative sm:col-span-1 lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="OnHold">On Hold</option>
            <option value="Unapporved">Un Approved</option>
          </select>
          <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sort By */}
        {/* <div className="relative sm:col-span-1 lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
          >
            <option value="">Last Updated</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Client Name</option>
          </select>
          <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        </div> */}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-accent">Loading cases...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-6 text-center">
          <p className="text-red-600">
            Error loading cases:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </Card>
      )}

      {/* Case Cards */}
      {!isLoading && !isError && (
        <div className="space-y-3 bg-primary/5 p-3 rounded-lg">
          {cases.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-accent">No cases found</p>
            </Card>
          ) : (
            <>
              {cases.map((caseItem: any) => (
                <Card
                  key={caseItem._id}
                  onClick={() => handleCaseClick(caseItem._id)}
                  className="hover:shadow-md p-4 sm:p-5 transition-shadow cursor-pointer"
                >
                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3 sm:gap-4">
                    {/* Left Side - Case Info */}
                    <div className="flex-1 space-y-2">
                      {/* Case Number and Client Name */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-secondary text-xl">
                          {caseItem.internalRef}
                        </h3>
                        <span className="text-accent">-</span>
                        <span className="text-secondary text-base">
                          {caseItem.displayName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                            caseItem.status === "Active"
                              ? "bg-ring/10 text-ring"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          • {caseItem.status}
                        </span>
                      </div>

                      {/* Case Details */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-accent text-sm">
                        <span>
                          Assigned to: {caseItem.assignedTo?.name || "N/A"}
                        </span>
                        <span className="hidden sm:inline text-primary/50">
                          •
                        </span>
                        <span>
                          Created:{" "}
                          {caseItem.createdAt
                            ? new Date(caseItem.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </span>
                        <span className="hidden sm:inline text-primary/50">
                          •
                        </span>
                        <span>Sessions: {caseItem.sessionsCount || 0}</span>
                        <span className="hidden sm:inline text-primary/50">
                          •
                        </span>
                        <span>
                          Last:{" "}
                          {caseItem.updatedAt
                            ? new Date(caseItem.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {caseItem.tags && caseItem.tags.length > 0
                          ? caseItem.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="bg-primary/10 px-2 py-1 rounded font-medium text-primary text-xs"
                              >
                                #{tag}
                              </span>
                            ))
                          : null}
                      </div>
                    </div>

                    {/* Right Side - Arrow */}
                    <div className="self-start sm:self-center sm:shrink-0">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Card>
              ))}
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={isCreateCaseModalOpen}
        onClose={() => setIsCreateCaseModalOpen(false)}
        onCreateSuccess={handleCreateCaseSuccess}
      />
    </div>
  );
};
