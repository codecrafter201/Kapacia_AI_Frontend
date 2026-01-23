import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateUserByAdmin } from "@/hooks/useUsers";
import { toast } from "react-toastify";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess?: () => void;
}

export const CreateUserModal = ({
  isOpen,
  onClose,
  onCreateSuccess,
}: CreateUserModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("practitioner");

  const createUserMutation = useCreateUserByAdmin();

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
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      toast.success("User created successfully!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("practitioner");
      onCreateSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="bg-white shadow-xl rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="font-semibold text-secondary text-xl">
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="bg-primary/10 p-2 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
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

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium text-secondary text-sm">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className="w-full"
            />
          </div>

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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
