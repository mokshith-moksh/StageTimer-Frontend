"use client";
import { socket } from "@/socket";
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAppDispatch } from "@/store/hooks";
import { setRoomState, updateMsg } from "@/store/roomSlice";
import { RoomState } from "@/types/timer";
import { useAppSelector } from "@/store/hooks";
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
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: string;
    text: string;
    styles: { color: string; bold: boolean };
  } | null>(null);
  const dispatch = useAppDispatch();
  const { messages, activeMessage } = useAppSelector((state) => state.room);

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

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
      console.log(roomState);
      dispatch(setRoomState(roomState));
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

    dispatch(updateMsg({ id, msg }));

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

      {messages.map((msg) => {
        const isActive = activeMessage === msg.id;

        return (
          <div
            key={msg.id}
            className={`p-4 rounded-lg shadow-sm border transition ${
              isActive
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <textarea
              value={msg.text}
              onChange={(e) => handleMsgChange(msg.id, e, msg.styles)}
              className="w-full h-24 p-3 border rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleShow(msg.id)}
                className={`px-4 py-2 rounded-md font-medium text-white transition ${
                  isActive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isActive ? "Active" : "Show"}
              </button>

              <button
                onClick={() => handleDelete(msg.id)}
                className="px-4 py-2 rounded-md font-medium text-white bg-gray-500 hover:bg-gray-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}

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
