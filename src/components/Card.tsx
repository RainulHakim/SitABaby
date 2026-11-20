import { Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ageLabel, money, relativeTime, type Listing } from "../lib/data";
import { useStore } from "../lib/context";
const MotionLink = motion.create(Link);
export function Card({
  listing,
  priority = false,
}: {
  listing: Listing;
  priority?: boolean;
}) {
  const { saved, toggleSave } = useStore();
  const liked = saved.includes(listing.id);
  return (
    <motion.article
      className="listing-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <MotionLink
        layoutId={`photo-${listing.id}`}
        to={`/l/${listing.id}`}
        className="card-photo"
        aria-label={`Meet ${listing.child_name || listing.parent_first_name}, ${ageLabel(listing.child_age)}`}
      >
        <img
          src={listing.photo_url}
          alt={`A glimpse of ${listing.parent_first_name}'s little world`}
          loading={priority ? "eager" : "lazy"}
          onLoad={(e) => e.currentTarget.classList.add("loaded")}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/photo-fallback.svg";
            e.currentTarget.classList.add("loaded");
          }}
        />
        <div className="photo-shade" />
        <span className="age-badge">{ageLabel(listing.child_age)} old</span>
        <div className="photo-copy">
          <span className="family-label">A LITTLE HELP FOR</span>
          <div className="card-title">
            <h3>
              {listing.child_name || `${listing.parent_first_name}'s family`}
            </h3>
            <span>
              {money(listing.hourly_rate, listing.currency)}
              <small>/hr</small>
            </span>
          </div>
        </div>
      </MotionLink>
      <button
        className={`heart ${liked ? "liked" : ""}`}
        onClick={() => toggleSave(listing.id)}
        aria-label={liked ? "Unsave listing" : "Save listing"}
        aria-pressed={liked}
      >
        <Heart size={19} fill={liked ? "currentColor" : "none"} />
      </button>
      <div className="card-body">
        <div className="card-meta">
          <span>
            <MapPin size={14} />
            {listing.location}
          </span>
          <span>{relativeTime(listing.created_at)}</span>
        </div>
        <p>{listing.description}</p>
        <div className="card-tags">
          {listing.tags.slice(0, 2).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="card-bottom">
          <span className="parent-avatar">{listing.parent_first_name[0]}</span>
          <span>
            Posted by <b>{listing.parent_first_name}</b>
          </span>
          <span
            className="availability-dot"
            title="Sitting request available"
          />
        </div>
      </div>
    </motion.article>
  );
}
export function Empty({
  title = "A little quiet around here.",
  text = "Try a different city or loosen up your filters.",
  action,
}: {
  title?: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <svg
        width="130"
        height="100"
        viewBox="0 0 130 100"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M25 73h80M38 72V42a27 27 0 0 1 54 0v30M49 71V46a16 16 0 0 1 32 0v25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M59 57q6 7 12 0M20 30l5 4M103 24l-4 6M62 10v7"
          stroke="#e8604c"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
