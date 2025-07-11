

// src/components/UserPanel.jsx
/*import React, { useEffect } from 'react'
import useUserStore from '../stores/useUserStore'
import UserCard from './UserCard'
function UserPanel() {
  const users = useUserStore(state => state.users)
  const setUsers = useUserStore(state => state.setUsers)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/data')
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`)
        }
        const backendUsers = await res.json()
        setUsers(backendUsers)
        console.log('Updating DATA...')
      } catch (error) {
        console.error('Fetch error:', error.message)
      }
    }

    fetchUsers()
    const interval = setInterval(fetchUsers, 1000)

    return () => clearInterval(interval)
  }, [setUsers])

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>User Details:</h2><br />
      {users.length === 0 ? (
        <p>No users available</p>
      ) : (
        users.map(user => (
          <UserCard key={user.userId} user={user} />
        ))
      )}
    </div>
  )
}

export default UserPanel */ 

import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';
import UserCard from './UserCard';

function UserPanel({ highlightedUserId, onSelectUser }) {
  const users = useUserStore(state => state.users);
  const setUsers = useUserStore(state => state.setUsers);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/data');
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const backendUsers = await res.json();
        if(backendUsers.length !== users.length){
          setUsers(backendUsers);
        }else{
          for (let i = 0; i < backendUsers.length; i++) {
            if (JSON.stringify(backendUsers[i]) !== JSON.stringify(users[i])) {
              setUsers(backendUsers);
              break; // Exit loop after first difference found
            }
          }
        }
        console.log('Updating DATA...');
      } catch (error) {
        console.error('Fetch error:', error.message);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 1000);
    return () => clearInterval(interval);
  }, [users]);

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>User Details:</h2><br />
      {users.length === 0 ? (
        <p>No users available</p>
      ) : (
        users.map(user => (
          <UserCard
            key={user.userId}
            user={user}
            isSelected={user.userId === highlightedUserId}
            onClick={() => onSelectUser(user.userId)} // 👈 highlight logic
          />
        ))
      )}
    </div>
  );
}

export default UserPanel;

