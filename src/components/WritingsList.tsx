import Link from "next/link";
import { formatDate } from "@/lib/date";

export interface WritingItem {
  slug: string;
  title: string;
  date: string;
  readingTime: string;
  category: string;
}

export default function WritingsList({ items }: { items: WritingItem[] }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li
          key={`${item.category}-${item.slug}`}
          className={`group py-5 ${i !== 0 ? "border-t border-[var(--rule)]" : ""}`}
        >
          <Link
            href={`/${item.category}/${item.slug}`}
            className="block cursor-pointer"
          >
            <span className="block text-base sm:text-lg text-[var(--foreground)] group-hover:underline decoration-1 underline-offset-4">
              {item.title}
            </span>
            <span className="block mt-2 text-sm text-[var(--accent)] group-hover:text-[var(--foreground)] transition-colors duration-300">
              {formatDate(item.date)} · {item.readingTime}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
