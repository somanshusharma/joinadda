import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { JoinHangoutButton } from "./JoinHangoutButton";
import { SignUpCta } from "@/components/shared/SignUpCta";
import type { HangoutJoinerPreview } from "@/lib/hangouts";

export type HangoutCardData = {
  id: string;
  activity: string;
  description: string | null;
  time_window: string;
  location: string;
  joiner_count: number;
  max_joiners: number;
  status: "open" | "full" | "happening" | "completed" | "cancelled";
  host: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export function HangoutCard({
  hangout,
  currentUserId,
  joined,
  joiners = [],
}: {
  hangout: HangoutCardData;
  currentUserId: string | null;
  joined: boolean;
  joiners?: HangoutJoinerPreview[];
}) {
  const isFull = hangout.joiner_count >= hangout.max_joiners;
  const isHost = hangout.host?.id === currentUserId;
  const isCancelled = hangout.status === "cancelled";
  const dim = isFull && !joined && !isHost;
  const firstName = hangout.host?.display_name.split(" ")[0] ?? "Someone";

  return (
    <article
      className={
        "bg-white rounded-[32px] border border-surface-border sun-kissed-shadow p-6 md:p-8 transition-transform hover:-translate-y-1 " +
        (dim ? "opacity-70" : "")
      }
    >
      {/* Top row — avatar + headline + meta */}
      <div className="flex items-start gap-4 mb-5">
        {hangout.host ? (
          <Link href={`/profile/${hangout.host.username}`} className="shrink-0">
            <Avatar
              name={hangout.host.display_name}
              src={hangout.host.avatar_url}
              seed={hangout.host.id}
              size="lg"
            />
          </Link>
        ) : null}
        <div className="flex-1 min-w-0">
          <Link href={`/hangouts/${hangout.id}`}>
            <h2 className="font-display text-xl font-semibold text-ink leading-snug hover:text-primary-700 transition-colors">
              {firstName.toLowerCase()} wants to{" "}
              <span className="text-primary-600">{hangout.activity}</span>
            </h2>
          </Link>
          <p className="text-ink-muted text-sm mt-1">
            {hangout.time_window} · {hangout.location}
          </p>
        </div>
      </div>

      {/* Optional italic description */}
      {hangout.description ? (
        <p className="text-base text-ink mb-6 italic">
          &ldquo;{hangout.description}&rdquo;
        </p>
      ) : null}

      {/* Divider + footer */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-muted">
        <JoinerFooter
          joiners={joiners}
          total={hangout.joiner_count}
          max={hangout.max_joiners}
          isFull={isFull}
          joined={joined}
          isHost={isHost}
        />
        {currentUserId ? (
          <JoinHangoutButton
            hangoutId={hangout.id}
            initialJoined={joined}
            isFull={isFull}
            isHost={isHost}
            isCancelled={isCancelled}
            size="sm"
          />
        ) : (
          <SignUpCta
            label="I'm in"
            size="sm"
            next={`/hangouts/${hangout.id}`}
          />
        )}
      </div>
    </article>
  );
}

function JoinerFooter({
  joiners,
  total,
  max,
  isFull,
  joined,
  isHost,
}: {
  joiners: HangoutJoinerPreview[];
  total: number;
  max: number;
  isFull: boolean;
  joined: boolean;
  isHost: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {joiners.length > 0 ? (
        <div className="flex -space-x-3">
          {joiners.slice(0, 3).map((j) => (
            <div key={j.id} className="rounded-full border-2 border-white">
              <Avatar
                name={j.display_name}
                src={j.avatar_url}
                seed={j.id}
                size="sm"
              />
            </div>
          ))}
        </div>
      ) : null}
      <span className="text-sm font-medium text-ink-secondary ml-1">
        {isHost
          ? `${total} in`
          : joined
            ? "joined ✓"
            : isFull
              ? "full"
              : `${total} of ${max} in`}
      </span>
    </div>
  );
}
