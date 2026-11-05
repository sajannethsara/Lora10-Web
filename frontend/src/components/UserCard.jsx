import React from 'react';

function UserCard({ user, onClick, isSelected, collapsed }) {
  const latestGps = Array.isArray(user.gps) && user.gps.length > 0
    ? user.gps[user.gps.length - 1]
    : null;

  const isNode = user.userId <= 26; // antenna / relay node
  const initials = (user.username || `U${user.userId}`)
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = latestGps
    ? (() => {
        const diff = Date.now() - new Date(latestGps.currenttime || latestGps.timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
      })()
    : null;

  if (collapsed) {
    return (
      <div
        onClick={() => onClick(user.userId)}
        title={user.username || `User ${user.userId}`}
        className={`mx-auto my-1.5 h-9 w-9 flex items-center justify-center rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 ${
          isSelected
            ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(user.userId)}
      className={`flex items-center gap-3 px-3 py-2.5 mx-1 my-1 rounded-xl cursor-pointer transition-all duration-200 group ${
        isSelected
          ? 'bg-green-900/40 border border-green-700/50 shadow-sm'
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
          isSelected
            ? 'bg-green-600 text-white'
            : isNode
            ? 'bg-indigo-900/60 text-indigo-300'
            : 'bg-gray-700 text-gray-200'
        }`}
      >
        {isNode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-white truncate">
            {user.username || `User ${user.userId}`}
          </p>
          <span className="text-[10px] text-gray-600 flex-shrink-0">
            #{user.userId}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {latestGps ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {timeAgo}
            </span>
          ) : (
            <span className="text-gray-600 italic">No GPS data</span>
          )}
        </p>
      </div>

      {/* Chat arrow indicator on hover / selected */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 flex-shrink-0 transition-opacity duration-200 ${
          isSelected ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-40 text-gray-400'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
  );
}

export default UserCard;
