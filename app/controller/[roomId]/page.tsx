"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { socket } from "@/socket";

const Controller = () => {
  const [connected, setConnected] = useState(false);
  const params = useParams();
  const roomId = params.roomId as string;
  const [connectedClients, setConnectedClients] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join-room", { roomId, role: "admin" });
      console.log(`Joined room ${roomId} as admin`);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log(`Disconnected from room ${roomId}`);
    };

    socket.connect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connected-client-count", ({ count }) => {
      setConnectedClients(count);
    });
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connected-client-count");
      socket.disconnect();
    };
  }, [roomId]);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-200 text-black">
      <p className="text-black text-2xl mb-2">Controller View</p>
      <p className="text-black text-lg">Room ID: {roomId}</p>
      <p className="text-black mt-4">
        Status: {connected ? "✅ Connected" : "❌ Disconnected"}
      </p>
      <p>Share this with Clients</p>
      <p>http://localhost:3000/viewer/{roomId}</p>
      <p className="text-green-500">Total Number of Clients connected</p>
      <p className="mt-2 text-red-600">
        👥 Live Connected Clients: {connectedClients ?? "loading..."}
      </p>
    </div>
  );
};

export default Controller;
