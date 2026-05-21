"use client";

import { useState, useTransition } from "react";
import { upsertReview, type ReviewSubjectType } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

export function ReviewForm({
  subjectType,
  subjectId,
  contextType,
  contextId,
  initialRating,
  initialText,
  subjectLabel,
}: {
  subjectType: ReviewSubjectType;
  subjectId: string;
  contextType?: "hangout" | "trip";
  contextId?: string;
  initialRating?: number | null;
  initialText?: string | null;
  subjectLabel?: string;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(initialText ?? "");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (rating < 1) {
      setError("Pick a rating first");
      return;
    }
    startTransition(async () => {
      const res = await upsertReview({
        subject_type: subjectType,
        subject_id: subjectId,
        rating,
        review_text: text,
        context_type: contextType,
        context_id: contextId,
      });
      if (!res.ok) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="bg-success/10 text-success rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
        <span className="material-symbols-outlined">check_circle</span>
        Thanks for your review!
        <button
          type="button"
          onClick={() => setDone(false)}
          className="ml-auto text-xs underline opacity-80 hover:opacity-100"
        >
          edit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-5">
      <p className="text-sm font-semibold text-ink mb-2">
        {subjectLabel ? `Rate ${subjectLabel}` : "Leave a rating"}
      </p>
      <div
        className="flex items-center gap-1 mb-3"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="p-1"
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[28px] transition-colors",
                  active ? "text-mango-500" : "text-ink-light",
                )}
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
          );
        })}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Optional — what stood out? (visible to everyone)"
        className="w-full bg-surface-low border border-surface-border rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none resize-none"
      />
      {error ? (
        <p className="mt-2 text-xs text-danger">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition"
      >
        {pending ? "Saving…" : initialRating ? "Update review" : "Post review"}
      </button>
    </div>
  );
}
