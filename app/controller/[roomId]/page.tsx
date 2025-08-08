"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import { RoomState, Timer } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";
import Timeline from "@/components/TimeLineProvider";

// Helper: Deduplicate by `id`
const deduplicateTimers = (timers: Timer[]): Timer[] => {
  const map = new Map<string, Timer>();
  timers.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    }
  });
  return Array.from(map.values());
};

// Color options
const TEXT_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#FFFFFF", label: "White" },
  { value: "#FF0000", label: "Red" },
  { value: "#00FF00", label: "Green" },
  { value: "#0000FF", label: "Blue" },
  { value: "#FFFF00", label: "Yellow" },
];

const BACKGROUND_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#FFC0CB", label: "Pink" },
  { value: "#90EE90", label: "Light Green" },
  { value: "#ADD8E6", label: "Light Blue" },
  { value: "#FFA500", label: "Orange" },
];

const Controller = () => {
  const [connected, setConnected] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [connectedClients, setConnectedClients] = useState<number | null>(null);
  const [flickering, setFlickering] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    color: string;
    backgroundColor: string;
  }>({
    text: "Welcome",
    color: "#000000",
    backgroundColor: "#FFFFFF",
  });
  const [editMessage, setEditMessage] = useState({
    text: "",
    color: "",
    backgroundColor: "",
  });
  const params = useParams();
  const roomId = params.roomId as string;

  useEffect(() => {
    if (!roomId) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join-room", { roomId, role: "admin" });
      console.log(`✅ Joined room ${roomId} as admin`);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log(`❌ Disconnected from room ${roomId}`);
    };

    socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("room-joined", (roomState: RoomState) => {
      setConnectedClients(roomState.clientCount);
      setTimers(deduplicateTimers(roomState.timers));
      setMessage(roomState.message);
      setEditMessage({
        text: roomState.message.text,
        color: roomState.message.color,
        backgroundColor: roomState.message.backgroundColor,
      });
    });

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
      setConnectedClients(roomState.clientCount);
      setTimers(deduplicateTimers(roomState.timers));
      setMessage(roomState.message);
      setFlickering(roomState.flickering ?? false);
      console.log(`Room state updated: ${roomState.roomId}`);
      console.log(`Connected clients: ${roomState.clientCount}`);
    });

    socket.on("timer-added", (newTimer: Timer) => {
      setTimers((prev) => deduplicateTimers([...prev, newTimer]));
    });

    socket.on("timerTick", ({ timerId, remaining }) => {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId ? { ...t, remaining, isRunning: remaining > 0 } : t
        )
      );
    });

    socket.on("timerEnded", ({ timerId }) => {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId ? { ...t, isRunning: false, remaining: 0 } : t
        )
      );
    });

    socket.on("timer-paused", ({ timerId }) => {
      setTimers((prev) =>
        prev.map((t) => (t.id === timerId ? { ...t, isRunning: false } : t))
      );
    });

    socket.on("timer-reset", ({ timerId }) => {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId
            ? { ...t, remaining: t.duration, isRunning: false }
            : t
        )
      );
    });

    socket.on("timer-restarted", ({ timerId }) => {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId
            ? { ...t, isRunning: true, remaining: t.duration }
            : t
        )
      );
    });

    socket.on("timer-deleted", ({ timerId }) => {
      setTimers((prev) => prev.filter((t) => t.id !== timerId));
    });

    socket.on("timerTimeAdjusted", ({ timerId, remaining }) => {
      setTimers((prev) =>
        prev.map((t) => (t.id === timerId ? { ...t, remaining } : t))
      );
    });

    socket.on("messageUpdated", ({ text, color, backgroundColor }) => {
      setMessage({ text, color, backgroundColor });
      console.log(`Message updated: ${text}`);
    });

    socket.on("error", (error: { message: string }) => {
      console.error(`❌ Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("timer-time-updated");
      socket.disconnect();
    };
  }, []);

  // === Button Handlers ===
  const handleAddTimer = () => {
    socket.emit("add-timer", {
      roomId,
      duration: 600,
      name: "New Round Timer",
    });
  };

  const handleStartTimer = (timerId: string) => {
    socket.emit("start-timer", { roomId, timerId });
  };

  const handlePauseTimer = (timerId: string) => {
    socket.emit("pause-timer", { roomId, timerId });
  };

  const handleResetTimer = (timerId: string) => {
    socket.emit("reset-timer", { roomId, timerId });
  };

  const handleRestartTimer = (timerId: string) => {
    socket.emit("restart-timer", { roomId, timerId });
  };

  const handleDeleteTimer = (timerId: string) => {
    socket.emit("delete-timer", { roomId, timerId });
  };

  const handleTimeChange = (timerId: string, newTime: number) => {
    socket.emit("setTimerTime", {
      roomId,
      timerId,
      newTime,
    });
  };

  const handleSetMessage = () => {
    if (!editMessage.text) {
      alert("Please enter message text");
      return;
    }
    socket.emit("setMessage", {
      roomId,
      text: editMessage.text,
      color: editMessage.color || "#000000",
      backgroundColor: editMessage.backgroundColor || "#FFFFFF",
    });
  };

  const handleFlickerToggle = () => {
    setFlickering((prev) => {
      const newFlickeringState = !prev;
      socket.emit("toggleFlicker", { roomId, flickering: newFlickeringState });
      return newFlickeringState;
    });
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200 text-black">
      <div>
        {message && (
          <div
            className="mt-4 p-4 rounded shadow-md"
            style={{
              backgroundColor: message.backgroundColor,
              color: message.color,
            }}
          >
            <p
              className={`text-lg font-bold ${
                flickering ? "animate-flash" : ""
              }`}
            >
              {message.text}
            </p>
            <div className="flex items-center mt-2">
              <label className="mr-2">Flicker:</label>
              <div
                className={`relative w-10 h-5 bg-gray-300 rounded-full overflow-hidden cursor-pointer`}
                onClick={handleFlickerToggle}
              >
                <span
                  className={`absolute transition-transform rounded-full w-1/2 h-full ${
                    flickering ? "right-0 bg-green-600" : "left-0 bg-red-400"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-4 mt-6 w-1/2">
        <div className="w-full">
          <label className="block mb-1">Message Text</label>
          <input
            className="w-full p-2 border rounded"
            onChange={(e) =>
              setEditMessage((prev) => ({ ...prev, text: e.target.value }))
            }
            value={editMessage.text}
            placeholder="Enter message text"
          />
        </div>

        <div className="w-full">
          <label className="block mb-1">Text Color</label>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map((color) => (
              <div
                key={color.value}
                className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                  editMessage.color === color.value
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() =>
                  setEditMessage((prev) => ({
                    ...prev,
                    color: color.value,
                  }))
                }
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="w-full">
          <label className="block mb-1">Background Color</label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_COLORS.map((color) => (
              <div
                key={color.value}
                className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                  editMessage.backgroundColor === color.value
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() =>
                  setEditMessage((prev) => ({
                    ...prev,
                    backgroundColor: color.value,
                  }))
                }
                title={color.label}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSetMessage}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition w-full"
        >
          Update Message
        </button>
      </div>

      <p className="text-2xl mb-2 font-semibold mt-8">🛠️ Controller View</p>
      <p className="text-lg">
        Room ID: <span className="font-mono">{roomId}</span>
      </p>
      <p className="mt-4">
        Status: {connected ? "✅ Connected" : "❌ Disconnected"}
      </p>
      <p className="mt-2 text-gray-800">Share this with Clients:</p>
      <p className="font-mono text-blue-600 underline">
        http://localhost:3000/viewer/{roomId}
      </p>

      <p className="mt-4 text-green-600 font-semibold">
        👥 Connected Clients: {connectedClients ?? "loading..."}
      </p>

      <button
        onClick={handleAddTimer}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        ➕ Add Timer
      </button>

      <div className="mt-6 space-y-4 w-1/2">
        {timers.map((timer) => {
          const formatted = formatTime(timer.remaining ?? timer.duration);
          return (
            <div
              key={timer.id}
              className="bg-white p-4 rounded shadow-md w-full"
            >
              <p className="text-lg font-bold">{timer.name}</p>
              <p>Duration: {formatTime(timer.duration)}</p>
              <p>
                Remaining:{" "}
                <span className="font-mono text-xl">{formatted}</span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={
                    timer.isRunning ? "text-green-600" : "text-gray-600"
                  }
                >
                  {timer.isRunning ? "Running ⏱️" : "Paused ⏸️"}
                </span>
              </p>

              <div className="mt-2 space-x-2">
                <button
                  onClick={() => handleStartTimer(timer.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                >
                  ▶️ Start
                </button>
                <button
                  onClick={() => handlePauseTimer(timer.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={() => handleResetTimer(timer.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                >
                  🔄 Reset
                </button>
                <button
                  onClick={() => handleRestartTimer(timer.id)}
                  className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition"
                >
                  🔁 Restart
                </button>
                <button
                  onClick={() => handleDeleteTimer(timer.id)}
                  className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition"
                >
                  ❌ Delete
                </button>
              </div>
              <div className="relative mt-10">
                <Timeline
                  roomId={roomId}
                  timerId={timer.id}
                  duration={timer.duration}
                  currentTime={timer.remaining ?? timer.duration}
                  onTimeChange={(newTime) =>
                    handleTimeChange(timer.id, newTime)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Controller;
