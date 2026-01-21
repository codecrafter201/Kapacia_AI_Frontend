import { Outlet } from "react-router-dom";
// import Navbar from "@/components/navigation/Navbar"; // Component not found

export default function BaseLayout() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 ">
        {/* <Navbar /> */}
        <Outlet />
      </div>
    </div>
  );
}