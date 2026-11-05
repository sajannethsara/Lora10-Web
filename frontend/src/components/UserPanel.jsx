import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';
import UserCard from './UserCard';

function UserPanel({ highlightedUserId, onSelectUser, collapsed }) {
  const { users, fetchUsers, SID } = useUserStore();

  useEffect(() => {
    fetchUsers();
    const intervalId = setInterval(fetchUsers, 1000);
    return () => clearInterval(intervalId);
  }, [SID, fetchUsers]);

  if (users.length === 0) {
    return collapsed ? null : (
      <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <p className="text-xs text-gray-600">No units in this session</p>
      </div>
    );
  }

  return (
    <div className="pt-1">
      {users.map((user) => (
        <UserCard
          key={user.userId}
          user={user}
          isSelected={user.userId === highlightedUserId}
          onClick={() => onSelectUser(user.userId)}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

export default UserPanel;
