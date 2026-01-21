import { Outlet } from "react-router-dom";
import PractitionerSideBar from "../ui/PractitionerSideBar";
import PractitionerNavBar from "../ui/PractitionerNavBar";
import { useState } from "react";
import { X } from "lucide-react";

export function PractictionerDashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMobileSidebarOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="relative flex bg-gray-50 h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <PractitionerSideBar />
      </div>

      {/* Mobile Sidebar Modal */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`lg:hidden z-40 fixed inset-0 bg-black/50 duration-300 ${
              isClosing ? "animate-out fade-out" : "animate-in fade-in"
            }`}
            onClick={handleCloseSidebar}
          />
          {/* Sidebar */}
          <div
            className={`lg:hidden top-0 bottom-0 left-0 z-50 fixed bg-white shadow-xl w-64 duration-300 ${
              isClosing
                ? "animate-out slide-out-to-left"
                : "animate-in slide-in-from-left"
            }`}
          >
            <button
              onClick={handleCloseSidebar}
              className="top-2 right-2 absolute hover:bg-gray-100 p-2 rounded-md transition-colors duration-200"
              aria-label="Close menu"
            >
              <X size={20} className="text-gray-700" />
            </button>
            <div onClick={handleCloseSidebar} className="h-full">
              <PractitionerSideBar />
            </div>
          </div>
        </>
      )}

      <main className="grid grid-rows-[auto_1fr] w-full h-screen overflow-hidden">
        <PractitionerNavBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <div className="p-3 sm:p-4 md:p-6 h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
