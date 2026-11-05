import React, { useEffect, useRef, useState } from "react";
import useUserStore from "../stores/useUserStore";

const predefinedMessages = [
  { label: "Where are you?", id: 0 },
  { label: "Do you need help?", id: 1 },
  { label: "Come to base now!", id: 2 },
  { label: "Take a break", id: 3 },
  { label: "Please respond ASAP.", id: 4 },
  { label: "Turn right, water available.", id: 5 },
  { label: "Turn left, water available.", id: 6 },
  { label: "Move forward, water available.", id: 7 },
  { label: "Move backward, water available.", id: 8 },
  { label: "Campsite Nearby", id: 9 },
  { label: "Turn on your device", id: 10 },
  { label: "Remain at current location", id: 11 },
  { label: "First aid arriving", id: 12 },
  { label: "Leave area immediately", id: 13 },
  { label: "Seek shelter quickly", id: 14 },
];

const ChatBox = ({ userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [renaming, setRenaming] = useState(false);
  const sid = useUserStore((state) => state.SID);
  const users = useUserStore((state) => state.users);
  const messagesEndRef = useRef(null);

  const currentUser = users.find((u) => u.userId === userId);
  const displayName = currentUser?.username || `User ${userId}`;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:3001/chat/${userId}/${sid}`);
        const data = await res.json();
        if (!isMounted) return;
        setMessages(
          data.map((msg) => ({
            text: msg.text,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            direction: msg.sender,
            type: msg.type || null,
          }))
        );
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (isMounted) setMessages([]);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [userId, sid]);

  const sendMessage = async (messageText, messageType = "custom", pmsgId) => {
    try {
      const sidRes = await fetch("http://localhost:3001/api/session/latest");
      const sidData = await sidRes.json();
      const latestSid = sidData.sid;

      const res = await fetch("http://localhost:3001/b2u", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          sid: latestSid,
          message: messageText,
          type: messageType,
          pmsgId: messageType === "predefined" ? pmsgId : null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            direction: "b2u",
            type: messageType,
          },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    if (input.length > 39) { alert("Max 39 characters!"); return; }
    sendMessage(input, "custom", null);
    setInput("");
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch("http://localhost:3001/api/user/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newUsername, sid: useUserStore.getState().SID }),
      });
      const result = await res.json();
      if (result.success) setRenameOpen(false);
      else alert("Rename failed: " + (result.error || "Unknown error"));
    } catch (err) {
      alert("Rename error: " + err.message);
    }
    setRenaming(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#141720]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-[11px] text-gray-500">ID #{userId}</p>
        </div>

        <button
          onClick={() => { setRenameOpen(true); setNewUsername(""); }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          title="Rename user"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-gray-600">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isB2U = msg.direction === "b2u";
            const isPredefined = isB2U && msg.type === "predefined";

            return (
              <div key={i} className={`flex flex-col ${isB2U ? "items-end" : "items-start"}`}>
                {isPredefined && (
                  <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5 px-1">
                    Predefined
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isPredefined
                      ? "bg-green-900/30 border border-green-700/40 text-green-200 italic"
                      : isB2U
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-white/8 text-gray-200 rounded-bl-sm border border-white/5"
                  }`}
                >
                  <p className="break-words leading-snug">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isB2U ? "text-green-200/70 text-right" : "text-gray-500"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick messages */}
      <div className="px-3 py-2 border-t border-white/5 flex-shrink-0">
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {predefinedMessages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => sendMessage(msg.label, "predefined", msg.id)}
              className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-green-900/50 border border-white/10 hover:border-green-700/50 text-gray-400 hover:text-green-300 transition-all whitespace-nowrap"
            >
              {msg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 py-3 border-t border-white/5 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          maxLength={39}
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600/50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2 px-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Rename Modal */}
      {renameOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-[#1e2230] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 w-72"
          >
            <h2 className="text-base font-semibold text-white">Rename Unit</h2>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="New name..."
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-600/50"
              disabled={renaming}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-all"
                disabled={renaming}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all"
                disabled={renaming}
              >
                {renaming ? "Saving..." : "Rename"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
