import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';
import UserCard from './UserCard';

function UserPanel({ highlightedUserId, onSelectUser }) {
  const users = useUserStore((state) => state.users);
  const setUsers = useUserStore((state) => state.setUsers);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const SID = useUserStore((state) => state.SID);
  

  useEffect(() => {
    // const fetchUsers = async () => {
    //   try {
    //     const res = await fetch('http://localhost:3000/data');
    //     if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    //     const backendUsers = await res.json();
    //     setUsers(backendUsers);
    //   } catch (err) {
    //     console.error('Fetch error:', err);
    //   }
    // };
    console.log('Fetching users with SID:', SID);
    fetchUsers();
    const interval = setInterval(fetchUsers, 2000);
    return () => clearInterval(interval);
  }, [setUsers]);

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>User Details:</h2>
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
