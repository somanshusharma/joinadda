import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { SignUpCta } from "@/components/shared/SignUpCta";
import {
  AddExpenseDialog,
  type ExpenseMember,
} from "./AddExpenseDialog";
import { SettleButton } from "./SettleButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import {
  computeBalances,
  suggestSettlements,
  totalSpent,
  type ExpenseInput,
  type SettlementInput,
} from "@/lib/trips/split";
import { timeAgo } from "@/lib/utils";

type ExpenseRow = {
  id: string;
  title: string;
  amount_inr: number;
  notes: string | null;
  created_at: string;
  paid_by: string;
  created_by: string | null;
  payer: { id: string; display_name: string; avatar_url: string | null } | null;
};

type ShareRow = {
  expense_id: string;
  profile_id: string;
  share_inr: number;
};

type SettlementRow = {
  id: string;
  from_id: string;
  to_id: string;
  amount_inr: number;
  settled_at: string;
  from_profile: { display_name: string } | null;
  to_profile: { display_name: string } | null;
};

export async function TripExpensesPanel({
  eventId,
  currentUserId,
  isAttendee,
  members,
}: {
  eventId: string;
  currentUserId: string | null;
  isAttendee: boolean;
  members: ExpenseMember[];
}) {
  const supabase = await createClient();

  const [expensesRes, sharesRes, settlementsRes] = await Promise.all([
    supabase
      .from("trip_expenses")
      .select(
        "id, title, amount_inr, notes, created_at, paid_by, created_by, payer:paid_by(id, display_name, avatar_url)",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("trip_expense_shares")
      .select("expense_id, profile_id, share_inr"),
    supabase
      .from("trip_settlements")
      .select(
        "id, from_id, to_id, amount_inr, settled_at, from_profile:from_id(display_name), to_profile:to_id(display_name)",
      )
      .eq("event_id", eventId)
      .order("settled_at", { ascending: false }),
  ]);

  const expenses = (expensesRes.data as unknown as ExpenseRow[]) ?? [];
  const sharesAll = (sharesRes.data as unknown as ShareRow[]) ?? [];
  const settlements =
    (settlementsRes.data as unknown as SettlementRow[]) ?? [];

  const expenseIds = new Set(expenses.map((e) => e.id));
  const sharesByExpense = new Map<string, ShareRow[]>();
  for (const s of sharesAll) {
    if (!expenseIds.has(s.expense_id)) continue;
    const arr = sharesByExpense.get(s.expense_id) ?? [];
    arr.push(s);
    sharesByExpense.set(s.expense_id, arr);
  }

  // Build balance algorithm inputs
  const expenseInputs: ExpenseInput[] = expenses.map((e) => ({
    paid_by: e.paid_by,
    amount_inr: e.amount_inr,
    shares: (sharesByExpense.get(e.id) ?? []).map((s) => ({
      profile_id: s.profile_id,
      share_inr: s.share_inr,
    })),
  }));
  const settlementInputs: SettlementInput[] = settlements.map((s) => ({
    from_id: s.from_id,
    to_id: s.to_id,
    amount_inr: s.amount_inr,
  }));

  const balances = computeBalances(expenseInputs, settlementInputs);
  const suggested = suggestSettlements(balances);
  const total = totalSpent(expenseInputs);
  const myNet = currentUserId ? Math.round(balances.get(currentUserId) ?? 0) : 0;

  const memberLookup = new Map(members.map((m) => [m.id, m]));
  function lookup(id: string): ExpenseMember {
    return (
      memberLookup.get(id) ?? {
        id,
        display_name: "Someone",
        avatar_url: null,
      }
    );
  }

  const shouldShowEmptyState =
    expenses.length === 0 && settlements.length === 0;

  return (
    <section className="bg-white border border-surface-border rounded-3xl sun-kissed-shadow p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">
              receipt_long
            </span>
            trip expenses
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {total > 0
              ? `Total ₹${total.toLocaleString("en-IN")} across ${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}.`
              : "Split bills with the crew. Like Splitwise, but inside your trip."}
          </p>
          {currentUserId && (myNet > 0 || myNet < 0) ? (
            <p className="mt-2 inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
              {myNet > 0
                ? `You're owed ₹${myNet.toLocaleString("en-IN")}`
                : `You owe ₹${(-myNet).toLocaleString("en-IN")}`}
            </p>
          ) : null}
        </div>
        {isAttendee && currentUserId ? (
          <AddExpenseDialog
            eventId={eventId}
            currentUserId={currentUserId}
            members={members}
          />
        ) : !currentUserId ? (
          <SignUpCta label="Sign up to split" size="sm" next={`/trips/${eventId}`} />
        ) : null}
      </div>

      {shouldShowEmptyState ? (
        <p className="text-sm text-ink-muted">
          No expenses logged yet. {isAttendee ? "Add the first one!" : null}
        </p>
      ) : null}

      {/* Suggested settlements */}
      {suggested.length > 0 ? (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
            who owes whom
          </p>
          <ul className="space-y-2">
            {suggested.map((s) => {
              const from = lookup(s.from_id);
              const to = lookup(s.to_id);
              const involvesMe =
                !!currentUserId &&
                (currentUserId === s.from_id || currentUserId === s.to_id);
              return (
                <li
                  key={`${s.from_id}-${s.to_id}`}
                  className="flex items-center justify-between gap-3 bg-surface-low rounded-xl p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={from.display_name}
                      src={from.avatar_url}
                      seed={from.id}
                      size="sm"
                    />
                    <p className="text-sm text-ink truncate">
                      <span className="font-bold">
                        {currentUserId === s.from_id
                          ? "You"
                          : from.display_name.split(" ")[0]}
                      </span>{" "}
                      <span className="text-ink-muted">owe</span>{" "}
                      <span className="font-bold">
                        {currentUserId === s.to_id
                          ? "You"
                          : to.display_name.split(" ")[0]}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-base font-bold text-ink">
                      ₹{s.amount_inr.toLocaleString("en-IN")}
                    </span>
                    <SettleButton
                      eventId={eventId}
                      fromId={s.from_id}
                      toId={s.to_id}
                      amountInr={s.amount_inr}
                      canRecord={involvesMe}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : expenses.length > 0 && settlements.length > 0 ? (
        <div className="mb-5 inline-flex items-center gap-2 bg-success/10 text-success rounded-full px-3 py-1.5">
          <span className="material-symbols-outlined text-[18px]">
            check_circle
          </span>
          <span className="text-xs font-bold">All settled up</span>
        </div>
      ) : null}

      {/* Expense list */}
      {expenses.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
            expenses
          </p>
          <ul className="divide-y divide-surface-border">
            {expenses.map((e) => {
              const shares = sharesByExpense.get(e.id) ?? [];
              const splitCount = shares.length;
              const myShare =
                currentUserId &&
                shares.find((s) => s.profile_id === currentUserId)?.share_inr;
              const isMine = !!currentUserId && e.created_by === currentUserId;
              return (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  {e.payer ? (
                    <Avatar
                      name={e.payer.display_name}
                      src={e.payer.avatar_url}
                      seed={e.payer.id}
                      size="sm"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {e.payer
                        ? currentUserId === e.payer.id
                          ? "You paid"
                          : `${e.payer.display_name.split(" ")[0]} paid`
                        : "Paid"}
                      {splitCount > 0 ? ` · split ${splitCount}-way` : ""}
                      {myShare ? ` · your share ₹${myShare}` : ""}
                      {" · "}
                      {timeAgo(e.created_at)}
                    </p>
                    {e.notes ? (
                      <p className="mt-1 text-xs text-ink-muted italic line-clamp-2">
                        {e.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-display text-base font-bold text-ink">
                      ₹{e.amount_inr.toLocaleString("en-IN")}
                    </span>
                    {isMine ? (
                      <DeleteExpenseButton expenseId={e.id} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Settled history */}
      {settlements.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
            settled
          </p>
          <ul className="space-y-1">
            {settlements.slice(0, 5).map((s) => (
              <li key={s.id} className="text-xs text-ink-muted">
                <span className="font-semibold text-ink">
                  {currentUserId === s.from_id
                    ? "You"
                    : s.from_profile?.display_name?.split(" ")[0] ?? "Someone"}
                </span>{" "}
                paid{" "}
                <span className="font-semibold text-ink">
                  {currentUserId === s.to_id
                    ? "You"
                    : s.to_profile?.display_name?.split(" ")[0] ?? "Someone"}
                </span>{" "}
                ₹{s.amount_inr.toLocaleString("en-IN")} ·{" "}
                {timeAgo(s.settled_at)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
