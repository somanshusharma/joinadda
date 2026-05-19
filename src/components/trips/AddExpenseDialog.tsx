"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { addTripExpense } from "@/app/actions/expense";
import { cn } from "@/lib/utils";

export type ExpenseMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export function AddExpenseDialog({
  eventId,
  currentUserId,
  members,
}: {
  eventId: string;
  currentUserId: string;
  members: ExpenseMember[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitBetween, setSplitBetween] = useState<Set<string>>(
    () => new Set(members.map((m) => m.id)),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const perPerson = useMemo(() => {
    const a = Number(amount);
    if (!a || splitBetween.size === 0) return 0;
    return Math.floor(a / splitBetween.size);
  }, [amount, splitBetween]);

  function reset() {
    setTitle("");
    setAmount("");
    setPaidBy(currentUserId);
    setSplitBetween(new Set(members.map((m) => m.id)));
    setNotes("");
    setError(null);
  }

  function toggleSplit(id: string) {
    const next = new Set(splitBetween);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSplitBetween(next);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addTripExpense({
        eventId,
        title,
        amountInr: Number(amount),
        paidBy,
        splitBetween: Array.from(splitBetween),
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-primary-500 text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-primary-600 active:scale-95 transition-all"
      >
        <Plus className="size-4" />
        add expense
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-elevated p-6 shadow-2xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-ink">
                Add an expense
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Title */}
            <Field label="What was it for?">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Fuel, dinner, hostel"
                className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              />
            </Field>

            {/* Amount */}
            <Field label="Amount">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-surface-border bg-surface-low pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
                />
              </div>
            </Field>

            {/* Paid by */}
            <Field label="Paid by">
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full h-10 rounded-xl border border-surface-border bg-surface-low px-4 text-sm focus:border-primary-400 outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === currentUserId ? "You" : m.display_name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Split between */}
            <Field
              label={`Split between (${splitBetween.size}) — ₹${perPerson} each`}
            >
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => {
                  const checked = splitBetween.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleSplit(m.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        checked
                          ? "border-primary-500 bg-primary-100"
                          : "border-surface-border bg-surface-low hover:border-primary-200",
                      )}
                    >
                      <Avatar
                        name={m.display_name}
                        src={m.avatar_url}
                        seed={m.id}
                        size="xs"
                      />
                      <span className="truncate flex-1">
                        {m.id === currentUserId
                          ? "You"
                          : m.display_name.split(" ")[0]}
                      </span>
                      {checked ? (
                        <span
                          className="material-symbols-outlined text-primary-700 text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Notes */}
            <Field label="Notes (optional)">
              <textarea
                rows={2}
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 4 people stayed in the same room"
                className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none resize-none"
              />
            </Field>

            {error ? <p className="text-sm text-danger mb-3">{error}</p> : null}

            <div className="flex justify-end gap-2 pt-1">
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
                className="bg-primary-500 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save expense"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
