import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "admin_session";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  const passwordConfigured = !!process.env.ADMIN_PASSWORD;

  if (session?.value === "authenticated") {
    return NextResponse.json({ authenticated: true, passwordConfigured });
  }

  return NextResponse.json({ authenticated: false, passwordConfigured });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const envPassword = process.env.ADMIN_PASSWORD;

    // In development mode, allow fallback password "admin" if env variable is not set
    const isDev = process.env.NODE_ENV === "development";
    const allowedPassword = envPassword || (isDev ? "admin" : null);

    if (!allowedPassword) {
      return NextResponse.json(
        { error: "Admin password is not configured on the server." },
        { status: 500 }
      );
    }

    if (password === allowedPassword) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ success: true });
}
