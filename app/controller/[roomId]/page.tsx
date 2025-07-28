"use client";

import React, { useEffect, useMemo, useState } from "react";
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

    socket.on("room-joined", (roomState: RoomState) => {
      setConnectedClients(roomState.clientCount);
      const timersWithRemaining = roomState.timers.map((t) => ({
        ...t,
        remaining: t.duration,
      }));
      setTimers(timersWithRemaining);
    });

    socket.on("timer-added", (newTimer: Timer) => {
      setTimers((prev) => [
        ...prev,
        { ...newTimer, remaining: newTimer.duration },
      ]);
    });

    socket.on("timerTick", ({ timerId, remaining }) => {
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId ? { ...t, remaining, isRunning: remaining > 0 } : t
        )
      );
    });

    socket.on("timerEnded", ({ timerId }) => {
      console.log(`✅ Timer ${timerId} ended.`);
      setTimers((prev) =>
        prev.map((t) =>
          t.id === timerId ? { ...t, isRunning: false, remaining: 0 } : t
        )
      );
    });

    socket.on("timer-started", ({ timerId }) => {
      console.log(`▶️ Timer ${timerId} started.`);
    });

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
      console.log(`Room state updated: ${JSON.stringify(roomState)}`);
      console.log("Connected clients:", roomState.clientCount);
      setConnectedClients(roomState.clientCount);
    });
    socket.on("error", (error: { message: string }) => {
      console.error(`❌ Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-joined");
      socket.off("timer-added");
      socket.off("timerTick");
      socket.off("timerEnded");
      socket.off("timer-started");
      socket.off("roomState");
      socket.disconnect();
    };
  }, [roomId]);

  const handleAddTimer = () => {
    if (!roomId) return;
    socket.emit("add-timer", {
      roomId,
      duration: 600,
      name: "New Round Timer",
    });
  };

  const handleStartTimer = (timerId: string) => {
    socket.emit("start-timer", { roomId, timerId });
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
                  {timer.isRunning ? "Running ⏱️" : "Stopped ⏹️"}
                </span>
              </p>
              <button
                onClick={() => handleStartTimer(timer.id)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                ▶️ Start Timer
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Controller;
