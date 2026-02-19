import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, HelpCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { useUpdateProfile, useUpdatePassword } from "@/hooks/useUsers";
import { backupAllData } from "@/services/backupService";

export const AdminSettingPage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [masterPrompt, setMasterPrompt] = useState(
    user?.masterSoapPrompt ||
      "Please provide a concise summary of the client's overall condition, key concerns, and recommended actions based on the Summary note above.",
  );

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setMasterPrompt(
        user.masterSoapPrompt ||
          "Please provide a concise summary of the client's overall condition, key concerns, and recommended actions based on the Summary note above.",
      );
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);

      // Show loading
      Swal.fire({
        title: "Creating Backup...",
        text: "Please wait while we backup all system data",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Call backup API
      const blob = await backupAllData();

      // Download the backup file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kapacia-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Backup Complete",
        text: "System backup downloaded successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Backup error:", error);
      Swal.fire({
        icon: "error",
        title: "Backup Failed",
        text: "Failed to create system backup. Please try again.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate form
      if (!formData.name.trim()) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Name is required",
        });
        return;
      }

      // Update profile
      const profileData: any = { name: formData.name };

      // Add master prompt if it has changed
      if (masterPrompt !== user?.masterSoapPrompt) {
        profileData.masterSoapPrompt = masterPrompt;
      }

      const profileResponse =
        await updateProfileMutation.mutateAsync(profileData);

      // Update user context with the complete updated user from backend
      if (profileResponse && profileResponse.data) {
        const updatedUserData =
          profileResponse.data.user || profileResponse.data.userData;
        if (updatedUserData) {
          setUser(updatedUserData);
        }
      }

      // Update password if provided
      if (
        formData.currentPassword ||
        formData.password ||
        formData.confirmPassword
      ) {
        if (
          !formData.currentPassword ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: "All password fields are required if updating password",
          });
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: "New password and confirm password do not match",
          });
          return;
        }

        if (formData.password.length < 6) {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: "Password must be at least 6 characters",
          });
          return;
        }

        await updatePasswordMutation.mutateAsync({
          currentPassword: formData.currentPassword,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        password: "",
        confirmPassword: "",
      }));

      setIsEditing(false);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile updated successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Profile Settings Header */}
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="font-medium text-secondary text-sm">
            Profile Settings
          </h1>
          <p className="mt-1 text-accent text-sm">
            You can change your profile details here seamlessly.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            variant="link"
            className="bg-primary/10"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Backing up...
              </>
            ) : (
              "Backup"
            )}
          </Button>
          <Button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={
              updateProfileMutation.isPending ||
              updatePasswordMutation.isPending
            }
            className="bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-full w-full sm:w-auto text-white"
          >
            {updateProfileMutation.isPending ||
            updatePasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save"
            ) : (
              "Edit"
            )}
          </Button>
        </div>
      </div>

      {/* User Details Section */}
      <Card className="p-6">
        <div className="flex md:flex-row flex-col gap-8 pb-6 border-border border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-medium text-secondary text-sm">
                User Details
              </h2>
              <HelpCircle className="w-4 h-4 text-accent" />
            </div>
            <p className="mb-6 text-accent text-sm">
              This is the main profile that will be visible for everyone
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-4 w-full max-w-md">
            <div className="relative">
              <User className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="py-2.5 pl-10"
                placeholder="Your name"
              />
            </div>

            {/* Email Input */}
            <div>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="py-2.5"
                placeholder="Your email"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Data Retention Policy */}
      <Card className="bg-blue-50 p-6 border-blue-200">
        <h2 className="font-medium text-secondary text-sm">
          Data Retention Policy
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex justify-center items-center bg-primary rounded-full w-4 h-4 font-bold text-white text-xs shrink-0">
              •
            </div>
            <p className="text-secondary">
              <span className="font-medium">
                Audio recordings and transcripts:
              </span>{" "}
              Automatically deleted 7 days after approval of the corresponding
              session or summary notes.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex justify-center items-center bg-primary rounded-full w-4 h-4 font-bold text-white text-xs shrink-0">
              •
            </div>
            <p className="text-secondary">
              <span className="font-medium">Unapproved audio files:</span>{" "}
              Automatically deleted 30 days from the date of the session if no
              approval is recorded.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex justify-center items-center bg-primary rounded-full w-4 h-4 font-bold text-white text-xs shrink-0">
              •
            </div>
            <p className="text-secondary">
              <span className="font-medium">Structured records:</span> All
              approved notes, summaries, case records, and session documentation
              will remain securely retained.
            </p>
          </div>
        </div>
      </Card>

      {/* Password Section */}
      <Card className="flex md:flex-row flex-col gap-4 p-6">
        <h2 className="mt-1 font-medium text-secondary text-sm">Password</h2>
        <div className="space-y-2 w-full max-w-md">
          <Input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="py-2.5"
            placeholder="Current password"
          />
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="py-2.5"
            placeholder="New password"
          />
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="py-2.5"
            placeholder="Confirm new password"
          />
        </div>
      </Card>

      {/* Master Summary Prompt */}
      <Card className="p-6">
        <div className="flex items-start gap-2 mb-4">
          <h2 className="font-medium text-secondary text-sm">
            Master Prompt for Note Summary
          </h2>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="-top-2 left-6 z-10 absolute bg-gray-800 opacity-0 group-hover:opacity-100 shadow-lg px-3 py-2 rounded-md w-64 text-white text-xs transition-opacity">
              This prompt will be used to generate AI summaries for Summary
              notes. Individual practitioners can customize their own prompt,
              otherwise this master prompt will be used as default.
            </div>
          </div>
        </div>
        <p className="mb-4 text-accent text-sm">
          Set the default AI prompt for generating Summary note summaries. This
          will be applied to all practitioners unless they customize their own
          prompt.
        </p>
        <textarea
          value={masterPrompt}
          onChange={(e) => setMasterPrompt(e.target.value)}
          disabled={!isEditing}
          placeholder="Enter the master prompt for Summary summary generation..."
          rows={4}
          className="disabled:opacity-50 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary w-full text-sm resize-none disabled:cursor-not-allowed"
        />
        <p className="mt-2 text-gray-500 text-xs">
          Recommended: Include instructions for concise summaries focusing on
          key client concerns and recommended actions.
        </p>
      </Card>
    </div>
  );
};
