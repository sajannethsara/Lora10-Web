import React, { useEffect } from 'react';
import useUserStore from '../stores/useUserStore';
import sesionadd from '../assets/plus.svg'

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
      <div className="flex items-center gap-2 w-full">
        <select
          className="border border-gray-400 rounded p-1 bg-[#232222] text-white w-full"
          value={SID}
          onChange={(e) => setSID(Number(e.target.value))}
          style={{ minWidth: 0, flex: 1 }}
        >
          <option value={0}>Default Session (0)</option>
          {sessions.map((session) => (
            <option key={session.sid} value={session.sid}>
              Session {session.sid}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAddSession}
        className="text-gray-700 px-2 py-1 rounded-full hover:bg-green-950 hover:text-white transition-colors mr-2 w-9 h-9 flex items-center justify-center"
        title="Add New Session"
      >
        <img className='h-6 w-6 justify-center' src={sesionadd} alt="" />
      </button>
    </div>
  );
};

export default SessionSelector;

