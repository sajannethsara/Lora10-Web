import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';

const SessionSelector = () => {
  const { sessions, SID, setSID, fetchSessions, addSession } = useUserStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleAddSession = async () => {
    await addSession();
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border border-gray-400 rounded p-1"
        value={SID}
        onChange={(e) => setSID(Number(e.target.value))}
      >
        <option value={0}>Default Session (0)</option>
        {sessions.map((session) => (
          <option key={session.sid} value={session.sid}>
            Session {session.sid}
          </option>
        ))}
      </select>

      <button
        onClick={handleAddSession}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
        title="Add New Session"
      >
        ➕ New
      </button>
    </div>
  );
};

export default SessionSelector;
