"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import { RoomState } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";
import Timeline from "@/components/TimeLineProvider";
import FlashButton from "@/components/FlashButton";
import MessageList from "@/components/MessageList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setRoomState, updateTimer, resetRoom } from "@/store/roomSlice";
import { useUser, useAuth } from "@clerk/nextjs";

const Controller = () => {
  const [connected, setConnected] = useState(false);
  const params = useParams();
  const roomId = params.roomId as string;

  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const dispatch = useAppDispatch();
  const {
    timers,
    clientCount,
    flickering,
    connectedClients,
    roomName,
    loading,
  } = useAppSelector((state) => state.room);

  useEffect(() => {
    if (!roomId || !user) return;

    let isMounted = true;

    const setupRoom = async () => {
      try {
        dispatch(setRoomState({ loading: true }));
        const token = await getToken();

        const response = await fetch(
          "http://localhost:8080/api/rooms/join-room",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomId, adminId: user.id }),
          }
        );

        if (!response.ok) throw new Error("Failed to join room");

        const data = await response.json();
        if (!isMounted) return;

        dispatch(setRoomState({ ...data.roomState, loading: false }));

        // === WebSocket ===
        const onConnect = () => {
          setConnected(true);
          socket.emit("join-room-socket", {
            roomId,
            name: user.fullName,
            role: "admin",
          });
        };

        const onDisconnect = () => {
          setConnected(false);
        };

        socket.connect();
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // 🔹 full sync
        socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
          dispatch(setRoomState(roomState));
        });

        // 🔹 incremental updates for real-time
        socket.on("timerTick", ({ timerId, remaining }) => {
          dispatch(
            updateTimer({
              id: timerId,
              updates: { remaining, isRunning: remaining > 0 },
            })
          );
        });

        socket.on("timerEnded", ({ timerId }) => {
          dispatch(
            updateTimer({
              id: timerId,
              updates: { isRunning: false, remaining: 0 },
            })
          );
        });

        socket.on("error", (error: { message: string }) => {
          alert(`Error: ${error.message}`);
        });
      } catch (error) {
        dispatch(setRoomState({ loading: false }));
        console.warn("Error while joining the room:", error);
      }
    };

    setupRoom();

    return () => {
      isMounted = false;
      socket.removeAllListeners();
      socket.disconnect();
      dispatch(resetRoom());
    };
  }, [isLoaded, isSignedIn]);

  const handleFlickerToggle = useCallback(() => {
    const newFlickeringState = !flickering;
    dispatch(setRoomState({ flickering: newFlickeringState }));
    socket.emit("toggleFlicker", { roomId, flickering: newFlickeringState });

    setTimeout(() => {
      dispatch(setRoomState({ flickering: false }));
      socket.emit("toggleFlicker", { roomId, flickering: false });
    }, 5000);
  }, [roomId, flickering, dispatch]);

  // === Timer actions (server updates full state) ===
  const handleAddTimer = () =>
    socket.emit("add-timer", {
      roomId,
      duration: 600,
      name: "New Round Timer",
    });
  const handleStartTimer = (id: string) =>
    socket.emit("start-timer", { roomId, timerId: id });
  const handlePauseTimer = (id: string) =>
    socket.emit("pause-timer", { roomId, timerId: id });
  const handleResetTimer = (id: string) =>
    socket.emit("reset-timer", { roomId, timerId: id });
  const handleRestartTimer = (id: string) =>
    socket.emit("restart-timer", { roomId, timerId: id });
  const handleDeleteTimer = (id: string) =>
    socket.emit("delete-timer", { roomId, timerId: id });
  const handleTimeChange = (id: string, newTime: number) =>
    socket.emit("setTimerTime", { roomId, timerId: id, newTime });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200 text-black">
      <FlashButton handleFlickerToggle={handleFlickerToggle} />
      <MessageList roomId={roomId} />

      <p className="text-2xl mb-2 font-semibold mt-8">🛠️ Controller View</p>
      <p className="text-lg">
        Room: <span className="font-mono">{roomName || roomId}</span>
      </p>
      <p className="mt-4">
        Status: {connected ? "✅ Connected" : "❌ Disconnected"}
      </p>
      <p className="mt-2 text-gray-800">Share this with Clients:</p>
      <p className="font-mono text-blue-600 underline">
        http://localhost:3000/viewer/{roomId}
      </p>

      <p className="mt-4 text-green-600 font-semibold">
        👥 Connected Clients: {loading ? "loading..." : clientCount ?? "0"}
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
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  ▶️ Start
                </button>
                <button
                  onClick={() => handlePauseTimer(timer.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={() => handleResetTimer(timer.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  🔄 Reset
                </button>
                <button
                  onClick={() => handleRestartTimer(timer.id)}
                  className="bg-purple-500 text-white px-3 py-1 rounded"
                >
                  🔁 Restart
                </button>
                <button
                  onClick={() => handleDeleteTimer(timer.id)}
                  className="bg-gray-700 text-white px-3 py-1 rounded"
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

      <div className="mt-6">
        {connectedClients.map((ele, index) => (
          <div key={index}>{ele.name}</div>
        ))}
      </div>
    </div>
  );
};

export default Controller;
