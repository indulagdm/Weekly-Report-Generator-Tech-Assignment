import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpIcon, SparklesIcon, XIcon } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { currentWeekStart } from "../../utils/date";
import { answerQuestion, suggestedQuestions } from "../../utils/assistant";
import { cn } from "../../utils/cn";
const INTRO = {
  id: 0,
  role: "assistant",
  text: "I can summarize the team week, chase missing reports, surface recurring blockers, or dig into one person or project. What do you need?",
};
export function AiAssistant() {
  const { reports, users, projects } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INTRO]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, open]);
  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const reply = answerQuestion(trimmed, {
        reports,
        users,
        projects,
        weekStartDate: currentWeekStart(),
      });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: reply },
      ]);
      setThinking(false);
    }, 450);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open team assistant"}
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-white shadow-pop transition-[background-color,transform] duration-150 ease-out hover:bg-ink-soft active:translate-y-px"
      >
        {open ? (
          <XIcon className="h-4 w-4" />
        ) : (
          <SparklesIcon className="h-4 w-4" />
        )}
        {open ? "Close" : "Ask the assistant"}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            aria-label="Team assistant"
            className="fixed bottom-20 right-5 z-40 flex h-[520px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Team assistant</p>
                <p className="mt-0.5 text-2xs text-ink-faint">
                  Local preview — answers computed from stored reports until an
                  LLM key is set.
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scroll-thin">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-ink text-white"
                      : "bg-subtle text-ink-soft ring-1 ring-inset ring-line",
                  )}
                >
                  {message.text}
                </div>
              ))}
              {thinking ? (
                <div className="flex w-16 items-center justify-center gap-1 rounded-2xl bg-subtle py-3 ring-1 ring-inset ring-line">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-faint"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            {messages.length <= 1 ? (
              <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-line-strong px-2.5 py-1 text-2xs text-ink-muted transition-colors duration-150 ease-out hover:border-ink hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className="flex items-center gap-2 border-t border-line px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Message the assistant"
                placeholder="Ask about the team's week…"
                className="h-10 flex-1 rounded-lg border border-line-strong px-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || thinking}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white transition-[background-color,opacity] duration-150 ease-out hover:bg-ink-soft disabled:opacity-40"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </form>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
