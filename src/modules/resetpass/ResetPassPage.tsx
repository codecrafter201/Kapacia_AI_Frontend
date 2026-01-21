import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import LoginLeftAnime from "../login/components/LoginLeftAnime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { toast } from "react-toastify";
import { resetPassword } from "@/services/authService";

function ResetPassPage() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // Redirect to forgot password if no email in state (security measure)
  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please start again.");
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  // Prevent back navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      toast.info("Please complete the password reset process.");
      navigate("/reset-password", { state: { email }, replace: true });
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [email, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(email, formData.password);
      toast.success(response.message || "Password has been successfully reset!");
      // Navigate to success page and clear history
      navigate("/success-password", { replace: true });
    } catch (error) {
      console.error("Error resetting password:", error);
      const message = error instanceof Error ? error.message : "Failed to reset password. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  return (
    <div className="grid grid-rows-[auto_1fr] bg-white min-h-screen">
      <div className="flex justify-between items-center px-8 py-4 border-[#D6D6D6] border-b-2 w-full">
        <img
          src="/images/auth/logo.svg"
          alt="Zyranor Logo"
          width={171}
          height={48}
          className=""
        />
        <Button
          onClick={() => navigate("/login")}
          variant="default"
          // size="icon"
          className="px-8 py-1.5 text-[13px] text-white"
        >
          Log In
        </Button>
      </div>
      <div className="relative flex flex-col justify-center items-center">
        <div className="top-0 left-0 absolute mt-4 px-8 py-4">
          <button
            onClick={() => toast.info("Please complete the password reset process.")}
            className="font-medium text-[#273058] hover:underline"
          >
            <ChevronLeft className="inline mr-2 mb-1 w-5 h-5" />
            Back
          </button>
        </div>
        <div className="flex justify-center items-center mt-5 w-full h-auto overflow-hidden">
          {/* Left Side - Animation */}

          {/* Right Side - Reset Password Form */}
          <div className="flex flex-col justify-center items-center px-8 py-12 w-full md:w-1/2 text-white">
            <div className="space-y-8 w-full max-w-md">
              {/* Header */}
              <div className="text-center">
                <img
                  src="/images/auth/reset.svg"
                  alt="Zyranor Logo"
                  width={92}
                  height={92}
                  className="mx-auto mb-4"
                />
                <h1 className="mb-2 font-semibold text-black text-xl">
                  Set a new Password
                </h1>
                <p className="mb-2 text-[13px] text-gray-400">
                  {/* Set your new password{" "} */}
                  Create a new password. Ensure it differs from previous ones
                  for security
                  <span className="ml-1 text-primary">"{email}"</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="backdrop-blur-sm px-4 py-4 border border-white/10 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-primary-foreground transition-all duration-200 placeholder-gray-500"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      showPasswordToggle
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      className="backdrop-blur-sm px-4 py-4 border border-white/10 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-primary-foreground transition-all duration-200 placeholder-gray-500"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      showPasswordToggle
                    />
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-red-400 text-xs">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="bg-primary disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full font-semibold text-white disabled:transform-none hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed transform"
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {/* Back Link */}
                {/* <div className="text-center">
                  <Link
                    to="/otp-verify"
                    className="flex justify-center items-center text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to OTP Verification
                  </Link>
                </div> */}
              </form>
            </div>
          </div>
          <div className="hidden relative md:flex justify-center items-center md:w-1/2">
            <LoginLeftAnime />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassPage;
