"use client";

import { useEffect, useRef } from "react";

export default function Comments() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.children.length > 0) return;

    const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || "";
    const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "";
    const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

    // If no repo config is set up, do not load Giscus script to avoid loading error in console.
    if (!repo || !repoId) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");

    // Sync theme with html[data-theme]
    const theme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "noborder_dark"
        : "light";
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-lang", "en");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current.appendChild(script);

    // Watch for theme changes to dynamically update Giscus theme
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "noborder_dark"
          : "light";
      const iframe = ref.current?.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame"
      );
      if (iframe) {
        iframe.contentWindow?.postMessage(
          { giscus: { setConfig: { theme: currentTheme } } },
          "https://giscus.app"
        );
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const hasConfig =
    !!process.env.NEXT_PUBLIC_GISCUS_REPO &&
    !!process.env.NEXT_PUBLIC_GISCUS_REPO_ID;

  return (
    <div className="mt-16 border-t border-[var(--rule)] pt-8">
      <h3 className="text-sm uppercase tracking-wide text-[var(--accent)] mb-6">
        Comments
      </h3>
      {!hasConfig ? (
        <p className="text-xs text-[var(--accent)] italic">
          Comments are powered by Giscus. To enable comments on your site,
          please set your GitHub repository and category IDs in your{" "}
          <code>.env.local</code> file (see:{" "}
          <a
            href="https://giscus.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            giscus.app
          </a>{" "}
          for keys).
        </p>
      ) : (
        <div ref={ref} id="giscus-comments" className="giscus" />
      )}
    </div>
  );
}
