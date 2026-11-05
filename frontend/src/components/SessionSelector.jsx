import React, { useEffect, useState } from 'react';
import useUserStore from '../stores/useUserStore';
import SessionPickerPanel from './SessionPickerPanel';

const SessionSelector = () => {
  const { sessions, SID, setSID, fetchSessions } = useUserStore();
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Latest = highest sid
  const latestSession = sessions.length > 0
    ? sessions.reduce((a, b) => (b.sid > a.sid ? b : a))
    : null;

  const isLive = latestSession && SID === latestSession.sid;

  const handleGoLive = () => {
    if (latestSession) setSID(latestSession.sid);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Session
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-900/40 border border-green-700/40 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Session picker trigger button */}
          <button
            onClick={() => setPanelOpen(true)}
            className="flex-1 min-w-0 flex items-center justify-between gap-2 bg-[#1e2230] border border-white/10 text-white text-sm rounded-xl px-3 py-2 hover:border-white/20 hover:bg-[#252b3b] transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="truncate">
                {SID === 0 ? 'Default' : `Session ${SID}`}
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Live button */}
          <button
            onClick={handleGoLive}
            disabled={isLive || !latestSession}
            title="Jump to latest active session"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
              isLive
                ? 'bg-green-700/30 border border-green-600/40 text-green-400 cursor-default'
                : 'bg-green-600 hover:bg-green-500 text-white border border-transparent shadow-sm shadow-green-900/40'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-white'}`} />
            Live
          </button>
        </div>
      </div>

      {/* Session picker slide-in panel */}
      {panelOpen && <SessionPickerPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
};

export default SessionSelector;
