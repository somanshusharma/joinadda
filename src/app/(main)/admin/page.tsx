import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Flag, Ticket, Trash2, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveReport, softDeletePost } from "@/app/actions/moderation";
import { timeAgo } from "@/lib/utils";

type ReportRow = {
  id: string;
  entity_type: "profile" | "post" | "comment" | "event" | "message";
  entity_id: string;
  reason: string;
  notes: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  reporter: { username: string; display_name: string } | null;
};

type InviteRow = {
  code: string;
  uses: number;
  max_uses: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<{ is_admin: boolean }>();
  if (!me?.is_admin) notFound();

  const [{ data: reports }, { data: invites }, { count: openCount }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, entity_type, entity_id, reason, notes, status, created_at, reporter:reporter_id(username, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("invite_codes")
      .select("code, uses, max_uses, is_active, note, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const rs = (reports as unknown as ReportRow[]) ?? [];
  const open = rs.filter((r) => r.status === "open");
  const codes = (invites as InviteRow[]) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Mod tools</h1>
      <p className="mt-1 text-ink-secondary">
        {openCount ?? 0} open report{openCount === 1 ? "" : "s"}. Keep it warm.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition"
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          Host leads
        </Link>
      </nav>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Reports</h2>
        {open.length === 0 ? (
          <EmptyState
            icon={<Flag />}
            title="Inbox zero. Nice."
            description="No open reports right now."
          />
        ) : (
          <div className="space-y-3">
            {open.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">Invite codes</h2>
        {codes.length === 0 ? (
          <EmptyState
            icon={<Ticket />}
            title="No invite codes yet"
            description="Add one via SQL — we don't have a UI for creating these yet."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-elevated">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Uses</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {codes.map((c) => (
                  <tr key={c.code}>
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-ink">
                      {c.code}
                    </td>
                    <td className="px-4 py-2">
                      {c.uses}/{c.max_uses}
                    </td>
                    <td className="px-4 py-2">
                      {c.is_active ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                          Used up
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-secondary">{c.note ?? "—"}</td>
                    <td className="px-4 py-2 text-ink-muted">{timeAgo(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rs.length > open.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-ink">Recently resolved</h2>
          <div className="space-y-2">
            {rs
              .filter((r) => r.status !== "open")
              .slice(0, 10)
              .map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-surface-border bg-surface-elevated p-3 text-sm text-ink-secondary"
                >
                  <span className="font-semibold text-ink">{r.entity_type}</span>{" "}
                  · {r.reason} ·{" "}
                  <span className="text-ink-muted">
                    {r.status} {timeAgo(r.created_at)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReportCard({ report }: { report: ReportRow }) {
  const entityHref =
    report.entity_type === "post"
      ? `/feed/post/${report.entity_id}`
      : report.entity_type === "event"
        ? `/trips/${report.entity_id}`
        : report.entity_type === "profile"
          ? `/profile/${report.reporter?.username ?? ""}`
          : null;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-ink">{report.reason}</span>
            <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-secondary">
              {report.entity_type}
            </span>
          </p>
          {report.notes ? (
            <p className="mt-1 text-sm text-ink-secondary">{report.notes}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-muted">
            by @{report.reporter?.username ?? "unknown"} · {timeAgo(report.created_at)}
          </p>
        </div>
        {entityHref ? (
          <Link
            href={entityHref}
            className="shrink-0 rounded-full border border-surface-border px-3 py-1 text-xs font-semibold text-ink-secondary hover:border-primary-200"
          >
            View
          </Link>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {report.entity_type === "post" ? (
          <form
            action={async () => {
              "use server";
              await softDeletePost(report.entity_id);
              await resolveReport(report.id, "resolve");
            }}
          >
            <Button size="sm" variant="danger" type="submit">
              <Trash2 className="size-4" /> Delete post + resolve
            </Button>
          </form>
        ) : null}
        <form
          action={async () => {
            "use server";
            await resolveReport(report.id, "resolve");
          }}
        >
          <Button size="sm" variant="outline" type="submit">
            <Check className="size-4" /> Resolve
          </Button>
        </form>
        <form
          action={async () => {
            "use server";
            await resolveReport(report.id, "dismiss");
          }}
        >
          <Button size="sm" variant="ghost" type="submit">
            <X className="size-4" /> Dismiss
          </Button>
        </form>
      </div>
    </div>
  );
}
