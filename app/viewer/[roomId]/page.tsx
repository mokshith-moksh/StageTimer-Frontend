"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/socket";
import { RoomState, Timer } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";

const ViewerPage = () => {
  const [connected, setConnected] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  useEffect(() => {
    if (!roomId) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join-room", { roomId, role: "client" });
      console.log(`✅ Joined room ${roomId} as client`);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log(`❌ Disconnected from room ${roomId}`);
    };

    socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("room-joined", (roomState: RoomState) => {
      setTimers(roomState.timers);
    });

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
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
            ? { ...t, remaining: t.duration, isRunning: true }
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
      socket.disconnect();
      router.push("/");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 text-black">
      <p className="text-2xl mb-2 font-semibold">👁️ Viewer Page</p>
      <p className="text-lg">
        Room ID: <span className="font-mono">{roomId}</span>
      </p>
      <p className="mt-4">
        Status: {connected ? "✅ Connected" : "❌ Disconnected"}
      </p>

      <div className="mt-6 space-y-4">
        {timers.length === 0 && <p>No timers yet.</p>}
        {timers.map((timer) => (
          <div
            key={timer.id}
            className="bg-white p-4 rounded shadow-md w-full max-w-sm"
          >
            <p className="text-lg font-bold">{timer.name}</p>
            <p>Duration: {formatTime(timer.duration)}</p>
            <p>
              Remaining:{" "}
              <span className="font-mono text-xl">
                {formatTime(timer.remaining ?? timer.duration)}
              </span>
            </p>
            <p>
              Status:{" "}
              <span
                className={
                  timer.isRunning
                    ? "text-green-600"
                    : timer.remaining === 0
                    ? "text-red-600"
                    : "text-gray-600"
                }
              >
                {timer.isRunning
                  ? "Running ⏱️"
                  : timer.remaining === 0
                  ? "Ended ❌"
                  : "Paused ⏸️"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewerPage;
