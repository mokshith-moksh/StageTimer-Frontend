"use client";
import React, { useState, useEffect } from "react";
import { socket } from "@/socket";
import { DisplayNames } from "@/types/timer";

interface MessageProps {
  index: number;
  roomId: string;
  message: DisplayNames;
  onUpdate: (index: number, updates: Partial<DisplayNames>) => void;
}

const Message = ({ index, roomId, message, onUpdate }: MessageProps) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onUpdate(index, { text: newText });
  };

  const handleColorChange = (color: string) => {
    onUpdate(index, {
      styles: {
        ...message.styles,
        color,
      },
    });
  };

  const handleBoldToggle = () => {
    onUpdate(index, {
      styles: {
        ...message.styles,
        bold: !message.styles.bold,
      },
    });
  };

  const handleCaseToggle = () => {
    const newText =
      message.text.toUpperCase() === message.text
        ? message.text.toLowerCase()
        : message.text.toUpperCase();
    onUpdate(index, { text: newText });
  };

  const handleShowButtonClick = () => {
    console.log("inside handleShowButtonClick");
    if (!roomId) return;
    if (!message.text.trim()) {
      console.warn("Display name cannot be empty");
      return;
    }
    console.log("calling setDisplayName with:", {
      roomId,
      text: message.text,
      color: message.styles.color,
      bold: message.styles.bold,
    });
    socket.emit("setDisplayName", {
      roomId,
      text: message.text,
      color: message.styles.color,
      bold: message.styles.bold,
    });
    console.log("Display name set successfully");
  };

  return (
    <div className="flex-1 space-y-2">
      <textarea
        value={message.text}
        onChange={handleTextChange}
        className={`w-full p-2 border rounded ${
          message.styles.bold ? "font-bold" : "font-normal"
        }`}
        style={{ color: message.styles.color }}
        placeholder="Type your message..."
      />

      <div className="flex items-center gap-2">
        {/* Color buttons */}
        <button
          onClick={() => handleColorChange("#FF0000")}
          className={`px-2 py-1 rounded ${
            message.styles.color === "#FF0000" ? "bg-gray-200" : ""
          }`}
        >
          <span className="text-red-500">A</span>
        </button>
        <button
          onClick={() => handleColorChange("#00FF00")}
          className={`px-2 py-1 rounded ${
            message.styles.color === "#00FF00" ? "bg-gray-200" : ""
          }`}
        >
          <span className="text-green-500">A</span>
        </button>
        <button
          onClick={() => handleColorChange("#0000FF")}
          className={`px-2 py-1 rounded ${
            message.styles.color === "#0000FF" ? "bg-gray-200" : ""
          }`}
        >
          <span className="text-blue-500">A</span>
        </button>
        <button
          onClick={() => handleColorChange("#FFFF00")}
          className={`px-2 py-1 rounded ${
            message.styles.color === "#FFFF00" ? "bg-gray-200" : ""
          }`}
        >
          <span className="text-yellow-500">B</span>
        </button>

        {/* Bold toggle */}
        <button
          onClick={handleBoldToggle}
          className={`px-2 py-1 rounded ${
            message.styles.bold ? "bg-gray-200" : ""
          }`}
        >
          <span className="font-bold">B</span>
        </button>

        {/* Case toggle */}
        <button
          onClick={handleCaseToggle}
          className="px-2 py-1 rounded hover:bg-gray-200"
        >
          <span>aA</span>
        </button>

        <button
          onClick={() => handleShowButtonClick()}
          className="ml-auto text-gray-500 hover:text-gray-700"
        >
          ↑ Show
        </button>
      </div>
    </div>
  );
};

export default Message;
