import { createClient } from "@supabase/supabase-js";
export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const windows = ["Morning", "Afternoon", "Evening", "Overnight"];
export const allTags = [
  "Loves books",
  "Napper",
  "Creative soul",
  "Outdoor explorer",
  "Pets at home",
  "Allergies",
  "Twins",
];
export interface Listing {
  id: string;
  created_at: string;
  parent_first_name: string;
  child_name: string;
  child_age: number;
  photo_url: string;
  description: string;
  hourly_rate: number;
  currency: string;
  location: string;
  availability: string[];
  tags: string[];
  contact_method: string;
  contact_value: string;
}
export type ListingInput = Omit<Listing, "id" | "created_at">;
export const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
// Listings left over from the removed sample data are hidden for visitors who
// already have them saved in localStorage.
const isRetiredSample = (l: Listing) => l.id.startsWith("demo-");
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
const owners = () => readLocal<Record<string, string>>("rb-owners", {});
export const isOwner = (id: string) => Boolean(owners()[id]);
export const demoMode = !(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
const client = (token?: string) =>
  createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: token ? { headers: { "x-owner-token": token } } : {},
    },
  );
const columns =
  "id,created_at,parent_first_name,child_name,child_age,photo_url,description,hourly_rate,currency,location,availability,tags,contact_method,contact_value";
export interface DataAdapter {
  list(): Promise<Listing[]>;
  save(input: ListingInput, id?: string): Promise<string>;
  remove(id: string): Promise<void>;
  upload(blob: Blob): Promise<string>;
  report(id: string): Promise<void>;
}
const localAdapter: DataAdapter = {
  async list() {
    return readLocal<Listing[]>("rb-listings", []).filter(
      (l) => !isRetiredSample(l),
    );
  },
  async save(input, id) {
    const rows = await this.list();
    const token = id ? owners()[id] : crypto.randomUUID();
    if (id && !token) throw Error("This browser does not own that listing.");
    const key = id || crypto.randomUUID();
    const next = {
      ...input,
      id: key,
      created_at:
        rows.find((r) => r.id === id)?.created_at || new Date().toISOString(),
    };
    writeLocal(
      "rb-listings",
      id ? rows.map((r) => (r.id === id ? next : r)) : [next, ...rows],
    );
    writeLocal("rb-owners", { ...owners(), [key]: token });
    return key;
  },
  async remove(id) {
    if (!isOwner(id)) throw Error("This browser does not own that listing.");
    writeLocal(
      "rb-listings",
      (await this.list()).filter((r) => r.id !== id),
    );
  },
  async upload(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  async report(id) {
    writeLocal("rb-reports", [...readLocal<string[]>("rb-reports", []), id]);
  },
};
const cloudAdapter: DataAdapter = {
  async list() {
    const { data, error } = await client()
      .from("listings")
      .select(columns)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Listing[];
  },
  async save(input, id) {
    const token = id ? owners()[id] : crypto.randomUUID();
    if (!token) throw Error("This browser does not own that listing.");
    const key = id || crypto.randomUUID();
    const db = client(token);
    const { error } = id
      ? await db.from("listings").update(input).eq("id", id)
      : await db
          .from("listings")
          .insert({ ...input, id: key, owner_token: token });
    if (error) throw error;
    writeLocal("rb-owners", { ...owners(), [key]: token });
    return key;
  },
  async remove(id) {
    const token = owners()[id];
    if (!token) throw Error("This browser does not own that listing.");
    const { error } = await client(token)
      .from("listings")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
  async upload(blob) {
    const db = client();
    const path = `${crypto.randomUUID()}.webp`;
    const { error } = await db.storage
      .from("listing-photos")
      .upload(path, blob, { contentType: "image/webp" });
    if (error) throw error;
    return db.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
  },
  async report(id) {
    const { error } = await client()
      .from("listing_reports")
      .insert({ listing_id: id });
    if (error) throw error;
  },
};
export const data: DataAdapter = demoMode ? localAdapter : cloudAdapter;
export const ageLabel = (months: number) =>
  months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`;
export const money = (rate: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(rate);
export const relativeTime = (time: string) => {
  const hrs = Math.max(
    1,
    Math.floor((Date.now() - new Date(time).getTime()) / 3600000),
  );
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};
export const validLocation = (value: string) =>
  value.trim().length > 1 &&
  !/\d|\b(street|avenue|road|lane|drive|boulevard|apt|apartment|suite)\b/i.test(
    value,
  );
