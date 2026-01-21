// src/components/auth/HomeRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

const HomeRedirect = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in - redirect to login
      navigate('/login', { replace: true });
      return;
    }

    // Logged in - redirect based on role
    if (user) {
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "practitioner":
          navigate("/practitioner/dashboard", { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-4 border-blue-500/30 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return null;
};

export default HomeRedirect;