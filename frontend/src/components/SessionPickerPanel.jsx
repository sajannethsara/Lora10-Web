import React, { useState } from 'react';
import useUserStore from '../stores/useUserStore';
import EndSessionModal from './EndSessionModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms <= 0) return '< 1 min';
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionPickerPanel({ onClose }) {
  const { sessions, SID, setSID, addSession } = useUserStore();
  const [endTarget, setEndTarget] = useState(null); // session object to end

  // Highest sid = "latest"
  const latestSid = sessions.length > 0
    ? Math.max(...sessions.map(s => s.sid))
    : null;

  const handleSelect = (sid) => {
    setSID(sid);
    onClose();
  };

  const handleAddSession = async () => {
    await addSession();
    onClose();
  };

  const handleEndClick = (e, session) => {
    e.stopPropagation(); // don't also select the session
    setEndTarget(session);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200]" onClick={onClose}>
        {/* Panel — sits flush on the left over the sidebar */}
        <div
          className="absolute left-0 top-0 h-full w-72 bg-[#141720] border-r border-white/8 flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-white">Sessions</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: 'thin' }}>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs">No sessions yet</p>
              </div>
            ) : (
              [...sessions].reverse().map((session) => {
                const isViewing  = session.sid === SID;
                const isLatest   = session.sid === latestSid;
                const isActive   = session.status === 'active';
                const isLiveNow  = isLatest && isActive;
                const isFinished = session.status === 'finish';

                // Use doe (actual end time) if available, else lastActivity
                const endTime  = session.endTime || session.lastActivity;
                const duration = formatDuration(session.startTime, endTime);

                return (
                  <div
                    key={session.sid}
                    onClick={() => handleSelect(session.sid)}
                    className={`w-full text-left rounded-xl px-3 py-3 mb-1.5 cursor-pointer transition-all duration-150 group border ${
                      isViewing
                        ? 'bg-green-900/30 border-green-700/40'
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/8'
                    }`}
                  >
                    {/* Top row: label + badges + end button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-semibold truncate ${isViewing ? 'text-green-300' : 'text-white'}`}>
                          Session {session.sid}
                        </span>
                        {isLiveNow && (
                          <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-900/50 border border-green-700/50 px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                        {isFinished && (
                          <span className="flex-shrink-0 text-[9px] font-semibold text-gray-500 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full">
                            ENDED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Selected check */}
                        {isViewing && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}

                        {/* End button — only on active sessions */}
                        {isActive && (
                          <button
                            onClick={(e) => handleEndClick(e, session)}
                            title="End this session"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Start date + time */}
                    {session.startTime && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] text-gray-500">
                          {formatDate(session.startTime)} · {formatTime(session.startTime)}
                        </span>
                      </div>
                    )}

                    {/* End time + duration row */}
                    <div className="flex items-center justify-between mt-1 gap-2">
                      {isFinished && endTime ? (
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[11px] text-gray-500">
                            Ended {formatTime(endTime)}
                          </span>
                        </div>
                      ) : isActive ? (
                        <span className="text-[11px] text-green-500/70 italic">
                          In progress
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-600 italic">No activity</span>
                      )}

                      {duration && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isViewing
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-white/5 text-gray-500'
                        }`}>
                          {duration}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — new session */}
          <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
            <button
              onClick={handleAddSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all shadow-sm shadow-green-900/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* End session modal — rendered on top of everything */}
      {endTarget && (
        <EndSessionModal
          session={endTarget}
          onClose={() => {
            setEndTarget(null);
            onClose(); // close the picker too so user sees updated list
          }}
        />
      )}
    </>
  );
}
