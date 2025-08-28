"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/socket";
import { DisplayNames, RoomState, Timer } from "@/types/timer";
import { formatTime } from "@/utils/formatTime";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const ViewerPage = () => {
  const [connected, setConnected] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const [showMessage, setShowMessage] = useState<DisplayNames>({
    text: "",
    styles: {
      color: "#000000",
      bold: false,
    },
  });
  const [flickering, setFlickering] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!roomId) return;
    const deduplicateTimers = (timers: Timer[]): Timer[] => {
      const map = new Map<string, Timer>();
      timers.forEach((t) => {
        if (!map.has(t.id)) {
          map.set(t.id, t);
        }
      });
      return Array.from(map.values());
    };

    const onConnect = () => {
      setConnected(true);
      socket.emit("join-room-socket", {
        roomId,
        name: user?.fullName,
        role: "client",
      });
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
      setTimers(deduplicateTimers(roomState.timers));
    });

    socket.on("roomState", ({ roomState }: { roomState: RoomState }) => {
      setTimers(deduplicateTimers(roomState.timers));
      setShowMessage(roomState.displayName);
      setFlickering(roomState.flickering ?? false);
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

    socket.on("timerTimeAdjusted", ({ timerId, remaining }) => {
      setTimers((prev) =>
        prev.map((t) => (t.id === timerId ? { ...t, remaining } : t))
      );
    });

    socket.on("displayNameUpdated", (data) => {
      setShowMessage(data);
    });
    socket.on("flickeringToggled", (flickering: boolean) => {
      setFlickering(flickering);
    });

    socket.on("error", (error: { message: string }) => {
      console.error(`❌ Error: ${error.message}`);
      socket.disconnect();
      router.push("/");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [isLoaded, isSignedIn]);

  const runningTimers = timers.filter((timer) => timer.isRunning);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-black p-4 md:p-8">
      {/* Header Section */}
      <header className="text-center mb-6">
        <motion.h1
          className="text-2xl md:text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          👁️ Live Timer Viewer
        </motion.h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-4">
          <p className="text-sm md:text-base">
            Room:{" "}
            <span className="font-mono bg-slate-200 px-2 py-1 rounded">
              {roomId}
            </span>
          </p>
          <div className="flex items-center gap-2 justify-center">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </header>
      {showMessage.text && (
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p
            className={`text-lg font-semibold ${
              showMessage.styles.bold ? "font-bold" : ""
            } ${flickering ? "animate-flash" : ""}`}
            style={{ color: showMessage.styles.color }}
          >
            {showMessage.text}
          </p>
        </motion.div>
      )}
      {/* Timers Section */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {runningTimers.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg text-gray-600">
              No active timers currently running
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {runningTimers.map((timer) => (
                <motion.div
                  key={timer.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold truncate">
                        {timer.name}
                      </h3>
                      <motion.span
                        className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800"
                        animate={{
                          scale: [1, 1.05, 1],
                          backgroundColor: ["#dcfce7", "#bbf7d0", "#dcfce7"],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                        }}
                      >
                        LIVE
                      </motion.span>
                    </div>

                    <motion.div
                      className="text-4xl font-mono font-bold text-center my-4"
                      key={timer.remaining}
                      initial={{ scale: 1.1, color: "#3b82f6" }}
                      animate={{ scale: 1, color: "#1e40af" }}
                      transition={{ duration: 0.5 }}
                    >
                      {formatTime(timer.remaining ?? timer.duration)}
                    </motion.div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        className="text-4xl font-mono font-bold text-center my-4"
                        key={timer.remaining}
                        initial={{ scale: 1.1, color: "#3b82f6" }}
                        animate={{ scale: 1, color: "#1e40af" }}
                        transition={{ duration: 0.5 }}
                      >
                        {formatTime(timer.remaining ?? timer.duration)}
                      </motion.div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                          className="bg-blue-600 h-2.5 rounded-full"
                          initial={{ width: "100%" }}
                          animate={{
                            width: `${
                              ((timer.remaining ?? timer.duration) /
                                timer.duration) *
                              100
                            }%`,
                            backgroundColor: ["#3b82f6", "#1d4ed8", "#3b82f6"],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <p>Duration: {formatTime(timer.duration)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-8 mb-4">
        <p>Connected to room: {roomId}</p>
      </footer>
    </div>
  );
};

export default ViewerPage;
