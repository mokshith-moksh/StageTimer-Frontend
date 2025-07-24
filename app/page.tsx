"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const { userId } = useAuth();
  const router = useRouter();

  const handleDashboardClick = () => {
    if (userId) {
      router.push(`/dashboard/${userId}`);
    } else {
      alert("You must be logged in to access the dashboard.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl text-black mb-4">Landing Page</h1>
      {!userId ? (
        <div>Login To see</div>
      ) : (
        <button
          onClick={handleDashboardClick}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Dashboard
        </button>
      )}
    </div>
  );
}
