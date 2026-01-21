import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleLogout}
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-[#FF0105] hover:text-[#FF010577] cursor-pointer"
      >
        <LogOut size={20} className="" />
        Logout
      </button>
    </div>
  );
};
