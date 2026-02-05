import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import LoginLeftAnime from "../login/components/LoginLeftAnime";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { verifyOtp, forgotPassword } from "@/services/authService";

function OtpVerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
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
      toast.info("Please complete the verification process.");
      navigate("/otp-verify", { state: { email }, replace: true });
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle paste
    if (e.key === "Backspace" && otp[index]) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }

    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtp(email, otpCode);
      toast.success(response.message || "OTP verified successfully!");
      // Navigate to reset password page with email in state
      navigate("/reset-password", { state: { email }, replace: true });
    } catch (error: any) {
      console.error("OTP verification failed:", error);

      let message = "OTP verification failed. Please try again.";

      // Safely extract error message
      if (error && typeof error.message === "string" && error.message) {
        message = error.message;
      }

      toast.error(message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  console.log("canResend:", isResending);

  const handleResendOtp = async () => {
    if (!canResend || !email) return;

    setIsResending(true);
    try {
      const response = await forgotPassword(email);
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success(response.message || "OTP has been resent to your email.");
    } catch (error: any) {
      console.error("Resend OTP failed:", error);

      let message = "Failed to resend OTP. Please try again.";

      // Safely extract error message
      if (error && typeof error.message === "string" && error.message) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

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
            onClick={() =>
              toast.info("Please complete the verification process.")
            }
            className="font-medium text-[#273058] hover:underline"
          >
            <ChevronLeft className="inline mr-2 mb-1 w-5 h-5" />
            Back
          </button>
        </div>
        <div className="flex justify-center items-center mt-5 w-full h-auto overflow-hidden">
          {/* Left Side - Animation */}

          {/* Right Side - OTP Verification Form */}
          <div className="flex flex-col justify-center items-center px-8 py-12 w-full md:w-1/2 text-white">
            <div className="space-y-4 w-full max-w-md">
              {/* Header */}
              <div className="text-center">
                <img
                  src="/images/auth/pass.svg"
                  alt="Zyranor Logo"
                  width={92}
                  height={92}
                  className="mx-auto mb-4"
                />
                <h1 className="mb-2 font-semibold text-black text-xl">
                  Enter OTP
                </h1>
                <p className="mb-1 text-[13px] text-gray-400">
                  Please enter the OTP sent to your registered email:
                </p>
                <p className="font-medium text-blue-400 text-sm">
                  {email || "your email"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* OTP Input Circles */}
                <div className="">
                  <div
                    className="flex justify-center space-x-3"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleChange(index, e.target.value.replace(/\D/g, ""))
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="bg-white/5 backdrop-blur-sm border border-[#E1E1E1] focus:border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-14 h-14 font-bold text-primary-foreground text-xl text-center transition-all duration-200"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className="bg-primary disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full font-semibold text-white disabled:transform-none hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed transform"
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                {/* Back to Previous Step */}
                <div className="text-start">
                  <p className="flex font-semibold text-[13px] text-secondary-foreground transition-colors">
                    Haven’t got the otp yet?
                    <span
                      className="ml-1 text-primary hover:underline cursor-pointer"
                      onClick={handleResendOtp}
                      // disabled={isResending}
                    >
                      Resend otp
                    </span>
                  </p>
                </div>
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

export default OtpVerifyPage;
