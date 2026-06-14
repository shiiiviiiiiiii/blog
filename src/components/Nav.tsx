"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/essays", label: "Essays" },
  { href: "/notes", label: "Notes" },
  { href: "/campus-uncovered", label: "Campus Uncovered" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-full">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 pt-10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <Link href="/" className="text-sm tracking-wide underline-link text-[var(--foreground)] font-medium">
            Shivam Kumar
          </Link>
          <ThemeToggle />
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--foreground)] font-medium underline decoration-1 underline-offset-4"
                    : "text-[var(--accent)] hover:text-[var(--foreground)] underline-link"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
