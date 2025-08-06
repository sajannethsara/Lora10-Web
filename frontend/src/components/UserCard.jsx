import React from 'react';

function UserCard({ user, onClick, isSelected }) {
  const latestGps = Array.isArray(user.gps) && user.gps.length > 0
    ? user.gps[user.gps.length - 1]
    : null;

  return (
    <div
      onClick={() => onClick(user.userId)}
      style={{
        border: isSelected ? '2px solid #1E3A8A' : '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        margin: '10px',
        backgroundColor: isSelected ? '#DBEAFE' : '#f9f9f9',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 6px rgba(30, 58, 138, 0.4)' : 'none'
      }}
    >
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
        user@{user.userId} + {user.username}
      </p>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
        {latestGps
          ? `Last GPS update: ${new Date(latestGps.currenttime || latestGps.timestamp).toLocaleString()}`
          : 'No GPS data available'}
      </p>
    </div>
  );
}

export default UserCard