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
const socket = io("http://localhost:3000");

const App = () => {
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const SID = useUserStore((state) => state.SID);

  const [highlightedUserId, setHighlightedUserId] = useState(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);

  useEffect(() => {
    const fetch = () => fetchUsers();
    fetch(); // initial fetch
    const interval = setInterval(fetch, 1000); // poll DB every 1 second
    return () => clearInterval(interval);
  }, [SID, fetchUsers]);

  // ✅ Listen for new U2B messages and show alert
  

  const handleUserSelect = (id) => {
    setHighlightedUserId(id);
    setSelectedUserForChat(id);
  };

  const closeChat = () => {
    setSelectedUserForChat(null);
  };

  return (
    <>
      {/* Main Layout */}
      <div className="bg-[#232222] flex flex-1 h-screen w-full relative">
        {/* Left Panel */}
        <div className="bg-[#232222] flex-1 overflow-y-auto w-full h-full rounded-2xl shadow-lg border border-green-900 p-1 space-y-1">
          <div className="flex justify-center mb-2 mt-2">
            <img src={logo} alt="Logo" className="h-20" />
          </div>
          <SysInfo />
          <UserPanel
            highlightedUserId={highlightedUserId}
            onSelectUser={handleUserSelect}
          />
        </div>

        {/* Map Panel */}
        <div className="bg-[#232222] flex flex-3 relative border border-green-900 rounded-2xl shadow-lg">
          <Mapbox users={users} highlightedUserId={highlightedUserId} />
          {selectedUserForChat && (
            <div
              className="absolute bg-red shadow-lg rounded-2xl"
              style={{
                width: "300px",
                height: "100%",
                zIndex: 50,
                marginLeft: "10px",
                marginTop: "10px",
                marginBottom: "10px",
              }}
            >
              <ChatBox userId={selectedUserForChat} onClose={closeChat} />
              <NotificationListener />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
