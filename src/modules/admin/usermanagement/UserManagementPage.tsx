import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { useAllUsers } from "@/hooks/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { CreateUserModal } from "./CreateUserModal";
import { UpdateUserModal } from "./UpdateUserModal";

export const UserManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const itemsPerPage = 10;

  // Debounce search query to avoid excessive API calls (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch all users using React Query with debounced search
  const { data, isLoading, isError, error, refetch } = useAllUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchQuery || undefined,
    role: roleFilter || undefined,
    active: statusFilter === "" ? undefined : statusFilter === "active",
  });

  const users = data?.users || [];
  const totalUsers = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsUpdateUserModalOpen(true);
  };

  const handleCreateUserSuccess = () => {
    setIsCreateUserModalOpen(false);
    refetch();
  };

  const handleUpdateUserSuccess = () => {
    setIsUpdateUserModalOpen(false);
    setSelectedUser(null);
    refetch();
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:justify-between items-center gap-4">
        <div>
          <h1 className="font-medium text-secondary text-lg sm:text-xl">
            Users Management
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateUserModalOpen(true)}
          className="bg-primary hover:bg-primary/80 rounded-lg w-full sm:w-auto text-white"
        >
          <Plus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-8">
          <Search className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search users by name or email..."
            className="py-2.5 pl-10 h-auto"
          />
        </div>

        {/* Role Filter */}
        <div className="relative sm:col-span-1 lg:col-span-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="practitioner">Practitioner</option>
          </select>
          <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative sm:col-span-1 lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-border focus:border-blue-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-full text-gray-700 text-sm appearance-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>
          <ChevronDown className="top-1/2 right-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-accent">Loading users...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-6 text-center">
          <p className="text-red-600">
            Error loading users:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </Card>
      )}

      {/* Users List */}
      {!isLoading && !isError && (
        <div className="space-y-3 bg-primary/5 p-3 rounded-lg">
          {users.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-accent">No users found</p>
            </Card>
          ) : (
            <>
              {users.map((user: any) => (
                <Card
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className="hover:shadow-md p-4 sm:p-5 transition-shadow cursor-pointer"
                >
                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-3 sm:gap-4">
                    {/* Left Side - User Info */}
                    <div className="flex-1 space-y-2">
                      {/* User Name and Email */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-secondary text-xl">
                          {user.name}
                        </h3>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.active ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {/* User Details */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-accent text-sm">
                        <span>Email: {user.email}</span>
                        <span className="hidden sm:inline text-primary/50">
                          •
                        </span>
                        <span>
                          Created:{" "}
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
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
                        <span>
                          Updated:{" "}
                          {user.updatedAt
                            ? new Date(user.updatedAt).toLocaleDateString(
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

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onCreateSuccess={handleCreateUserSuccess}
      />

      {/* Update User Modal */}
      <UpdateUserModal
        isOpen={isUpdateUserModalOpen}
        onClose={() => setIsUpdateUserModalOpen(false)}
        user={selectedUser}
        onUpdateSuccess={handleUpdateUserSuccess}
      />
    </div>
  );
};
