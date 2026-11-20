import { beforeEach, describe, expect, it, vi } from "vitest";
const memory = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
});
import { ageLabel, data, isOwner, validLocation } from "./data";
import { sampleListings } from "../../tests/fixtures";
const seed = () => memory.set("rb-listings", JSON.stringify(sampleListings));
beforeEach(() => {
  memory.clear();
  seed();
});
describe("local data adapter", () => {
  it("starts empty without configuration", async () => {
    memory.clear();
    expect(await data.list()).toHaveLength(0);
  });
  it("hides retired demo listings but keeps real ones", async () => {
    memory.set(
      "rb-listings",
      JSON.stringify([
        { ...sampleListings[0], id: "real-1" },
        { ...sampleListings[1], id: "demo-2" },
      ]),
    );
    expect((await data.list()).map((l) => l.id)).toEqual(["real-1"]);
  });
  it("persists creation, ownership, edit, and deletion", async () => {
    const { id: _, created_at: __, ...input } = sampleListings[0];
    const id = await data.save(input);
    expect(isOwner(id)).toBe(true);
    expect(await data.list()).toHaveLength(9);
    await data.save(
      {
        ...input,
        description: "An updated request for a reliable afternoon sitter.",
      },
      id,
    );
    expect((await data.list()).find((l) => l.id === id)?.description).toMatch(
      "updated request",
    );
    await data.remove(id);
    expect((await data.list()).some((l) => l.id === id)).toBe(false);
  });
  it("refuses edits and deletions without the browser ownership token", async () => {
    const { id, created_at: _, ...input } = sampleListings[0];
    await expect(data.save(input, id)).rejects.toThrow("does not own");
    await expect(data.remove(id)).rejects.toThrow("does not own");
  });
  it("saves a report without removing the listing", async () => {
    await data.report("sample-1");
    expect(JSON.parse(memory.get("rb-reports")!)).toContain("sample-1");
    expect(await data.list()).toHaveLength(8);
  });
  it("recovers from malformed stored JSON", async () => {
    memory.set("rb-listings", "broken");
    expect(await data.list()).toHaveLength(0);
  });
});
describe("privacy and presentation helpers", () => {
  it.each([
    "123 Main Street",
    "4 Brooklyn",
    "Oak Road",
    "Apartment 6",
    "42nd Avenue",
    "",
  ])("rejects address-like location %s", (value) =>
    expect(validLocation(value)).toBe(false),
  );
  it.each(["Brooklyn, NY", "Park Slope", "St. Paul, MN", "Austin, TX"])(
    "allows neighborhood or city %s",
    (value) => expect(validLocation(value)).toBe(true),
  );
  it("formats months and years", () => {
    expect(ageLabel(9)).toBe("9 months");
    expect(ageLabel(36)).toBe("3 years");
  });
});
