import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function NotificationListener() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("newU2BMessage", (msg) => {
      // Add new message to notifications
      setNotifications((prev) => [msg, ...prev]);

      // Remove this message after 3 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n !== msg)
        );
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="fixed top-5 right-5 w-80 max-h-96 overflow-y-auto space-y-2 p-2  shadow-lg rounded-md">
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm text-center"></p>
      ) : (
        notifications.map((msg, index) => (
          <div
            key={index}
            className="p-2 bg-green-100 border border-green-300 rounded shadow-sm"
          >
            <p className="text-gray-700 text-sm">📩 From User {msg.uid}: {msg.message}</p>
          </div>
        ))
      )}
    </div>
  );
}
