"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createHangoutPoll } from "@/app/actions/hangoutPoll";

const QUICK_TEMPLATES: Array<{ q: string; opts: string[] }> = [
  { q: "Are you actually coming?", opts: ["Yes ✅", "Maybe", "Can't make it"] },
  { q: "What time works?", opts: ["Earlier", "On time", "Later"] },
  { q: "Veg or non-veg?", opts: ["Veg", "Non-veg", "Both work"] },
  { q: "Split the bill how?", opts: ["Equally", "Pay your own", "Host pays"] },
];

export function CreateHangoutPoll({ hangoutId }: { hangoutId: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setQuestion("");
    setOptions(["", ""]);
    setError(null);
  }

  function use(template: (typeof QUICK_TEMPLATES)[number]) {
    setQuestion(template.q);
    setOptions([...template.opts]);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createHangoutPoll({
        hangoutId,
        question,
        options,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-surface-border bg-transparent p-3 text-sm font-semibold text-ink-secondary hover:border-primary-300 hover:text-primary-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="size-4" /> ask the crew something
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 sun-kissed-shadow space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">ask the crew</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          aria-label="Close"
          className="grid size-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Question */}
      <div>
        <input
          autoFocus
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={140}
          placeholder="What do you want to know?"
          className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.q}
              type="button"
              onClick={() => use(t)}
              className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold text-ink-secondary hover:bg-primary-100 hover:text-primary-700"
            >
              {t.q}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              maxLength={60}
              placeholder={`Option ${i + 1}`}
              className="flex-1 rounded-xl border border-surface-border bg-surface-low px-4 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
            />
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => setOptions((arr) => arr.filter((_, j) => j !== i))}
                aria-label="Remove option"
                className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 6 ? (
          <button
            type="button"
            onClick={() => setOptions((arr) => [...arr, ""])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Plus className="size-3.5" /> add option
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-sm font-semibold text-ink-muted px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-primary-500 text-white font-bold text-sm px-5 py-2 rounded-full hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post poll"}
        </button>
      </div>
    </div>
  );
}
