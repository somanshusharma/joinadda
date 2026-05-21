import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { ReviewForm } from "./ReviewForm";
import { RatingBadge } from "./RatingBadge";
import { timeAgo } from "@/lib/utils";
import type { ReviewSubjectType } from "@/app/actions/reviews";

type ReviewRow = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export async function ReviewList({
  subjectType,
  subjectId,
  subjectLabel,
  avgRating,
  reviewCount,
  canReview,
  contextType,
  contextId,
}: {
  subjectType: ReviewSubjectType;
  subjectId: string;
  subjectLabel?: string;
  avgRating: number | null;
  reviewCount: number | null;
  canReview: boolean;
  contextType?: "hangout" | "trip";
  contextId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("reviews")
    .select(
      "id, rating, review_text, created_at, reviewer_id, reviewer:reviewer_id(id, username, display_name, avatar_url)",
    )
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews = (data as unknown as ReviewRow[]) ?? [];
  const myReview = user ? reviews.find((r) => r.reviewer_id === user.id) : null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-xl font-semibold text-ink flex items-center gap-2">
          Reviews
          {reviewCount ? (
            <RatingBadge
              rating={avgRating}
              count={reviewCount}
              size="md"
              className="ml-1"
            />
          ) : null}
        </h3>
      </div>

      {/* Write a review */}
      {canReview && user ? (
        <ReviewForm
          subjectType={subjectType}
          subjectId={subjectId}
          subjectLabel={subjectLabel}
          contextType={contextType}
          contextId={contextId}
          initialRating={myReview?.rating ?? null}
          initialText={myReview?.review_text ?? null}
        />
      ) : null}

      {/* List */}
      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          reviews.map((r) => <ReviewItem key={r.id} review={r} />)
        )}
      </div>
    </section>
  );
}

function ReviewItem({ review }: { review: ReviewRow }) {
  return (
    <article className="bg-white border border-surface-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {review.reviewer ? (
          <Link
            href={`/profile/${review.reviewer.username}`}
            className="shrink-0"
          >
            <Avatar
              name={review.reviewer.display_name}
              src={review.reviewer.avatar_url}
              seed={review.reviewer.id}
              size="sm"
            />
          </Link>
        ) : (
          <div className="size-9 rounded-full bg-surface-muted shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            {review.reviewer ? (
              <Link
                href={`/profile/${review.reviewer.username}`}
                className="font-semibold text-ink text-sm hover:text-primary-600"
              >
                {review.reviewer.display_name}
              </Link>
            ) : (
              <span className="font-semibold text-ink text-sm">Someone</span>
            )}
            <span className="text-xs text-ink-muted">
              {timeAgo(review.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="material-symbols-outlined text-[14px]"
                style={{
                  color:
                    n <= review.rating
                      ? "var(--color-mango-500)"
                      : "var(--color-surface-border)",
                  fontVariationSettings:
                    n <= review.rating ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            ))}
          </div>
          {review.review_text ? (
            <p className="mt-2 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
              {review.review_text}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
