import React, { useEffect, useState } from "react";
import useUserStore from "../stores/useUserStore";
const ChatBox = ({ userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const sid = useUserStore((state) => state.SID);
  const predefinedMessages = [
    "Where are you?",
    "Do you need help?",
    "Come to base now!",
    "Turn on your tracker.",
  ];

  // ✅ Fetch messages periodically
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:3000/chat/${userId}/${sid}`);
        const data = await res.json();
        console.log("📥 Fetched messages:", data);
        if (!isMounted) return;

        const formatted = data.map((msg) => ({
          text: msg.text,
          time: new Date(msg.timestamp).toLocaleTimeString(),
          direction: msg.sender,
          type: msg.type || null,
        }));

        setMessages(formatted);
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (isMounted) setMessages([]);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId,sid]);

  // ✅ Send message to backend
  const sendMessage = async (messageText, messageType = "custom", pmsgId) => {
    try {
      const sidRes = await fetch("http://localhost:3000/api/session/latest");
      const sidData = await sidRes.json();
      const sid = sidData.sid;
      let mypmsgId = messageType === "predefined" ? pmsgId : null;
      const newMsg = {
        uid:userId,
        sid,
        message: messageText,
        type: messageType,
        pmsgId:mypmsgId
      };

      const res = await fetch("http://localhost:3000/b2u", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      const result = await res.json();

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            text: messageText,
            time: new Date().toLocaleTimeString(),
            direction: "b2u",
            type: messageType,
          },
        ]);
      } else {
        console.error("❌ Backend insert failed:", result.error);
      }
    } catch (err) {
      console.error("❌ Error sending message to backend:", err);
    }
  };

  // ✅ Trigger send for custom typed message
  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, "custom", null);
    setInput("");
  };

  // ✅ Trigger send for predefined message
  const handlePredefined = (msg,pmsgId) => {
    sendMessage(msg, "predefined",pmsgId);
  };

  return (
    <div className="flex flex-col h-full p-3 bg-[#f5f8f4] rounded-lg shadow-md relative">
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <h4 className="font-semibold text-lg text-blue-800">
          Chat with user@{userId}
        </h4>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          ❌
        </button>
      </div>

      {/* ---------- Messages ---------- */}
      <div className="flex-1 overflow-y-auto border rounded p-3 bg-white shadow-inner space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center italic">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isB2U = msg.direction === "b2u";
            const isPredefined = isB2U && msg.type === "predefined";

            const bubbleStyle = isPredefined
              ? "bg-blue-300 border border-blue-500 text-gray-900 italic text-sm p-2"
              : isB2U
              ? "bg-blue-200 text-gray-900 p-3"
              : "bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none p-3";

            return (
              <div
                key={i}
                className={`max-w-[75%] rounded-2xl shadow-md ${
                  isB2U ? "self-end ml-auto rounded-br-none" : ""
                } ${bubbleStyle}`}
              >
                {isPredefined && (
                  <div className="text-[10px] font-semibold text-blue-700 mb-1">
                    Predefined
                  </div>
                )}
                <div>{msg.text}</div>
                <div className="text-[10px] text-right text-gray-500 mt-1">
                  {msg.time}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------- Predefined Message Menu ---------- */}

      {/* Option A: Horizontal Menu */}
      <div className="flex overflow-x-auto gap-2 mt-3 pb-2 border-t border-gray-300">
        {predefinedMessages.map((msg, idx) => (
          <button
            key={idx}
            onClick={() => handlePredefined(msg,idx)}
            className="bg-blue-100 border border-blue-400 text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-200 whitespace-nowrap"
          >
            {msg}
          </button>
        ))}
      </div>

      {/* Option B: Dropdown Menu (Optional, unused) */}
      {/*
      <div className="mt-3 border-t pt-3 relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Predefined Messages ▼
        </button>
        {menuOpen && (
          <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded shadow max-w-xs z-10">
            {predefinedMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handlePredefined(msg);
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-100"
              >
                {msg}
              </button>
            ))}
          </div>
        )}
      </div>
      */}

      {/* ---------- Message Input ---------- */}
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1 p-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
