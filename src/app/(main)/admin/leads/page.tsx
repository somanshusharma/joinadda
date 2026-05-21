import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { updateLeadStatus } from "@/app/actions/leads";
import { timeAgo } from "@/lib/utils";
import { activityLabel } from "@/lib/config";

type LeadRow = {
  id: string;
  status: "new" | "contacted" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  expected_headcount: number | null;
  requested_for_time: string | null;
  founder_note: string | null;
  listing: {
    id: string;
    title: string;
    activity_tag: string;
    contact_phone: string | null;
    contact_whatsapp: string | null;
    address: string | null;
  } | null;
  host: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  requester: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  hangout: {
    id: string;
    activity: string;
    location: string;
  } | null;
};

const STATUS_COLORS: Record<LeadRow["status"], string> = {
  new: "bg-primary-100 text-primary-700",
  contacted: "bg-sky text-ink",
  confirmed: "bg-success/15 text-success",
  cancelled: "bg-surface-muted text-ink-muted",
  completed: "bg-lilac text-ink",
};

export default async function AdminLeadsPage() {
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

  const { data } = await supabase
    .from("host_leads")
    .select(
      "id, status, created_at, expected_headcount, requested_for_time, founder_note, listing:listing_id(id, title, activity_tag, contact_phone, contact_whatsapp, address), host:host_id(id, username, display_name, avatar_url), requester:requester_id(id, username, display_name, avatar_url), hangout:hangout_id(id, activity, location)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const leads = (data as unknown as LeadRow[]) ?? [];

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Host leads
          </h1>
          <p className="mt-1 text-base text-ink-secondary">
            Every time a user picks a registered venue, we capture it here.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-ink-muted hover:text-ink"
        >
          ← admin home
        </Link>
      </header>

      {leads.length === 0 ? (
        <EmptyState
          icon={
            <span className="material-symbols-outlined text-4xl">storefront</span>
          }
          title="No leads yet"
          description="When a user creates a hangout with a registered venue, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {leads.map((l) => {
            const waNumber =
              l.listing?.contact_whatsapp ?? l.listing?.contact_phone ?? null;
            const waHref = waNumber
              ? `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${l.host?.display_name?.split(" ")[0] ?? ""}! Someone on JoinAdda planned a hangout at ${l.listing?.title} (${activityLabel(l.listing?.activity_tag)}) for ${l.requested_for_time ?? "soon"} with ~${l.expected_headcount ?? "?"} people. Can you confirm availability?`,
                )}`
              : null;

            return (
              <article
                key={l.id}
                className="bg-white border border-surface-border rounded-2xl p-4 md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status]}`}
                    >
                      {l.status}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {timeAgo(l.created_at)}
                    </span>
                  </div>
                  <form
                    action={async (fd) => {
                      "use server";
                      const status = fd.get("status") as LeadRow["status"];
                      await updateLeadStatus(l.id, status);
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="text-xs h-8 px-2 rounded-full border border-surface-border bg-surface-low"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                      <option value="completed">completed</option>
                    </select>
                    <button
                      type="submit"
                      className="text-xs h-8 px-3 rounded-full bg-primary-500 text-white font-semibold"
                    >
                      save
                    </button>
                  </form>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Venue */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-1">
                      Venue
                    </p>
                    <p className="font-semibold text-ink">
                      {l.listing?.title ?? "—"}
                    </p>
                    {l.listing?.address ? (
                      <p className="text-xs text-ink-muted">
                        {l.listing.address}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-primary-600">
                      {activityLabel(l.listing?.activity_tag)}
                    </p>
                  </div>

                  {/* Host */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-1">
                      Host
                    </p>
                    {l.host ? (
                      <Link
                        href={`/profile/${l.host.username}`}
                        className="flex items-center gap-2 group"
                      >
                        <Avatar
                          name={l.host.display_name}
                          src={l.host.avatar_url}
                          seed={l.host.id}
                          size="sm"
                        />
                        <span className="font-semibold text-ink group-hover:text-primary-600 truncate">
                          {l.host.display_name}
                        </span>
                      </Link>
                    ) : (
                      <p className="text-xs text-ink-muted">—</p>
                    )}
                    {l.listing?.contact_phone ? (
                      <p className="text-xs text-ink-muted mt-1">
                        📞 {l.listing.contact_phone}
                      </p>
                    ) : null}
                  </div>

                  {/* Requester */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-1">
                      Requested by
                    </p>
                    {l.requester ? (
                      <Link
                        href={`/profile/${l.requester.username}`}
                        className="flex items-center gap-2 group"
                      >
                        <Avatar
                          name={l.requester.display_name}
                          src={l.requester.avatar_url}
                          seed={l.requester.id}
                          size="sm"
                        />
                        <span className="font-semibold text-ink group-hover:text-primary-600 truncate">
                          {l.requester.display_name}
                        </span>
                      </Link>
                    ) : (
                      <p className="text-xs text-ink-muted">—</p>
                    )}
                    <p className="text-xs text-ink-muted mt-1">
                      ~{l.expected_headcount ?? "?"} ppl · {l.requested_for_time ?? "—"}
                    </p>
                  </div>
                </div>

                {l.hangout ? (
                  <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between gap-3 text-xs">
                    <Link
                      href={`/hangouts/${l.hangout.id}`}
                      className="text-primary-600 font-semibold hover:underline truncate"
                    >
                      → {l.hangout.activity} · {l.hangout.location}
                    </Link>
                    {waHref ? (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-success font-semibold whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          chat
                        </span>
                        WA host
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
