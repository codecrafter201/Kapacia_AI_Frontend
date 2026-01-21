import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginLeftAnime from "./components/LoginLeftAnime";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/useAuth";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      const userData = await login(email, password);
      
      // Route based on user role
      if (userData?.role === "admin") {
        navigate("/admin/dashboard");
      } else if (userData?.role === "practitioner") {
        navigate("/practitioner/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen overflow-hidden">
      <div className="flex flex-col justify-center items-center px-8 py-8 w-full md:w-1/2 text-white">
        <div className="space-y-4 w-full max-w-md">
          <div className="text-center">
            <img
              src="/images/auth/logo.svg"
              alt="Zyranor Logo"
              width={171}
              height={48}
              className="mx-auto mb-6"
            />
            <h1 className="bg-clip-text font-semibold text-primary text-xl">
              Log In
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email or Username"
                  className="backdrop-blur-sm px-4 py-4 border border-white/10 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-primary-foreground transition-all duration-200 placeholder-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="backdrop-blur-sm px-4 py-4 border border-white/10 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-primary-foreground transition-all duration-200 placeholder-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  showPasswordToggle
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-between items-center text-right">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="mr-2 accent-blue-500"
                />
                <label htmlFor="rememberMe" className="text-primary text-sm">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-primary hover:text-blue-300 text-sm hover:underline transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full font-semibold text-white disabled:transform-none hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed transform"
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Sign Up Link */}
            {/* <div className="text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div> */}
          </form>
        </div>
      </div>
      <div className="hidden relative md:flex justify-center items-center md:w-1/2">
        <LoginLeftAnime />
      </div>
    </div>
  );
}

export default LoginPage;
