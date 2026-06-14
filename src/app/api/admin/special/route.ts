import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

const SESSION_COOKIE_NAME = "admin_session";
const contentDirectory = path.join(process.cwd(), "content");

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === "authenticated";
}

export async function GET(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");

  if (!page || (page !== "about" && page !== "now" && page !== "notes")) {
    return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
  }

  let filePath = "";
  if (page === "about") {
    filePath = path.join(contentDirectory, "about.md");
  } else if (page === "now") {
    filePath = path.join(contentDirectory, "now.md");
  } else if (page === "notes") {
    filePath = path.join(contentDirectory, "notes", "notebook.md");
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: "" });
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { page, content } = await request.json();

    if (!page || (page !== "about" && page !== "now" && page !== "notes")) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    if (content === undefined) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    let filePath = "";
    if (page === "about") {
      filePath = path.join(contentDirectory, "about.md");
    } else if (page === "now") {
      filePath = path.join(contentDirectory, "now.md");
    } else if (page === "notes") {
      filePath = path.join(contentDirectory, "notes", "notebook.md");
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf8");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error saving special page:", e);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
