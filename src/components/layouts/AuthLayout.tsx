// src/components/layouts/AuthLayout.tsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

export function AuthLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-4 border-blue-500/30 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }
  if (isAuthenticated && user) {
    const redirectPath =
      user.role === "admin" 
        ? "/admin/dashboard" 
        : user.role === "practitioner"
        ? "/practitioner/dashboard"
        : "/";
    
    return <Navigate to={redirectPath} replace />;
  }
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ fontFamily: "Poppins" }}
    >
      <main className="">
        <Outlet />
      </main>
    </div>
  );
}