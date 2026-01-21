// src/components/RoleBasedRoute.tsx
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "react-toastify";

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string[]; // e.g., ["admin"] or ["participant"]
  redirectTo?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.warning("Please log in to access this page", {
        position: "top-right",
        autoClose: 2000,
      });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // Check if user has the required role
    if (user && !allowedRoles.includes(user.role)) {
      toast.error("You don't have permission to access this page", {
        position: "top-right",
        autoClose: 3000,
      });

      // Redirect based on user role
      const defaultRedirect = redirectTo || getRoleBasedRedirect(user.role);
      navigate(defaultRedirect);
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    allowedRoles,
    navigate,
    redirectTo,
    location,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-4 border-blue-500/30 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  // If not authenticated or wrong role, return null (will redirect in useEffect)
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
};

// Helper function to get default redirect based on role
const getRoleBasedRedirect = (role: string): string => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "practitioner":
      return "/practitioner/dashboard";
    default:
      return "/";
  }
};

export default RoleBasedRoute;
