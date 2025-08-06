import { useEffect, useState } from 'react';
import Mapbox from './components/Mapbox';
import SysInfo from './components/SysInfo';
import UserPanel from './components/UserPanel';
import ChatBox from './components/chatbox';
import SessionSelector from './components/SessionSelector';
import useUserStore from './stores/useUserStore';

const App = () => {
  const { users, fetchUsers, SID } = useUserStore();

  const [highlightedUserId, setHighlightedUserId] = useState(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);

  // Fetch users when SID changes, and poll every 2 seconds
  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 2000);
    return () => clearInterval(interval);
  }, [fetchUsers, SID]);

  const handleUserSelect = (id) => {
    setHighlightedUserId(id);
    setSelectedUserForChat(id);
  };

  const closeChat = () => {
    setSelectedUserForChat(null);
  };

  return (
    <div className="bg-yellow-200 flex flex-1 h-screen w-full relative">
      {/* Left Panel */}
      <div className="bg-red-200 flex-1 overflow-y-auto">
        
        <SysInfo />
        <UserPanel
          highlightedUserId={highlightedUserId}
          onSelectUser={handleUserSelect}
        />
      </div>

      {/* Map Panel */}
      <div className="bg-green-200 flex flex-3 relative">
        <Mapbox users={users} highlightedUserId={highlightedUserId} />
        {selectedUserForChat && (
          <div
            className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg border border-gray-300"
            style={{ width: '300px', height: '400px', zIndex: 50 }}
          >
            <ChatBox userId={selectedUserForChat} onClose={closeChat} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
