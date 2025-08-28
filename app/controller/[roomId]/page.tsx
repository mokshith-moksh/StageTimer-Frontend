"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import { RoomState, Timer } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";
import Timeline from "@/components/TimeLineProvider";
import { useCallback } from "react";
import FlashButton from "@/components/FlashButton";
import MessageList from "@/components/MessageList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setRoomState,
  addTimer,
  updateTimer,
  removeTimer,
  setFlickering,
} from "@/store/roomSlice";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

const Controller = () => {
  const [connected, setConnected] = useState(false);
  const params = useParams();
  const roomId = params.roomId as string;
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Redux hooks
  const dispatch = useAppDispatch();
  const { timers, clientCount, flickering, connectedClients } = useAppSelector(
    (state) => state.room
  );

  useEffect(() => {
    if (!roomId || !user) return;

    let isMounted = true; // to prevent state updates if component unmounts

    const setupRoom = async () => {
      try {
        const token = await getToken();

        // 1️⃣ Join room via backend
        const response = await fetch(
          `http://localhost:8080/api/rooms/join-room`,
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
        const roomState = data.roomState;
        dispatch(setRoomState(roomState));

        if (!isMounted) return;

        // 2️⃣ Connect to WebSocket after room is ready
        const onConnect = () => {
          setConnected(true);
          socket.emit("join-room-socket", {
            roomId,
            name: user.fullName,
            role: "admin",
          });
          console.log(`✅ Joined room ${roomId} as admin`);
        };

        const onDisconnect = () => {
          setConnected(false);
          console.log(`❌ Disconnected from room ${roomId}`);
        };

        socket.connect();
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // 3️⃣ Timer events
        socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
          dispatch(setRoomState(roomState));
        });
        socket.on("timer-added", (newTimer: Timer[]) => {
          console.log(newTimer);
          dispatch(addTimer(newTimer));
        });

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

        socket.on("timer-paused", ({ timerId }) => {
          dispatch(updateTimer({ id: timerId, updates: { isRunning: false } }));
        });

        socket.on("timer-reset", ({ timerId }) => {
          const timer = timers.find((t) => t.id === timerId);
          if (timer) {
            dispatch(
              updateTimer({
                id: timerId,
                updates: { remaining: timer.duration, isRunning: false },
              })
            );
          }
        });

        socket.on("timer-restarted", ({ timerId }) => {
          const timer = timers.find((t) => t.id === timerId);
          if (timer) {
            dispatch(
              updateTimer({
                id: timerId,
                updates: { isRunning: true, remaining: timer.duration },
              })
            );
          }
        });

        socket.on("timer-deleted", ({ timerId }) => {
          dispatch(removeTimer(timerId));
        });

        socket.on("timerTimeAdjusted", ({ timerId, remaining }) => {
          dispatch(updateTimer({ id: timerId, updates: { remaining } }));
        });

        socket.on("error", (error: { message: string }) => {
          console.error(`❌ Error: ${error.message}`);
          alert(`Error: ${error.message}`);
        });
      } catch (error) {
        console.warn("Error while joining the room:", error);
      }
    };

    setupRoom();

    return () => {
      isMounted = false;
      socket.off("connect");
      socket.off("disconnect");
      socket.off("timer-added");
      socket.off("timerTick");
      socket.off("timerEnded");
      socket.off("timer-paused");
      socket.off("timer-reset");
      socket.off("timer-restarted");
      socket.off("timer-deleted");
      socket.off("timerTimeAdjusted");
      socket.off("error");
      socket.disconnect();
    };
  }, [isLoaded, isSignedIn]);

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

  const handleFlickerToggle = useCallback(() => {
    const newFlickeringState = !flickering;
    dispatch(setFlickering(newFlickeringState));
    socket.emit("toggleFlicker", { roomId, flickering: newFlickeringState });
    setTimeout(() => {
      dispatch(setFlickering(false));
      socket.emit("toggleFlicker", { roomId, flickering: false });
    }, 5000);
  }, [roomId, flickering, dispatch]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200 text-black">
      <FlashButton handleFlickerToggle={handleFlickerToggle} />
      <MessageList roomId={roomId} />

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
        👥 Connected Clients: {clientCount ?? "loading..."}
      </p>

      <button
        onClick={handleAddTimer}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        ➕ Add Timer
      </button>

      <div className="mt-6 space-y-4 w-1/2">
        {timers.map((timer, index) => {
          const formatted = formatTime(timer.remaining ?? timer.duration);
          return (
            <div
              key={timer.id + index}
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

      <div>
        {connectedClients.map((ele) => (
          <div key={ele.socketId}>{ele.name}</div>
        ))}
      </div>
    </div>
  );
};

export default Controller;
