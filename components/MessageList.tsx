"use client";
import { socket } from "@/socket";
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export type Messages = {
  id: string;
  text: string;
  styles: {
    color: string;
    bold: boolean;
  };
  active?: boolean;
};

const MessageList = ({ roomId }: { roomId: string }) => {
  const { userId } = useAuth();
  const [msgList, setMsgList] = useState<Messages[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: string;
    text: string;
    styles: { color: string; bold: boolean };
  } | null>(null);

  // Debounce effect for updating message
  useEffect(() => {
    if (!pendingUpdate) return;

    const debounce = setTimeout(() => {
      socket.emit("updateMsg", {
        roomId,
        messageId: pendingUpdate.id,
        updates: pendingUpdate,
      });
    }, 500); // shorter debounce for smoother typing

    return () => clearTimeout(debounce);
  }, [pendingUpdate, roomId]);

  // Socket listeners
  useEffect(() => {
    socket.emit("getMsg", { roomId });

    socket.on("messageUpdated", ({ messages }: { messages: Messages[] }) => {
      setMsgList(messages);
    });

    socket.on("activeMessageUpdated", ({ activeMessageId, messages }) => {
      const updatedMsg = messages.map((msg: Messages) => ({
        ...msg,
        active: msg.id === activeMessageId,
      }));
      setMsgList(updatedMsg);
    });

    return () => {
      socket.off("messageUpdated");
      socket.off("activeMessageUpdated");
    };
  }, [roomId]);

  // Handlers
  const handleMsgChange = (
    id: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
    styles: { color: string; bold: boolean }
  ) => {
    const msg = e.target.value;

    // Optimistic update
    setMsgList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: msg } : m))
    );

    setPendingUpdate({ id, text: msg, styles });
  };

  const handleAddMsg = () => {
    socket.emit("createMsg", {
      roomId,
      adminId: userId,
    });
  };

  const handleShow = (id: string) => {
    socket.emit("toggleActive", { roomId, adminId: userId, messageId: id });
  };

  const handleDelete = (id: string) => {
    socket.emit("deleteMsg", { roomId, adminId: userId, messageId: id });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Messages</h2>

      {msgList.map((messages) => (
        <div
          key={messages.id}
          className={`p-4 rounded-lg shadow-sm border transition ${
            messages.active
              ? "border-green-500 bg-green-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <textarea
            value={messages.text}
            onChange={(e) => handleMsgChange(messages.id, e, messages.styles)}
            className="w-full h-24 p-3 border rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleShow(messages.id)}
              className={`px-4 py-2 rounded-md font-medium text-white transition ${
                messages.active
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {messages.active ? "Active" : "Show"}
            </button>

            <button
              onClick={() => handleDelete(messages.id)}
              className="px-4 py-2 rounded-md font-medium text-white bg-gray-500 hover:bg-gray-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddMsg}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
      >
        ➕ Add Message
      </button>
    </div>
  );
};

export default MessageList;
