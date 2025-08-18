import React, { useEffect, useState } from "react";
import useUserStore from "../stores/useUserStore";
import sendIMG from '../assets/send.svg';
import cancelIMG from '../assets/cancel.svg';
import close from '../assets/closeArrow.svg';
import rename from '../assets/rename.svg';

const ChatBox = ({ userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [renaming, setRenaming] = useState(false);
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

  // Rename handler
  const handleRename = () => {
    setRenameOpen(true);
    setNewUsername("");
  };

  const handleRenameSubmit = async (e) => {
  e.preventDefault();
  if (!newUsername.trim()) return;
  setRenaming(true);

  try {
    const sid = useUserStore.getState().SID;

    // 1️⃣ Update UI immediately
    

    // 2️⃣ Send rename request to backend
    const res = await fetch(`http://localhost:3000/api/user/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newUsername, sid }),
    });

    const result = await res.json();
    if (result.success) {
      setRenameOpen(false);
    } else {
      alert("Rename failed: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    alert("Rename error: " + err.message);
  }

  setRenaming(false);
};



  return (
    <div className={`flex flex-col h-[95vh] p-3 bg-[#353535] rounded-lg shadow-md relative`}>
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
        <button
          onClick={onClose}
          className="text-gray-700 px-3 py-1 rounded-full hover:bg-green-950 hover:text-white transition-colors mr-2 w-10 h-10 flex items-center justify-center"
          title="Close Chat"
        >
          <img className='h-5 w-5 justify-center' src={close} alt="" />
        </button>
        <div className="flex items-center gap-2">
          <h4 className=" text-lg text-white">
            Chat with user@{userId}
          </h4>
          <button
            onClick={handleRename}
            className="text-gray-700 px-3 py-1 rounded-full hover:bg-green-950 hover:text-white transition-colors w-10 h-10 flex items-center justify-center"
            title="Rename User"
          >
            <img className='h-6 w-6 justify-center' src={rename} alt="" />
          </button>
        </div>
      </div>

      {/* ---------- Messages ---------- */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden rounded bg-[#353535] shadow-inner space-y-2 m-2 p-0.5 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hide scrollbar for Chrome, Safari and Opera */}
        <style>
          {`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center italic">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isB2U = msg.direction === "b2u";
            const isPredefined = isB2U && msg.type === "predefined";

            const bubbleStyle = isPredefined
              ? "bg-green-100 border border-gray-300 text-gray-600 italic text-sm p-2"
              : isB2U
              ? "bg-green-900 text-white p-3"
              : "bg-gray-500 text-white self-start mr-auto rounded-bl-none p-3";

            return (
              <div
                key={i}
                className={`max-w-[75%] rounded-2xl shadow-sm ${
                  isB2U ? "self-end ml-auto rounded-br-none" : ""
                } ${bubbleStyle}`}
              >
                {isPredefined && (
                  <div className="text-[10px] font-semibold text-gray-500 mb-1">
                    Predefined
                  </div>
                )}
                <div>{msg.text}</div>
                <div className="text-[10px] text-right text-gray-200 mt-1">
                  {msg.time}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------- Predefined Message Menu ---------- */}
      <div className="flex overflow-x-auto gap-2 mt-3 pb-2 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* Hide scrollbar for Chrome, Safari and Opera */}
        <style>
          {`
            .scrollbar-none::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {predefinedMessages.map((msg, idx) => (
          <button
            key={idx}
            onClick={() => handlePredefined(msg,idx)}
            className="bg-green-200 border border-gray-300 text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-200 whitespace-nowrap"
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
          className="flex-1 p-2   bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded"
        />
        <button
          onClick={handleSend}
          className="bg-green-900 hover:bg-gray-800 text-white px-4 rounded"
        >
          <img className='h-8 w-12 justify-center' src={sendIMG} alt="" />
        </button>
      </div>

      {/* ---------- Rename Modal ---------- */}
      {
        renameOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ">
            <form
              onSubmit={handleRenameSubmit}
              className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 min-w-[300px]"
              style={{ zIndex: 1000 }}
            >
              <h2 className="text-lg font-semibold text-gray-800">Rename User</h2>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
                disabled={renaming}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRenameOpen(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                  disabled={renaming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-700 hover:bg-green-800 text-white"
                  disabled={renaming}
                >
                  {renaming ? "Renaming..." : "Rename"}
                </button>
              </div>
            </form>
          </div>
        )
      }
    </div>
  );
};

export default ChatBox;