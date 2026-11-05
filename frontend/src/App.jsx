import { useEffect, useState } from "react";
import Mapbox from "./components/Mapbox";
import SysInfo from "./components/SysInfo";
import UserPanel from "./components/UserPanel";
import ChatBox from "./components/chatbox";
import useUserStore from "./stores/useUserStore";
import logo from "./assets/logo3.png";
import io from "socket.io-client";
import NotificationListener from "./components/NotificationListner";

// Connect to backend
const socket = io("http://localhost:3001");

const App = () => {
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const SID = useUserStore((state) => state.SID);

  const [highlightedUserId, setHighlightedUserId] = useState(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetch = () => fetchUsers();
    fetch();
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
  }, [SID, fetchUsers]);

  const handleUserSelect = (id) => {
    setHighlightedUserId(id);
    setSelectedUserForChat(id);
  };

  const closeChat = () => {
    setSelectedUserForChat(null);
  };

  return (
    <div className="bg-[#0f1117] flex h-screen w-full overflow-hidden font-['Poppins']">
      {/* ── Sidebar ── */}
      <div
        className={`flex flex-col bg-[#141720] border-r border-white/5 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-16" : "w-72"
        } flex-shrink-0 h-full`}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          {!sidebarCollapsed && (
            <img src={logo} alt="Logo" className="h-10 object-contain" />
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Sys Info + Session */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <SysInfo />
          </div>
        )}

        {/* Users label */}
        {!sidebarCollapsed && (
          <div className="px-4 pt-4 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Field Units
            </span>
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}>
          <UserPanel
            highlightedUserId={highlightedUserId}
            onSelectUser={handleUserSelect}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#141720] border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white">Live Map</span>
            {selectedUserForChat && (
              <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                Chatting with user@{selectedUserForChat}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {users.length} unit{users.length !== 1 ? "s" : ""} active
            </span>
          </div>
        </div>

        {/* Map + Chat */}
        <div className="flex flex-1 relative overflow-hidden">
          <Mapbox users={users} highlightedUserId={highlightedUserId} />

          {/* Chat panel slides in over the map */}
          {selectedUserForChat && (
            <div
              className="absolute top-3 left-3 bottom-3 z-50"
              style={{ width: "320px" }}
            >
              <ChatBox userId={selectedUserForChat} onClose={closeChat} />
            </div>
          )}

          {/* Notifications */}
          <NotificationListener />
        </div>
      </div>
    </div>
  );
};

export default App;
