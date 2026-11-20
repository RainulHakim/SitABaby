import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Layers,
  X,
  Heart,
  MapPin,
  ShieldCheck,
  HandHeart,
  ChevronDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Empty } from "../components/Card";
import { useStore } from "../lib/context";
import { allTags, days, windows, type Listing } from "../lib/data";
function Discover({ listings }: { listings: Listing[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const { saved, toggleSave } = useStore();
  const current = listings[index];
  const advance = (save: boolean) => {
    if (!current) return;
    if (save && !saved.includes(current.id)) toggleSave(current.id);
    setDirection(save ? 1 : -1);
    setIndex((v) => v + 1);
  };
  const action = useRef(advance);
  action.current = advance;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input,select,textarea,[role="dialog"]',
        )
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        action.current(true);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        action.current(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return current ? (
    <div className="discover">
      <div className="swipe-stack">
        {listings[index + 1] && (
          <div className="next-card" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 90) advance(info.offset.x > 0);
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
            variants={{
              leave: (d: number) => ({
                x: d * 450,
                rotate: d * 18,
                opacity: 0,
              }),
            }}
            exit="leave"
            transition={{ type: "spring", stiffness: 290, damping: 26 }}
          >
            <Card listing={current} priority />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="swipe-actions">
        <button
          onClick={() => advance(false)}
          className="skip-button"
          aria-label="Skip listing"
        >
          <X size={26} />
        </button>
        <span>
          {index + 1} of {listings.length}
          <small>Swipe to find your people</small>
        </span>
        <button
          onClick={() => advance(true)}
          className="save-button"
          aria-label="Save and view next listing"
        >
          <Heart size={25} />
        </button>
      </div>
      <p className="keyboard-hint">Use ← to skip · → to save</p>
    </div>
  ) : (
    <Empty
      title="You’ve met the whole neighborhood."
      text="Your saved families are waiting in Saved. Or take another look."
      action={
        <button className="button primary" onClick={() => setIndex(0)}>
          <RotateCcw size={16} />
          Start again
        </button>
      }
    />
  );
}
export default function Browse() {
  const { listings, loading, error, refresh } = useStore();
  const [view, setView] = useState<"grid" | "discover">("grid");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState(false);
  const [maxRate, setMaxRate] = useState(60);
  const [maxAge, setMaxAge] = useState(144);
  const [selected, setSelected] = useState<string[]>([]);
  const filterButton = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!filters) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement;
    sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilters(false);
      if (e.key === "Tab") {
        const nodes =
          sheetRef.current?.querySelectorAll<HTMLElement>("button,input");
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [filters]);
  const filtered = useMemo(
    () =>
      listings
        .filter(
          (l) =>
            l.location.toLowerCase().includes(query.toLowerCase()) &&
            l.hourly_rate <= maxRate &&
            l.child_age <= maxAge &&
            selected.every(
              (s) => l.tags.includes(s) || l.availability.includes(s),
            ),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.hourly_rate - b.hourly_rate
            : sort === "high"
              ? b.hourly_rate - a.hourly_rate
              : Date.parse(b.created_at) - Date.parse(a.created_at),
        ),
    [listings, query, maxRate, maxAge, selected, sort],
  );
  const count = selected.length + Number(maxRate < 60) + Number(maxAge < 144);
  const reset = () => {
    setQuery("");
    setMaxRate(60);
    setMaxAge(144);
    setSelected([]);
  };
  const toggle = (t: string) =>
    setSelected((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  return (
    <div className="browse-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />A LITTLE HELP GOES A LONG WAY
          </div>
          <h1>
            Your next little
            <br />
            <span>adventure</span> starts here
            <span className="coral-period">.</span>
          </h1>
          <p>
            Good sitters. Lovely little humans.
            <br className="mobile-break" /> Find a family that feels like your
            kind of people.
          </p>
          <div className="hero-trust">
            <div className="avatar-stack">
              <span>S</span>
              <span>J</span>
              <span>M</span>
              <span>A</span>
            </div>
            <span>A neighborhood, not just a noticeboard.</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-sun">
            <svg viewBox="0 0 100 100">
              <path
                d="M29 35v9m40-9v9M33 61q17 19 34 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="art-flower">
            <svg viewBox="0 0 130 130">
              <path
                d="M65 38C31 0 0 40 36 65 0 94 37 130 65 95c29 35 65-1 29-30 36-25 5-65-29-27"
                fill="currentColor"
              />
              <circle cx="65" cy="65" r="15" fill="var(--bg)" />
            </svg>
          </div>
          <div className="art-note">
            <HandHeart size={22} />
            <span>
              Small moments.
              <br />
              <b>Big difference.</b>
            </span>
          </div>
          <svg className="art-doodle" viewBox="0 0 80 60">
            <path
              d="M7 42Q42 3 68 28M53 11l18 15-19 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>
      <section className="browse-section" aria-label="Sitting requests">
        <div className="browse-toolbar">
          <div className="browse-title">
            <h2>Meet the little locals</h2>
            <span>{loading ? "…" : filtered.length} sitting requests</span>
          </div>
          <div className="view-toggle" aria-label="Listing view">
            <button
              className={view === "discover" ? "active" : ""}
              onClick={() => setView("discover")}
              aria-pressed={view === "discover"}
            >
              <Layers size={16} />
              Discover
            </button>
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid size={16} />
              Grid
            </button>
          </div>
        </div>
        <div className="search-row">
          <label className="search-box">
            <Search size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find your neighborhood or city"
              aria-label="Search by neighborhood or city"
            />
            {query ? (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            ) : (
              <MapPin size={17} className="search-pin" />
            )}
          </label>
          <button
            className={`button filter-button ${count ? "has-filters" : ""}`}
            ref={filterButton}
            onClick={() => setFilters(true)}
          >
            <SlidersHorizontal size={17} />
            Filters{count > 0 && <span>{count}</span>}
          </button>
          <label className="sort-control">
            <span>Sort by:</span>
            <select
              aria-label="Sort listings"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="low">Lowest rate</option>
              <option value="high">Highest rate</option>
            </select>
            <ChevronDown size={15} />
          </label>
        </div>
        <div className="quick-filters">
          <span>A good fit for you:</span>
          {["Loves books", "Napper", "Outdoor explorer", "Pets at home"].map(
            (t) => (
              <button
                className={selected.includes(t) ? "selected" : ""}
                key={t}
                onClick={() => toggle(t)}
              >
                {selected.includes(t) && <Check size={13} />} {t}
              </button>
            ),
          )}
          <span className="privacy-note">
            <ShieldCheck size={14} />
            Little details. Thoughtfully shared.
          </span>
        </div>
        {count > 0 && (
          <div className="active-filters">
            {maxRate < 60 && (
              <button onClick={() => setMaxRate(60)}>
                Up to ${maxRate}/hr <X size={13} />
              </button>
            )}
            {maxAge < 144 && (
              <button onClick={() => setMaxAge(144)}>
                Up to {maxAge / 12} years <X size={13} />
              </button>
            )}
            {selected.map((s) => (
              <button key={s} onClick={() => toggle(s)}>
                {s}
                <X size={13} />
              </button>
            ))}
            <button className="text-button" onClick={reset}>
              Clear all
            </button>
          </div>
        )}
        {loading ? (
          <div className="listing-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="skeleton-card" key={i}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <Empty
            title="A small bump in the road."
            text={error}
            action={
              <button className="button primary" onClick={() => void refresh()}>
                Try again
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <Empty
            action={
              <button className="button primary" onClick={reset}>
                Clear filters
              </button>
            }
          />
        ) : view === "grid" ? (
          <div className="listing-grid">
            {filtered.map((l, i) => (
              <Card key={l.id} listing={l} priority={i < 4} />
            ))}
          </div>
        ) : (
          <Discover
            key={filtered.map((l) => l.id).join(",")}
            listings={filtered}
          />
        )}
        <div className="parent-banner">
          <div className="banner-icon">
            <HandHeart size={30} />
          </div>
          <div>
            <h3>A little breathing room, for you.</h3>
            <p>
              Parents, your next great sitter could be just around the corner.
            </p>
          </div>
          <Link className="button" to="/post">
            <PlusIcon />
            Post a sitting request
          </Link>
        </div>
      </section>
      <AnimatePresence>
        {filters && (
          <div className="modal-layer">
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilters(false)}
            />
            <motion.aside
              className="filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-title"
              tabIndex={-1}
              ref={sheetRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.2 }}
            >
              <div className="sheet-header">
                <h2 id="filter-title">Your kind of fit</h2>
                <button
                  className="icon-button"
                  aria-label="Close filters"
                  onClick={() => setFilters(false)}
                >
                  <X />
                </button>
              </div>
              <p>A few little preferences go a long way.</p>
              <div className="filter-group">
                <label htmlFor="rate">
                  Hourly rate <b>Up to ${maxRate}</b>
                </label>
                <input
                  id="rate"
                  type="range"
                  min="10"
                  max="60"
                  value={maxRate}
                  onChange={(e) => setMaxRate(+e.target.value)}
                />
                <div className="range-labels">
                  <span>$10</span>
                  <span>$60+</span>
                </div>
              </div>
              <div className="filter-group">
                <label htmlFor="age">
                  Child’s age <b>Up to {maxAge / 12} years</b>
                </label>
                <input
                  id="age"
                  type="range"
                  min="12"
                  max="144"
                  step="12"
                  value={maxAge}
                  onChange={(e) => setMaxAge(+e.target.value)}
                />
              </div>
              <div className="filter-group">
                <h3>Days that work</h3>
                <div className="chips">
                  {days.map((d) => (
                    <button
                      key={d}
                      className={selected.includes(d) ? "selected" : ""}
                      onClick={() => toggle(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <h3>Time of day</h3>
                <div className="chips">
                  {windows.map((w) => (
                    <button
                      key={w}
                      className={selected.includes(w) ? "selected" : ""}
                      onClick={() => toggle(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <h3>The little things</h3>
                <div className="chips">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      className={selected.includes(t) ? "selected" : ""}
                      onClick={() => toggle(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sheet-footer">
                <button className="text-button" onClick={reset}>
                  Reset filters
                </button>
                <button
                  className="button primary"
                  onClick={() => setFilters(false)}
                >
                  Show {filtered.length} requests
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function PlusIcon() {
  return (
    <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>
      +
    </span>
  );
}
