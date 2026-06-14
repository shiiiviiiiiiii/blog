"use client";

import { useEffect, useState } from "react";

const quotes = [
  "Pay attention.",
  "People are stories.",
  "Write before you forget.",
  "Everything interesting starts with curiosity.",
  "The ordinary is never ordinary.",
];

export default function Hero() {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <section className="pt-4 pb-16">
      <h1 className="text-2xl sm:text-3xl font-medium tracking-wide">
        Shivam Kumar{" "}
        <span className="cursor-blink" aria-hidden="true">
          |
        </span>
      </h1>

      <p className="mt-8 text-lg leading-relaxed">
        A place for stories, observations, questions, and unfinished
        thoughts.
      </p>

      <p className="mt-4 text-[var(--accent)] leading-relaxed">
        I write about people, ambition, theatre, technology, college life,
        creativity, and the small moments that often go unnoticed.
      </p>

      <p className="mt-10 text-sm text-[var(--accent)] italic">{quote}</p>
    </section>
  );
}
