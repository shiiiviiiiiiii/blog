import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const SESSION_COOKIE_NAME = "admin_session";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === "authenticated";
}

export async function POST() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if there are any changes to commit
    const { stdout: status } = await execAsync("git status --porcelain");

    if (!status.trim()) {
      // No local changes, but let's try a git push anyway in case there are unpushed commits
      try {
        const { stdout: pushOutput } = await execAsync("git push");
        return NextResponse.json({
          success: true,
          message: "Working directory is clean. Git push executed.",
          output: pushOutput,
        });
      } catch (pushErr: any) {
        return NextResponse.json({
          success: true,
          message: "Working directory is clean. Push skipped or not needed.",
        });
      }
    }

    // Stage all changes
    await execAsync("git add .");

    // Commit changes
    await execAsync('git commit -m "Update website content via Admin panel"');

    // Push to remote repository
    const { stdout: pushOutput } = await execAsync("git push");

    return NextResponse.json({
      success: true,
      message: "Successfully committed and pushed changes to GitHub.",
      output: pushOutput,
    });
  } catch (error: any) {
    console.error("Git Sync Error:", error);
    return NextResponse.json(
      {
        error: "Git Sync failed. Ensure you have internet access and SSH/HTTPS push credentials configured.",
        details: error.message || error,
      },
      { status: 500 }
    );
  }
}
