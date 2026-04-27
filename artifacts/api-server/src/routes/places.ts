import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── In-memory photo cache (24h) ────────────────────────────────────────────
const PHOTO_CACHE_TTL = 24 * 60 * 60 * 1000;
const photoCache = new Map<string, { url: string | null; cachedAt: number }>();

// ── Category → Unsplash fallback queries ──────────────────────────────────
const TYPE_FALLBACK: Record<string, string> = {
  RESTAURANT: "italian trattoria restaurant food Bologna",
  BAR:        "aperitivo cocktail bar Italy",
  EVENT:      "live music concert stage Italy",
  LOCATION:   "Bologna Italy architecture historic",
  ACTIVITY:   "Bologna Italy travel",
  SPORT:      "outdoor sport activity Italy",
  OUTDOOR:    "park nature Bologna Italy",
  FAMILY:     "children playground family fun Italy",
  CULTURE:    "museum art gallery Bologna Italy",
  MUSIC:      "live music concert stage Italy",
  THEATER:    "theater performance stage Italy",
  CINEMA:     "cinema film Italy",
  DANCE:      "dance performance ballet Italy",
  EXHIBITION: "art exhibition gallery museum Italy",
};

// ── Unsplash search (single attempt) ──────────────────────────────────────
async function searchUnsplash(
  query: string,
  accessKey: string
): Promise<string | null> {
  const params = new URLSearchParams({
    query,
    per_page: "1",
    orientation: "landscape",
    content_filter: "high",
  });

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!res.ok) {
    console.error("Unsplash error:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as any;
  return (data.results?.[0]?.urls?.regular as string) ?? null;
}

// ── Main fetch with 3-level fallback ──────────────────────────────────────
// Level 1: original query (e.g. "Osteria dell'Orsa Bologna Italy")
// Level 2: simplified query (e.g. "trattoria restaurant Bologna Italy")
// Level 3: type-based generic (e.g. "italian trattoria restaurant food Bologna")
async function fetchUnsplashPhoto(
  rawQuery: string,
  type: string
): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const normalizedType = type.toUpperCase();

  // Level 1: specific query
  const query1 = rawQuery.includes("Italy") || rawQuery.includes("Bologna")
    ? rawQuery
    : `${rawQuery} Bologna Italy`;
  const result1 = await searchUnsplash(query1, accessKey);
  if (result1) return result1;

  // Level 2: type-based fallback (immediate, no name)
  const fallback = TYPE_FALLBACK[normalizedType] ?? "Bologna Italy travel";
  const result2 = await searchUnsplash(fallback, accessKey);
  if (result2) return result2;

  // Level 3: bare "Bologna Italy"
  return searchUnsplash("Bologna Italy", accessKey);
}

// ── Route: GET /api/places/photo?q=<query>&type=<type> ────────────────────
// type: RESTAURANT | BAR | EVENT | LOCATION | ACTIVITY | SPORT | OUTDOOR etc.
router.get("/places/photo", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const type = ((req.query.type as string | undefined) ?? "ACTIVITY").trim();

  if (!q) {
    res.status(400).json({ error: "Missing query param: q" });
    return;
  }

  const cacheKey = `${type}::${q.toLowerCase()}`;
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < PHOTO_CACHE_TTL) {
    res.json({ photoUrl: cached.url });
    return;
  }

  try {
    const photoUrl = await fetchUnsplashPhoto(q, type);
    photoCache.set(cacheKey, { url: photoUrl, cachedAt: Date.now() });
    res.json({ photoUrl });
  } catch (err) {
    console.error("Photo fetch error:", err);
    photoCache.set(cacheKey, { url: null, cachedAt: Date.now() });
    res.json({ photoUrl: null });
  }
});

export default router;
