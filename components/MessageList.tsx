"use client";
import React, { useState, useCallback, useEffect } from "react";
import Message from "./Message";
import { DisplayNames } from "@/types/timer";
import { socket } from "@/socket";

const MessageList = ({ roomId }: { roomId: string }) => {
  const [messages, setMessages] = useState<DisplayNames[]>([]);

  const handleDisplayNameChange = useCallback(
    (index: number, updates: Partial<DisplayNames>) => {
      console.log(
        "Updating message at index:",
        index,
        "with updates:",
        updates
      );
      setMessages((prev) => {
        socket.emit("updateNames", { roomId, index, updates });
        return prev.map((msg, i) =>
          i === index ? { ...msg, ...updates } : msg
        );
      });
    },
    []
  );

  const addMessage = () => {
    console.log("Adding new message");
    setMessages((prev) => {
      socket.emit("setNames", {
        roomId,
        names: [
          ...prev,
          {
            text: "",
            styles: {
              color: "#FFFFFF",
              bold: false,
            },
          },
        ],
      });
      return [
        ...prev,
        {
          text: "",
          styles: {
            color: "#FFFFFF",
            bold: false,
          },
        },
      ];
    });
  };

  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="text-gray-500">{index + 1}</div>
          <Message
            index={index}
            roomId={roomId}
            message={msg}
            onUpdate={handleDisplayNameChange}
          />
        </div>
      ))}
      <button
        onClick={addMessage}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Message
      </button>
    </div>
  );
};

export default MessageList;
