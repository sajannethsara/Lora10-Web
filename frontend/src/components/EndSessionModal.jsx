import React, { useState } from 'react';
import useUserStore from '../stores/useUserStore';

const STEPS = {
  CONFIRM: 'confirm',   // ask what they want to do
  ENDING:  'ending',    // spinner while ending
  DONE:    'done',      // success summary
};

function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms <= 0) return '< 1 min';
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
  if (mins === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
  return `${hours} hr ${mins} min`;
}

export default function EndSessionModal({ session, onClose }) {
  const { endSession, endAndStartNew, fetchSessions } = useUserStore();
  const [step, setStep]       = useState(STEPS.CONFIRM);
  const [action, setAction]   = useState(null);  // 'end' | 'end_new'
  const [newSid, setNewSid]   = useState(null);
  const [error, setError]     = useState(null);

  const sessionStart = session?.startTime;
  const now          = new Date().toISOString();
  const duration     = formatDuration(sessionStart, now);

  async function handleConfirm(chosenAction) {
    setAction(chosenAction);
    setStep(STEPS.ENDING);
    setError(null);

    try {
      if (chosenAction === 'end') {
        const result = await endSession(session.sid);
        if (result?.error) throw new Error(result.error);
        setStep(STEPS.DONE);
      } else {
        const result = await endAndStartNew(session.sid);
        if (result?.error) throw new Error(result.error);
        setNewSid(result?.newSid);
        setStep(STEPS.DONE);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setStep(STEPS.CONFIRM);
    }
  }

  return (
    // Modal backdrop
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative bg-[#141720] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Confirm step ─────────────────────────────────── */}
        {step === STEPS.CONFIRM && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Warning icon */}
                  <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-amber-900/40 border border-amber-700/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">End Session {session?.sid}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Session summary */}
            <div className="px-6 py-4">
              <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 space-y-2">
                {sessionStart && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Started</span>
                    <span className="text-gray-200 font-medium">
                      {new Date(sessionStart).toLocaleString([], {
                        month: 'short', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Ending now</span>
                  <span className="text-gray-200 font-medium">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {duration && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-green-400 font-semibold">{duration}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-xl px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {/* Action choices */}
              <p className="text-xs text-gray-500 mt-4 mb-3">What would you like to do?</p>

              <div className="flex flex-col gap-2">
                {/* Option A — End only */}
                <button
                  onClick={() => handleConfirm('end')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-red-900/40 border border-red-700/30 flex items-center justify-center group-hover:bg-red-900/60 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">End session</p>
                    <p className="text-[11px] text-gray-500">Mark as finished, stay on this session</p>
                  </div>
                </button>

                {/* Option B — End + New */}
                <button
                  onClick={() => handleConfirm('end_new')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-700/40 bg-green-900/20 hover:bg-green-900/35 hover:border-green-600/50 transition-all text-left group"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-900/50 border border-green-700/40 flex items-center justify-center group-hover:bg-green-800/60 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-300">End &amp; start new session</p>
                    <p className="text-[11px] text-gray-500">Finish this one and begin fresh</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Cancel */}
            <div className="px-6 pb-5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── Ending / spinner step ─────────────────────────────── */}
        {step === STEPS.ENDING && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-14">
            {/* Spinner */}
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-green-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {action === 'end_new' ? 'Ending & starting new session…' : 'Ending session…'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* ── Done step ────────────────────────────────────────── */}
        {step === STEPS.DONE && (
          <div className="flex flex-col items-center px-6 py-10 gap-5">
            {/* Success icon */}
            <div className="h-14 w-14 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center">
              {action === 'end_new' ? (
                <>
                  <p className="text-sm font-semibold text-white">New session started</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Session {session?.sid} ended · Now on
                    <span className="text-green-400 font-semibold"> Session {newSid}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white">Session ended</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Session {session?.sid} has been marked as finished
                  </p>
                </>
              )}

              {duration && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-300">Duration: <span className="text-green-400 font-semibold">{duration}</span></span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

