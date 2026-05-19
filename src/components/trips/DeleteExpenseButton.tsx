"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { deleteTripExpense } from "@/app/actions/expense";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) return null;

  function go() {
    if (!window.confirm("Delete this expense?")) return;
    startTransition(async () => {
      const res = await deleteTripExpense(expenseId);
      if (res.ok) setRemoved(true);
    });
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      aria-label="Delete"
      className="grid size-6 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-danger"
    >
      <X className="size-3.5" />
    </button>
  );
}
