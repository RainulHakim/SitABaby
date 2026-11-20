import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Camera,
  Upload,
  Check,
  ShieldCheck,
  EyeOff,
  ChevronLeft,
  ImagePlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, Empty } from "../components/Card";
import { useStore } from "../lib/context";
import {
  ageLabel,
  allTags,
  data,
  days,
  isOwner,
  validLocation,
  windows,
  type ListingInput,
} from "../lib/data";
import { preparePhoto } from "../lib/image";
const initial: ListingInput = {
  parent_first_name: "",
  child_name: "",
  child_age: 24,
  photo_url: "",
  description: "",
  hourly_rate: 20,
  currency: "USD",
  location: "",
  availability: [],
  tags: [],
  contact_method: "email",
  contact_value: "",
};
export default function Post() {
  const { id } = useParams();
  const { listings, loading, refresh, toast } = useStore();
  const existing = listings.find((l) => l.id === id);
  const [form, setForm] = useState<ListingInput>(initial);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [blur, setBlur] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (existing) {
      const { id: _id, created_at: _created, ...values } = existing;
      setForm(values);
    }
  }, [existing]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function update<K extends keyof ListingInput>(
    key: K,
    value: ListingInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }
  function toggle(key: "tags" | "availability", value: string) {
    update(
      key,
      form[key].includes(value)
        ? form[key].filter((x) => x !== value)
        : [...form[key], value],
    );
  }
  async function selectFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("That photo is a little large. Choose one under 15 MB.");
      return;
    }
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const image = new Image();
      image.src = result;
      await image.decode();
      setSource(result);
      setZoom(1);
      setX(50);
      setY(50);
      setError("");
    } catch {
      setError("We couldn’t read that photo. Please try another.");
    }
  }
  async function next(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (!source && !form.photo_url) {
        setError(
          "Add a little glimpse of your world first. A room or toys is perfect.",
        );
        return;
      }
      if (source) {
        setProcessing(true);
        try {
          const blob = await preparePhoto(source, zoom, x, y, blur);
          const url = await data.upload(blob);
          update("photo_url", url);
          setSource("");
        } catch {
          setError(
            "Your photo couldn’t be saved. Check your storage or connection and try again.",
          );
          return;
        } finally {
          setProcessing(false);
        }
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.parent_first_name.trim()) {
        setError("What should we call you? Add your first name.");
        return;
      }
      if (!validLocation(form.location)) {
        setError(
          "Use a neighborhood or city, without house numbers or street addresses.",
        );
        return;
      }
      if (form.description.trim().length < 20) {
        setError("Tell sitters a little more — at least 20 characters.");
        return;
      }
      if (
        !days.some((d) => form.availability.includes(d)) ||
        !windows.some((w) => form.availability.includes(w))
      ) {
        setError("Choose at least one day and a time of day.");
        return;
      }
      setStep(3);
      return;
    }
    if (form.hourly_rate < 1 || form.hourly_rate > 200) {
      setError("Choose an hourly rate between 1 and 200.");
      return;
    }
    if (
      form.contact_method === "email"
        ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_value)
        : !/^\+?[\d\s().-]{7,25}$/.test(form.contact_value)
    ) {
      setError(
        form.contact_method === "email"
          ? "Add a valid email so sitters can say hello."
          : "Add a valid phone number, including your country code.",
      );
      return;
    }
    setProcessing(true);
    try {
      const key = await data.save(
        {
          ...form,
          parent_first_name: form.parent_first_name.trim(),
          location: form.location.trim(),
          description: form.description.trim(),
        },
        id,
      );
      await refresh();
      setSuccess(key);
      toast(
        id
          ? "Your request has been updated."
          : "Your sitting request is out in the world.",
      );
    } catch {
      setError(
        "We couldn’t save your request. Check your connection or device storage and try again.",
      );
    } finally {
      setProcessing(false);
    }
  }
  if (id && loading)
    return <div className="page-loading">Finding your request…</div>;
  if (id && (!existing || !isOwner(id)))
    return (
      <Empty
        title="This request belongs to another browser."
        text="Open it in the browser where you posted it to make changes."
        action={
          <Link className="button primary" to="/mine">
            My requests
          </Link>
        }
      />
    );
  if (success)
    return (
      <div className="success-page">
        <motion.div
          className="success-check"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Check size={42} />
        </motion.div>
        <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>{id ? "All freshened up." : "Hello, village."}</h1>
        <p>
          {id
            ? "Your sitting request is updated."
            : "Your sitting request is live. A lovely connection could be just around the corner."}
        </p>
        <Link className="button primary" to={`/l/${success}`}>
          View your listing
        </Link>
        <Link className="text-button" to="/mine">
          Manage my requests
        </Link>
      </div>
    );
  const preview = {
    ...form,
    id: id || "preview",
    created_at: new Date().toISOString(),
    child_name: form.child_name || "Your little one",
    parent_first_name: form.parent_first_name || "You",
  };
  return (
    <div className="post-page">
      <div className="page-heading">
        <div className="eyebrow">A LITTLE HELP IS ON THE WAY</div>
        <h1>{id ? "A little update." : "Let’s find your people."}</h1>
        <p>A few little details. A whole lot of possibility.</p>
      </div>
      <ol className="wizard-steps">
        {["A little glimpse", "The little details", "Rate & say hello"].map(
          (s, i) => (
            <li
              key={s}
              className={
                step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
              }
            >
              <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
              {s}
            </li>
          ),
        )}
      </ol>
      <div className={`wizard-layout ${step === 1 ? "photo-step" : ""}`}>
        <form onSubmit={(e) => void next(e)} className="wizard-form">
          <div className="step-title">
            <h2>
              {step === 1
                ? "A glimpse of their little world"
                : step === 2
                  ? "What makes your family, your family?"
                  : "Make the first hello easy."}
            </h2>
            <p>
              {step === 1
                ? "Their favorite corner. Their trusty teddy. A photo that feels like home."
                : step === 2
                  ? "Help sitters get a feel for your day-to-day."
                  : "Choose a fair rate and a way for sitters to reach you."}
            </p>
          </div>
          {step === 1 ? (
            <>
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Upload listing photo"
                onChange={(e) => void selectFile(e.target.files?.[0])}
              />
              {source || form.photo_url ? (
                <div className="crop-layout">
                  <div
                    className="crop-preview"
                    style={{ filter: blur ? "blur(9px)" : undefined }}
                  >
                    <img
                      src={source || form.photo_url}
                      alt="Listing photo crop preview"
                      style={{
                        objectPosition: `${x}% ${y}%`,
                        transform: `scale(${zoom})`,
                        transformOrigin: `${x}% ${y}%`,
                      }}
                    />
                  </div>
                  <div className="crop-controls">
                    <p>Make it just right.</p>
                    {source && (
                      <>
                        <label>
                          Zoom
                          <input
                            type="range"
                            min="1"
                            max="2.5"
                            step=".05"
                            value={zoom}
                            onChange={(e) => setZoom(+e.target.value)}
                          />
                        </label>
                        <label>
                          Horizontal position
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={x}
                            onChange={(e) => setX(+e.target.value)}
                          />
                        </label>
                        <label>
                          Vertical position
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={y}
                            onChange={(e) => setY(+e.target.value)}
                          />
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      className="button"
                      onClick={() => input.current?.click()}
                    >
                      <ImagePlus size={17} />
                      Change photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void selectFile(e.dataTransfer.files[0]);
                  }}
                >
                  <span className="upload-icon">
                    <Camera size={32} />
                  </span>
                  <h3>A little picture. A big hello.</h3>
                  <p>Drop your photo here, or tap to choose</p>
                  <span className="button">
                    <Upload size={15} />
                    Choose a photo
                  </span>
                  <small>JPG, PNG, or WebP · up to 15 MB</small>
                </button>
              )}
              <label className="privacy-toggle">
                <EyeOff size={21} />
                <span>
                  <b>Hide face</b>
                  <small>
                    Softly blur the whole photo for a little extra privacy.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={blur}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setBlur(checked);
                    if (!source && form.photo_url && checked) {
                      try {
                        const response = await fetch(form.photo_url);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onload = () => setSource(String(reader.result));
                        reader.readAsDataURL(blob);
                      } catch {
                        setError(
                          "Please upload your photo again to apply the blur.",
                        );
                      }
                    }
                  }}
                />
              </label>
              <p className="gentle-note">
                <ShieldCheck size={16} />
                No face needed. A photo of the playroom or favorite toys is
                lovely, too.
              </p>
            </>
          ) : step === 2 ? (
            <>
              <div className="form-pair">
                <label>
                  Your first name
                  <input
                    required
                    maxLength={40}
                    value={form.parent_first_name}
                    onChange={(e) =>
                      update("parent_first_name", e.target.value)
                    }
                    placeholder="e.g. Sarah"
                  />
                </label>
                <label>
                  Child’s first name <span className="optional">optional</span>
                  <input
                    maxLength={40}
                    value={form.child_name}
                    onChange={(e) => update("child_name", e.target.value)}
                    placeholder="e.g. Oliver"
                  />
                </label>
              </div>
              <div className="form-pair">
                <label>
                  Child’s age
                  <select
                    value={form.child_age}
                    onChange={(e) => update("child_age", +e.target.value)}
                  >
                    {Array.from({ length: 23 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {ageLabel(i + 1)}
                      </option>
                    ))}
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={(i + 2) * 12} value={(i + 2) * 12}>
                        {i + 2} years
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Neighborhood / city
                  <input
                    required
                    maxLength={80}
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Brooklyn, NY"
                  />
                  <small>A neighborhood, never a street address.</small>
                </label>
              </div>
              <label>
                A little about your family
                <textarea
                  required
                  minLength={20}
                  maxLength={500}
                  rows={5}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What do they love? What kind of help would make your day a little easier?"
                />
                <small className="character-count">
                  {form.description.length} / 500
                </small>
              </label>
              <fieldset>
                <legend>
                  The little things <span className="optional">pick a few</span>
                </legend>
                <div className="chips">
                  {allTags.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={form.tags.includes(t) ? "selected" : ""}
                      onClick={() => toggle("tags", t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>When could you use a hand?</legend>
                <div className="chips">
                  {days.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={
                        form.availability.includes(d) ? "selected" : ""
                      }
                      onClick={() => toggle("availability", d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="chips time-chips">
                  {windows.map((w) => (
                    <button
                      type="button"
                      key={w}
                      className={
                        form.availability.includes(w) ? "selected" : ""
                      }
                      onClick={() => toggle("availability", w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : (
            <>
              <div className="form-pair">
                <label>
                  Hourly rate
                  <input
                    type="number"
                    required
                    min="1"
                    max="200"
                    value={form.hourly_rate}
                    onChange={(e) =>
                      update("hourly_rate", Number(e.target.value))
                    }
                  />
                </label>
                <label>
                  Currency
                  <select
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                  >
                    {["USD", "CAD", "GBP", "EUR", "AUD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="chips rate-chips">
                {[12, 15, 20, 25].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={form.hourly_rate === n ? "selected" : ""}
                    onClick={() => update("hourly_rate", n)}
                  >
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: form.currency,
                      maximumFractionDigits: 0,
                    }).format(n)}
                  </button>
                ))}
              </div>
              <label>
                How should sitters reach you?
                <select
                  value={form.contact_method}
                  onChange={(e) => update("contact_method", e.target.value)}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </label>
              <label>
                {form.contact_method === "email"
                  ? "Email address"
                  : "Phone number with country code"}
                <input
                  required
                  type={form.contact_method === "email" ? "email" : "tel"}
                  maxLength={120}
                  value={form.contact_value}
                  onChange={(e) => update("contact_value", e.target.value)}
                  placeholder={
                    form.contact_method === "email"
                      ? "you@example.com"
                      : "+1 555 123 4567"
                  }
                />
              </label>
              <p className="gentle-note">
                <ShieldCheck size={18} />
                Your contact details stay tucked away until someone taps “Reveal
                contact”.
              </p>
              <div className="posting-note">
                <h3>A quick neighborly reminder</h3>
                <p>
                  Take time to meet, check references, and agree on the details
                  before the first sit. Posting means your photo and request
                  will be visible to other visitors.
                </p>
                <Link to="/safety">Read our safety tips</Link>
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert" ref={errorRef} tabIndex={-1}>
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 1 ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
                disabled={processing}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <Link to="/" className="text-button">
                Maybe later
              </Link>
            )}
            <button
              className="button primary"
              type="submit"
              disabled={processing}
            >
              {processing
                ? "Saving a little magic…"
                : step === 3
                  ? id
                    ? "Save changes"
                    : "Post sitting request"
                  : step === 1
                    ? "Next: the little details"
                    : "Next: rate & contact"}
            </button>
          </div>
        </form>
        {step > 1 && (
          <aside className="live-preview">
            <div className="eyebrow">YOUR REQUEST, AT A GLANCE</div>
            <div className="preview-card">
              <Card listing={preview} />
            </div>
            <p>Looking good. Looking like you.</p>
          </aside>
        )}
      </div>
    </div>
  );
}
