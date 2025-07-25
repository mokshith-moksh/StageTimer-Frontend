"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { socket } from "@/socket";

const ViwerPage = () => {
  const [connected, setConnected] = useState(false);
  const params = useParams();

  const roomId = params.roomId as string;

  useEffect(() => {
    if (!roomId) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join-room", { roomId, role: "client" });
      console.log(`Joined room ${roomId} as client`);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log(`Disconnected from room ${roomId}`);
    };

    socket.connect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [roomId]);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200">
      <p className="text-black text-2xl mb-2">Viewer page</p>
      <p className="text-black text-lg">Room ID: {roomId}</p>
      <p className="text-black mt-4">
        Status: {connected ? "✅ Connected" : "❌ Disconnected"}
      </p>
      <p>Share this with Clients</p>
      <p>http://localhost:3000/viewer/{roomId}</p>
    </div>
  );
};

export default ViwerPage;
