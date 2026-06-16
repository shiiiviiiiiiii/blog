const token = process.env.GITHUB_TOKEN;
const repoFullName = process.env.NEXT_PUBLIC_GISCUS_REPO; // e.g. "shiiiviiiiiiii/blog"

export function isGitHubEnabled(): boolean {
  return !!token && !!repoFullName;
}

async function getFileSha(path: string): Promise<string | null> {
  if (!token || !repoFullName) return null;
  const url = `https://api.github.com/repos/${repoFullName}/contents/${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch (err) {
    console.error("Error fetching file SHA:", err);
  }
  return null;
}

export async function saveFileToGitHub(filePath: string, content: string, message: string) {
  if (!token || !repoFullName) throw new Error("GitHub integration is not configured.");

  const sha = await getFileSha(filePath);
  const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`;

  // Use Buffer for base64 encoding
  const base64Content = Buffer.from(content).toString("base64");

  const body: any = {
    message,
    content: base64Content,
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to save file to GitHub");
  }
}

export async function deleteFileFromGitHub(filePath: string, message: string) {
  if (!token || !repoFullName) throw new Error("GitHub integration is not configured.");

  const sha = await getFileSha(filePath);
  if (!sha) return; // File already deleted or doesn't exist

  const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sha,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to delete file from GitHub");
  }
}
