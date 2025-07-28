"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import { RoomState, Timer } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";

const Controller = () => {
  const [connected, setConnected] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [connectedClients, setConnectedClients] = useState<number | null>(null);
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

    // Sync full room state
    socket.on("room-joined", (roomState: RoomState) => {
      setConnectedClients(roomState.clientCount);
      setTimers(roomState.timers);
    });

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
      setConnectedClients(roomState.clientCount);
      setTimers(roomState.timers);
    });

    socket.on("timer-added", (newTimer: Timer) => {
      setTimers((prev) => [...prev, newTimer]);
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

    socket.on("error", (error: { message: string }) => {
      console.error(`❌ Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [roomId]);

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

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200 text-black">
      <p className="text-2xl mb-2 font-semibold">🛠️ Controller View</p>
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

      <div className="mt-6 space-y-4">
        {timers.map((timer) => {
          const formatted = formatTime(timer.remaining ?? timer.duration);
          return (
            <div
              key={timer.id}
              className="bg-white p-4 rounded shadow-md w-full max-w-sm"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Controller;
