import BottomNav from "@/components/BottomNav";
import { Outlet, useLocation } from "react-router-dom";
import FloatingQuickSettings from "./FloatingButton";
import { FiMessageSquare } from "react-icons/fi";

function BottomLayout() {
  const location = useLocation();
  const isMessengerScreen = location.pathname.startsWith("/messenger");

  return (
    <>
      <Outlet />
      <BottomNav />
      <div className="lg:hidden">
        <FloatingQuickSettings />
        {!isMessengerScreen && (
          <div className="fixed right-4 bottom-20 z-50">
            <button
              onClick={() => (window.location.href = "/messenger")}
              className="bg-red-800 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
              aria-label="Open Messenger"
            >
              <FiMessageSquare size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default BottomLayout;
