import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';
import UserCard from './UserCard';

function UserPanel({ highlightedUserId, onSelectUser }) {
  const { users, fetchUsers, SID } = useUserStore();

  useEffect(() => {
    fetchUsers(); // initial fetch
    const intervalId = setInterval(fetchUsers, 1000); // ✅ poll DB every 1 second
    return () => clearInterval(intervalId); // cleanup
  }, [SID, fetchUsers]); // refetch automatically on session change

  return (
    <div>
      <br />
      {users.length === 0 ? (
        <p>No users available</p>
      ) : (
        users.map((user) => (
          <UserCard
            key={user.userId}
            user={user}
            isSelected={user.userId === highlightedUserId}
            onClick={() => onSelectUser(user.userId)}
          />
        ))
      )}
    </div>
  );
}

export default UserPanel;
