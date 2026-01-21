import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";

interface PractitionerNavBarProps {
  onMenuClick?: () => void;
}

const PractitionerNavBar = ({ onMenuClick }: PractitionerNavBarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const heading = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/practitioner/dashboard")) return "Dashboard";
    if (p.startsWith("/practitioner/my-cases")) return "My Cases";
    if (p.startsWith("/practitioner/audit-logs")) return "Audit Logs";
    if (p.startsWith("/practitioner/settings")) return "Settings";
    return "";
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <header className="bg-white border-border/60 border-b">
      <div className="flex justify-between items-center mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4 w-full">
        <div className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden flex justify-center items-center hover:bg-primary/10 p-2 rounded-md"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-secondary" />
          </button>
          <h1 className="font-medium text-secondary text-lg sm:text-xl md:text-2xl truncate">
            {heading}
          </h1>
        </div>

        <div className="relative ml-2 sm:ml-4 shrink-0" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 rounded-md cursor-pointer"
          >
            <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 sm:w-9 h-8 sm:h-9 text-secondary text-sm uppercase">
              {user ? user?.name?.[0] || "U" : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-medium text-secondary text-sm capitalize">
                {user ? `${user?.name}` : "User"}
              </div>
              <div className="text-accent text-xs capitalize">
                {user ? user.role : "Practitioner"}
              </div>
            </div>
            <ChevronDown size={16} className="hidden sm:block text-accent" />
          </button>

          {open && (
            <div className="right-0 z-20 absolute bg-white shadow-lg mt-2 border rounded-md w-36 sm:w-44">
              <Link
                to="/practitioner/settings"
                className="block hover:bg-gray-100 px-3 sm:px-4 py-2 text-secondary text-sm"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="hover:bg-gray-50 px-3 sm:px-4 py-2 w-full text-destructive text-sm text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PractitionerNavBar;
