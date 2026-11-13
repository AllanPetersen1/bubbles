import { formatRating } from "@/lib/rating";
import type { FeedItem } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import Avatar from "./Avatar";
import ReviewActions from "./ReviewActions";
import { StarRow } from "./Stars";

export default function FeedCard({
  item,
  index = 0,
  onChange,
  onDelete,
}: {
  item: FeedItem;
  index?: number;
  /** Pass both only for the signed-in author: they switch on the edit and delete buttons. */
  onChange?: (item: FeedItem) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <article
      className="rise border-b border-border pb-6"
      style={{ "--i": Math.min(index, 6) } as React.CSSProperties}
    >
      <header className="flex items-center gap-3 py-1 pr-1 pl-4">
        <Avatar name={item.user.name} url={item.user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.user.name}</p>
        </div>
        <time dateTime={item.createdAt} className="shrink-0 text-xs text-text-muted">
          {timeAgo(item.createdAt)}
        </time>
        {onChange && onDelete ? (
          <div className="flex shrink-0">
            <ReviewActions item={item} onChange={onChange} onDelete={onDelete} />
          </div>
        ) : (
          <span className="w-3" />
        )}
      </header>

      {item.thumbUrl && (
        // Thumbnails only in the feed (~25 KB). The full image is for a detail view.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbUrl}
          alt={`${item.producer} ${item.cuvee}`}
          width={400}
          height={500}
          loading="lazy"
          className="aspect-[4/5] w-full bg-badge-bg object-cover lg:aspect-[4/3]"
        />
      )}

      <div className="px-4 pt-4">
        <p className="eyebrow">{item.producer}</p>
        <h2 className="mt-1 font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
          {item.cuvee}
        </h2>
        <p className="mt-1 text-[13px] text-text-muted">
          {item.vintage ? item.vintage : "Non-vintage"}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <StarRow value={item.rating} size={16} />
          <span className="text-sm font-semibold tabular-nums">{formatRating(item.rating)}</span>
          {item.dosage && <span className="badge ml-auto">{item.dosage}</span>}
        </div>

        {item.note && (
          <p className="mt-3 font-display text-[17px] italic leading-[1.5] text-text-main">
            {item.note}
          </p>
        )}

        {item.venue && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
            {item.venue}
          </p>
        )}
      </div>
    </article>
  );
}
