import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, getToken } = await auth();
  console.log("New user route called. User ID from Clerk auth(): ", userId);
  const token = await getToken();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return new NextResponse("User not exist", { status: 404 });
  }

  try {
    await fetch(`http://localhost:8080/api/users/new-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      }),
    });
  } catch (err) {
    console.error("Failed to sync user to backend:", err);
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: `http://localhost:3000/dashboard/${user.id}`,
    },
  });
}
