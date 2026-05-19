/**
 * Trip expense splitter — computes net balances and the minimum set of
 * "X owes Y ₹N" transactions that clear them.
 *
 * Net balance for a person = (what they paid for the group) - (their share of all expenses)
 * + (settlements received) - (settlements paid)
 */

export type ExpenseInput = {
  paid_by: string;
  amount_inr: number;
  shares: Array<{ profile_id: string; share_inr: number }>;
};

export type SettlementInput = {
  from_id: string;
  to_id: string;
  amount_inr: number;
};

export type Balance = {
  profile_id: string;
  net_inr: number; // positive = others owe them; negative = they owe others
};

export type SuggestedSettlement = {
  from_id: string;
  to_id: string;
  amount_inr: number;
};

export function computeBalances(
  expenses: ExpenseInput[],
  settlements: SettlementInput[],
): Map<string, number> {
  const net = new Map<string, number>();
  const bump = (id: string, delta: number) => {
    net.set(id, (net.get(id) ?? 0) + delta);
  };

  for (const e of expenses) {
    bump(e.paid_by, e.amount_inr);
    for (const s of e.shares) {
      bump(s.profile_id, -s.share_inr);
    }
  }
  for (const s of settlements) {
    // from_id paid to_id, so from_id's balance goes UP (they owed less now),
    // to_id's balance goes DOWN (they're owed less now).
    bump(s.from_id, s.amount_inr);
    bump(s.to_id, -s.amount_inr);
  }
  return net;
}

/**
 * Greedy matcher: take the biggest creditor and biggest debtor, settle the
 * smaller of the two, repeat until everyone's within ₹1. Minimises the number
 * of transactions.
 */
export function suggestSettlements(
  net: Map<string, number>,
): SuggestedSettlement[] {
  const creditors: Array<{ id: string; amt: number }> = [];
  const debtors: Array<{ id: string; amt: number }> = [];
  for (const [id, amt] of net.entries()) {
    if (amt > 0.5) creditors.push({ id, amt });
    else if (amt < -0.5) debtors.push({ id, amt: -amt });
  }
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const result: SuggestedSettlement[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const cred = creditors[i];
    const deb = debtors[j];
    const pay = Math.min(cred.amt, deb.amt);
    if (pay >= 1) {
      result.push({
        from_id: deb.id,
        to_id: cred.id,
        amount_inr: Math.round(pay),
      });
    }
    cred.amt -= pay;
    deb.amt -= pay;
    if (cred.amt < 1) i++;
    if (deb.amt < 1) j++;
  }
  return result;
}

export function totalSpent(expenses: ExpenseInput[]): number {
  return expenses.reduce((acc, e) => acc + e.amount_inr, 0);
}
