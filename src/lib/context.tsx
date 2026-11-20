import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { data, readLocal, writeLocal, type Listing } from "./data";
interface Store {
  listings: Listing[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  saved: string[];
  toggleSave: (id: string) => void;
  toast: (message: string) => void;
}
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string[]>(() => readLocal("rb-saved", []));
  const [message, setMessage] = useState("");
  async function refresh() {
    setError("");
    try {
      setListings(await data.list());
    } catch {
      setError("We couldn’t load the sitting requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);
  function toggleSave(id: string) {
    try {
      const next = saved.includes(id)
        ? saved.filter((x) => x !== id)
        : [...saved, id];
      writeLocal("rb-saved", next);
      setSaved(next);
    } catch {
      setMessage("Your browser storage is full. Please free up some space.");
    }
  }
  return (
    <Context.Provider
      value={{
        listings,
        loading,
        error,
        refresh,
        saved,
        toggleSave,
        toast: setMessage,
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
