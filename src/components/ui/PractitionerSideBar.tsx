import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavLink, Link } from "react-router-dom";

const PractitionerSideBar = () => {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      to: "/practitioner/dashboard",
      icon: "dash",
    },
    {
      key: "my-classes",
      label: "My Cases",
      to: "/practitioner/my-cases",
      icon: "class",
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      to: "/practitioner/audit-logs",
      icon: "audit",
    },
    {
      key: "settings",
      label: "Settings",
      to: "/practitioner/settings",
      icon: "setting",
    },
  ];
  return (
    <aside className="flex flex-col justify-between bg-white border-border/60 border-r w-64 h-full">
      <div>
        <div className="flex items-center gap-3 px-6 py-3 border-border/60 border-b">
          <Link to="/practitioner/dashboard" className="flex items-center">
            <img
              src="/images/practitioner/dashboardlogo.svg"
              alt="Kapacia AI"
              className="rounded-md w-full h-14"
            />
            {/* <div>
              <h1 className="font-bold text-[#03045E] text-2xl">Kapacia AI</h1>
              <p className="text-[#67B5F9] text-[12px]">
                Clinical Documentation
              </p>
            </div> */}
          </Link>
        </div>

        <nav className="space-y-1 px-2 py-4">
          {items.map((it) => (
            <NavLink
              key={it.key}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mx-2 hover:bg-gray-100 ${
                  isActive ? "bg-blue-50  text-primary" : "text-accent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={
                      isActive
                        ? `/images/practitioner/active/${it.icon}.svg`
                        : `/images/practitioner/${it.icon}.svg`
                    }
                    alt={it.label}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">{it.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-6 py-8">
        <div className="pt-6 border-border/60 border-t">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
};

export default PractitionerSideBar;
