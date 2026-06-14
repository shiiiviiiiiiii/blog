interface NoteEntry {
  date: string;
  body: string;
}

export function parseNotebook(content: string): NoteEntry[] {
  const blocks = content.split(/^---$/m).map((b) => b.trim()).filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n");
    const headingLine = lines[0].trim();
    const dateMatch = headingLine.match(/^###\s*(.+)$/);
    const date = dateMatch ? dateMatch[1].trim() : "";
    const body = lines.slice(1).join("\n").trim();
    return { date, body };
  });
}

export default function NotesList({ entries }: { entries: NoteEntry[] }) {
  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`py-6 ${i !== 0 ? "border-t border-[var(--rule)]" : ""}`}
        >
          {entry.date && (
            <p className="text-sm text-[var(--accent)] mb-3">{entry.date}</p>
          )}
          {entry.body.split(/\n\n+/).map((para, j) => (
            <p key={j} className="leading-relaxed mb-3 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
