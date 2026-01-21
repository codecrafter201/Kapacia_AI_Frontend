import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
import LoginLeftAnime from "../login/components/LoginLeftAnime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { forgotPassword } from "@/services/authService";

function ForgotPassPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      toast.success(response.message || "OTP has been sent to your email.");
      // Navigate to OTP verification page with email in state (not URL for security)
      navigate("/otp-verify", { state: { email }, replace: true });
    } catch (error) {
      console.error("Forgot password failed:", error);
      const message = error instanceof Error ? error.message : "Failed to send reset code. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr] bg-white min-h-screen">
      <div className="flex justify-between items-center px-4 sm:px-8 py-4 border-[#D6D6D6] border-b-2 w-full">
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
        <div className="top-0 left-0 absolute mt-4 px-4 sm:px-8 py-4">
          <Link
            to="/login"
            className="font-medium text-[#273058] hover:underline"
          >
            <ChevronLeft className="inline mr-2 mb-1 w-5 h-5" />
            Back
          </Link>
        </div>
        <div className="flex justify-center items-center mt-5 w-full h-auto overflow-hidden">
          <div className="flex flex-col justify-center items-center px-8 py-12 w-full md:w-1/2 text-white">
            <div className="space-y-4 w-full max-w-md">
              {/* Header */}
              <div className="text-center">
                <img
                  src="/images/auth/Lock.svg"
                  alt="Zyranor Logo"
                  width={92}
                  height={92}
                  className="mx-auto mb-4"
                />
                <h1 className="mb-2 font-semibold text-black text-xl">
                  Forgot Password
                </h1>
                <p className="text-[13px] text-gray-400">
                  Please enter your Email to reset the password
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      className="backdrop-blur-sm px-4 py-4 border border-white/10 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-primary-foreground transition-all duration-200 placeholder-gray-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full font-semibold text-white disabled:transform-none hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed transform"
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
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

export default ForgotPassPage;
