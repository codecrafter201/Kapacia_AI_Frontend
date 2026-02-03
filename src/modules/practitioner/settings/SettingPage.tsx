import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, HelpCircle, Loader2 } from "lucide-react";
import {
  updateProfile,
  updatePassword,
} from "@/services/userService/userService";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export const SettingPage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [sessionLanguage, setSessionLanguage] = useState(
    user?.language || "english",
  );
  const [piiMasking, setPiiMasking] = useState(user?.piiMasking !== false);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setSessionLanguage(user.language || "english");
      setPiiMasking(user.piiMasking !== false);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let profileUpdated = false;
      let passwordUpdated = false;

      // Prepare profile update data
      const profileData: any = {};
      let hasProfileChanges = false;

      if (formData.name.trim() !== "" && formData.name !== user?.name) {
        profileData.name = formData.name;
        hasProfileChanges = true;
      }

      if (sessionLanguage !== user?.language) {
        profileData.language = sessionLanguage;
        hasProfileChanges = true;
      }

      if (piiMasking !== (user?.piiMasking !== false)) {
        profileData.piiMasking = piiMasking;
        hasProfileChanges = true;
      }

      // Validate: PII Masking can only be enabled with English
      if (
        profileData.piiMasking === true &&
        (profileData.language || sessionLanguage) !== "english"
      ) {
        toast.error("PII Masking can only be enabled with English language");
        setIsLoading(false);
        return;
      }

      // Update profile if there are changes
      if (hasProfileChanges) {
        const profileResponse = await updateProfile(profileData);
        if (profileResponse && profileResponse.data) {
          profileUpdated = true;
          // Update user context with the complete updated user from backend
          const updatedUserData =
            profileResponse.data.user || profileResponse.data.userData;
          if (updatedUserData) {
            setUser(updatedUserData);
          }
        }
      }

      // Update password if provided
      if (formData.currentPassword && formData.password) {
        if (formData.password !== formData.confirmPassword) {
          await Swal.fire({
            title: "Error",
            text: "New password and confirm password do not match",
            icon: "error",
            confirmButtonColor: "#188aec",
          });
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          await Swal.fire({
            title: "Error",
            text: "Password must be at least 6 characters long",
            icon: "error",
            confirmButtonColor: "#188aec",
          });
          setIsLoading(false);
          return;
        }

        const passwordResponse = await updatePassword({
          currentPassword: formData.currentPassword,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        if (passwordResponse && passwordResponse.success) {
          passwordUpdated = true;
        }
      }

      if (profileUpdated || passwordUpdated) {
        if (profileUpdated) {
          await Swal.fire({
            title: "Success!",
            text: "Profile updated successfully",
            icon: "success",
            confirmButtonColor: "#188aec",
          });
        }

        if (passwordUpdated) {
          await Swal.fire({
            title: "Success!",
            text: "Password updated successfully",
            icon: "success",
            confirmButtonColor: "#188aec",
          });
        }

        // Clear password fields after successful save
        setFormData({
          ...formData,
          pentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setIsEditing(false);
      } else if (
        !profileUpdated &&
        !passwordUpdated &&
        (formData.currentPassword || formData.newPassword)
      ) {
        // Only show error if password fields were filled but update failed
        await Swal.fire({
          title: "Error",
          text: "Failed to update. Please try again.",
          icon: "error",
          confirmButtonColor: "#188aec",
        });
      } else {
        // No changes were made
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error("Failed to update:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to update profile",
        icon: "error",
        confirmButtonColor: "#188aec",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     console.log("File uploaded:", file);
  //     // Handle file upload logic here
  //   }
  // };

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
        <Button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-full w-full sm:w-auto text-white"
        >
          {isLoading ? (
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

      {/* Profile Picture Section */}
      {/* <Card className="p-6">
        <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
          <div>
            <h2 className="font-medium text-secondary text-sm">
              Profile Picture
            </h2>
            <p className="mt-1 mb-4 text-accent text-sm">
              This is where people will see your actual face
            </p>
            <div className="flex items-center gap-4">
              
              <button className="font-medium text-primary text-sm hover:underline cursor-pointer">
                View Details
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label
              htmlFor="profile-upload"
              className="flex flex-col justify-center items-center bg-gray-50 hover:bg-gray-100 p-8 border-2 border-gray-300 border-dashed rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex justify-center items-center bg-primary/10 mb-3 rounded-full w-12 h-12">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-gray-700 text-sm text-center">
                <span className="text-primary">Click here</span> to upload your
                file or drag.
              </p>
              <p className="mt-2 text-gray-400 text-xs">
                Supported Format: SVG, JPG, PNG (10mb each)
              </p>
              <input
                id="profile-upload"
                type="file"
                className="hidden"
                accept=".svg,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </Card> */}

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
        <div className="space-y-4">
          {/* Role Information */}
          <div className="space-y-1 text-sm">
            <p className="text-accent">
              <span className="font-medium">Role:</span>{" "}
              <span className="text-accent-foreground">
                {user?.role || "Practitioner"}
              </span>
            </p>
            <p className="text-accent">
              <span className="font-medium">Supervised by:</span>{" "}
              <span className="text-accent-foreground">Dr. Lim Cen</span>
            </p>
            <p className="text-accent">
              <span className="font-medium">Member Since:</span>{" "}
              <span className="text-accent-foreground">Jan 1, 2024</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Password Section */}
      <Card className="flex md:flex-row flex-col gap-4 p-6">
        <div className="md:min-w-[200px]">
          <h2 className="mt-1 font-medium text-secondary text-sm">Password</h2>
          <p className="mt-1 text-accent text-xs">
            Leave blank if you don't want to change
          </p>
        </div>
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

      {/* Default Session Language */}
      <Card className="p-6">
        <h2 className="mb-3 font-medium text-secondary text-sm">
          Default Session Language
        </h2>
        <div className="flex flex-wrap gap-2">
          <label
            className={`flex items-center gap-2 ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="sessionLanguage"
              value="english"
              checked={sessionLanguage === "english"}
              onChange={(e) => {
                setSessionLanguage(e.target.value);
              }}
              disabled={!isEditing}
              className="focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
            />
            <span className="text-secondary text-sm">English</span>
          </label>
          <label
            className={`flex items-center gap-2 ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="sessionLanguage"
              value="mandarin"
              checked={sessionLanguage === "mandarin"}
              onChange={(e) => {
                setSessionLanguage(e.target.value);
                // Auto-disable PII masking when Mandarin is selected
                if (e.target.value === "mandarin") {
                  setPiiMasking(false);
                  toast.info("PII Masking automatically disabled for Mandarin");
                }
              }}
              disabled={!isEditing}
              className="focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
            />
            <span className="text-secondary text-sm">Mandarin</span>
          </label>
        </div>
      </Card>

      {/* PII Masking Default */}
      <Card className="p-6">
        <h2 className="mb-3 font-medium text-secondary text-sm">
          PII Masking Default
        </h2>
        <p className="mb-3 text-accent text-xs">
          {sessionLanguage !== "english" &&
            "PII Masking is only available with English language"}
        </p>
        <div className="flex flex-wrap gap-2">
          <label
            className={`flex items-center gap-2 ${!isEditing || sessionLanguage !== "english" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="piiMasking"
              value="on"
              checked={piiMasking === true}
              onChange={(e) => {
                if (sessionLanguage !== "english") {
                  toast.error(
                    "PII Masking can only be enabled with English language",
                  );
                  return;
                }
                setPiiMasking(true);
              }}
              disabled={!isEditing || sessionLanguage !== "english"}
              className="focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
            />
            <span className="text-secondary text-sm">On</span>
          </label>
          <label
            className={`flex items-center gap-2 ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="piiMasking"
              value="off"
              checked={piiMasking === false}
              onChange={(e) => setPiiMasking(false)}
              disabled={!isEditing}
              className="focus:ring-2 focus:ring-blue-500 w-4 h-4 text-blue-600"
            />
            <span className="text-secondary text-sm">Off</span>
          </label>
        </div>
      </Card>
    </div>
  );
};
