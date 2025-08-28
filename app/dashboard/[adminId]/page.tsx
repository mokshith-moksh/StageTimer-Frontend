"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Room {
  _id: string;
  roomId: string;
  roomName: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const createRoomHandler = async () => {
    const token = await getToken();
    if (!user) {
      console.warn("User not logged in — cannot create room");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:8080/api/room/create-room",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminId: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (!data.roomId) {
        throw new Error("Invalid response: missing roomId");
      }

      console.log("Room created with ID:", data.roomId);
      router.push(`/controller/${data.roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!user) {
        console.warn("User not logged in — cannot create room");
        return;
      }
      try {
        setIsLoading(true);
        const token = await getToken();
        const response = await fetch(
          `http://localhost:8080/api/room/getRooms?adminId=${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }
        const data = await response.json();
        setRooms(data.rooms);
      } catch (error) {
        console.warn("Error while fetching rooms", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoomData();
  }, [user, getToken]);

  if (isLoading) {
    return <div>Loading ...........</div>;
  }
  const handleRoomClick = (roomId: string) => {
    router.push(`/controller/${roomId}`);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      <h1 className="text-4xl text-black mb-4">Dashboard</h1>
      <p className="text-lg text-gray-700 mb-2">Welcome to your dashboard!</p>
      <p className="text-lg text-gray-700 mb-4">
        Here you can manage your account and settings.
      </p>
      <p className="text-black border border-black p-4 rounded-lg">
        UserId: {user?.id}
      </p>
      <div>
        {rooms.map((room) => {
          return (
            <div
              className="bg-blue-400 text-black font-bold w-60 h-24 mt-10 p-4 rounded-2xl"
              key={room._id}
              onClick={() => handleRoomClick(room.roomId)}
            >
              <div>RoomId : {room.roomId} </div>
              <div>RoomName : {room.roomName}</div>
            </div>
          );
        })}
      </div>
      <button
        onClick={createRoomHandler}
        className="flex p-4 bg-green-600 rounded-lg mt-7"
      >
        Create Room
      </button>
    </div>
  );
}
