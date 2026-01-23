import { useState, useEffect } from "react";
import { X, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useUpdateUserCredentials,
  useToggleUserStatus,
} from "@/hooks/useUsers";
import { toast } from "react-toastify";

interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdateSuccess?: () => void;
}

export const UpdateUserModal = ({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
}: UpdateUserModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("practitioner");
  const [showPasswordField, setShowPasswordField] = useState(false);

  const updateUserMutation = useUpdateUserCredentials();
  const toggleStatusMutation = useToggleUserStatus();

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword("");
      setRole(user.role || "practitioner");
      setShowPasswordField(false);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (showPasswordField && password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
        role,
      };

      if (showPasswordField && password) {
        updateData.password = password;
      }

      await updateUserMutation.mutateAsync({
        userId: user._id,
        data: updateData,
      });

      toast.success("User updated successfully!");
      onUpdateSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatusMutation.mutateAsync({
        userId: user._id,
        active: !user.active,
      });

      const status = !user.active ? "enabled" : "disabled";
      toast.success(`User ${status} successfully!`);
      onUpdateSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle user status");
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="bg-white shadow-xl rounded-lg w-full max-w-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="font-semibold text-secondary text-xl">Edit User</h2>
          <button
            onClick={onClose}
            className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 max-h-[70vh] overflow-y-auto"
        >
          {/* User ID Info */}
          {/* <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-500 text-xs">User ID</p>
            <p className="font-medium text-secondary text-sm">{user._id}</p>
          </div> */}

          {/* Name */}
          <div>
            <label className="block mb-1 font-medium text-secondary text-sm">
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium text-secondary text-sm">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full"
            />
          </div>

          {/* Password Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswordField}
                onChange={(e) => setShowPasswordField(e.target.checked)}
                className="border-border/50 rounded w-4 h-4 text-primary"
              />
              <span className="font-medium text-secondary text-sm">
                Change Password
              </span>
            </label>
          </div>

          {/* Password (conditionally shown) */}
          {showPasswordField && (
            <div>
              <label className="block mb-1 font-medium text-secondary text-sm">
                New Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full"
              />
              <p className="mt-1 text-gray-500 text-xs">
                Leave empty to keep current password
              </p>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block mb-1 font-medium text-secondary text-sm">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 w-full"
            >
              <option value="practitioner">Practitioner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-accent text-xs">Status</p>
            <div className="flex justify-between items-center mt-2">
              <p className="font-medium text-secondary text-sm">
                {user.active ? (
                  <span className="text-ring">Active</span>
                ) : (
                  <span className="text-destructive">Disabled</span>
                )}
              </p>
              <Button
                type="button"
                onClick={handleToggleStatus}
                disabled={toggleStatusMutation.isPending}
                className={`h-8 px-3 text-xs ${
                  user.active
                    ? "bg-destructive/20 hover:bg-destructive/30 text-destructive"
                    : "bg-ring/20 hover:bg-ring/30 text-ring"
                }`}
              >
                {toggleStatusMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Power className="inline mr-1 w-3 h-3" />
                    {user.active ? "Disable" : "Enable"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Created Date */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-accent text-xs">Created</p>
            <p className="font-medium text-secondary text-sm">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>

          {/* Updated Date */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-accent text-xs">Last Updated</p>
            <p className="font-medium text-secondary text-sm">
              {user.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="link"
              type="button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
