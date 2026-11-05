import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function NotificationListener() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on("newU2BMessage", (msg) => {
      const id = Date.now();
      setNotifications((prev) => [{ ...msg, id }, ...prev].slice(0, 5));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    });

    return () => socket.disconnect();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[100] pointer-events-none">
      {notifications.map((msg) => (
        <div
          key={msg.id}
          className="flex items-start gap-3 bg-[#1e2230] border border-green-700/50 shadow-2xl rounded-2xl px-4 py-3 w-72 animate-slide-in"
          style={{
            animation: "slideIn 0.25s ease-out",
          }}
        >
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-green-900/60 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-400">
              Unit #{msg.uid}
            </p>
            <p className="text-xs text-gray-300 truncate mt-0.5">{msg.message}</p>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
