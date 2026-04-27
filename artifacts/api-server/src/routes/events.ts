import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── Types ──────────────────────────────────────────────────────────────────
type TimeOfDay = "Morning" | "Afternoon" | "Evening";

interface LiveEvent {
  id: string;
  title: string;
  type: "EVENT";
  shortText: string;
  whyThisPick: string;
  badges: string[];
  category: string[];
  timeOfDay: TimeOfDay[];
  imageUrl?: string;
  eventDate: string;
  eventTime?: string;
  address?: string;
  sourceUrl?: string;
  isLive: true;
}

// Title-keyword → Unsplash URL (for well-known events)
const TITLE_IMAGE_MAP: Record<string, string> = {
  "International Jazz Week": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
  "Milone": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80",
  "Biro Ghetti Trio": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
  "Teatro Mazzacorati": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80",
  "Jazz": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
  "Bologna Jazz": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
};

// Category-keyword → pool of curated Unsplash images (rotated by event id hash)
const CATEGORY_IMAGE_POOLS: { keywords: string[]; urls: string[] }[] = [
  {
    keywords: ["musica", "jazz", "concert", "music", "live music"],
    urls: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80",
    ],
  },
  {
    keywords: ["teatro", "theatre", "theater", "spettacolo", "opera"],
    urls: [
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80",
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80",
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=80",
    ],
  },
  {
    keywords: ["danza", "dance", "balletto", "ballet"],
    urls: [
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&q=80",
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=1200&q=80",
    ],
  },
  {
    keywords: ["mostra", "arte", "art", "museum", "museo", "galleria", "exhibition", "arti visive"],
    urls: [
      "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&q=80",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4809?w=1200&q=80",
    ],
  },
  {
    keywords: ["cinema", "film", "movie"],
    urls: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80",
    ],
  },
  {
    keywords: ["bambini", "ragazzi", "children", "kids", "family", "famiglia"],
    urls: [
      "https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=1200&q=80",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80",
    ],
  },
  {
    keywords: ["sport", "running", "atletica", "calcio", "football"],
    urls: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
    ],
  },
  {
    keywords: ["conferenza", "talk", "convegno", "lecture", "summit"],
    urls: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80",
    ],
  },
  {
    keywords: ["mercato", "market", "antiquariato", "flea"],
    urls: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80",
    ],
  },
  {
    keywords: ["food", "cibo", "cucina", "gastronomia", "sagra"],
    urls: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80",
    ],
  },
];

// Bologna-themed fallback pool for any event that doesn't match a category
const BOLOGNA_FALLBACKS = [
  "https://images.unsplash.com/photo-1568391611459-8c27fd9f0aa4?w=1200&q=80", // San Petronio
  "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=1200&q=80", // Bologna porticoes
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&q=80", // Bologna rooftops
];

function hashStr(s: string): number {
  return s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function pickLiveImage(title: string, category: string, fallback?: string): string | undefined {
  // 1. Exact/partial title match first
  for (const [key, url] of Object.entries(TITLE_IMAGE_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return url;
  }

  // 2. If the API returned its own image, use it
  if (fallback) return fallback;

  // 3. Category-keyword match
  const needle = (title + " " + category).toLowerCase();
  for (const { keywords, urls } of CATEGORY_IMAGE_POOLS) {
    if (keywords.some(k => needle.includes(k))) {
      return urls[hashStr(title) % urls.length];
    }
  }

  // 4. Bologna fallback (deterministic per title so the same event always gets the same image)
  return BOLOGNA_FALLBACKS[hashStr(title) % BOLOGNA_FALLBACKS.length];
}

// ── Cache ──────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { events: LiveEvent[]; fetchedAt: number } | null = null;

// ── Helpers ────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function hourToTimeOfDay(hour: number): TimeOfDay[] {
  if (hour < 12) return ["Morning"];
  if (hour < 17) return ["Afternoon"];
  return ["Evening"];
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Bologna OpenData (Comune di Bologna – Agenda Cultura) ──────────────────
// Free, no API key required. 28 000+ cultural events from CulturaBologna.it
const BOLOGNA_OD_BASE =
  "https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/eventi-bologna-agenda-cultura/records";

function categoryToBadgeAndCat(cat: string | null): {
  badge: string;
  cats: string[];
} {
  switch ((cat ?? "").toLowerCase()) {
    case "musica":
      return { badge: "🎵 Musica", cats: ["Events", "Culture"] };
    case "spettacoli":
      return { badge: "🎭 Spettacolo", cats: ["Events", "Culture"] };
    case "mostre":
    case "arti visive":
      return { badge: "🖼️ Mostra", cats: ["Events", "Culture"] };
    case "cinema":
      return { badge: "🎬 Cinema", cats: ["Events", "Culture"] };
    case "danza":
      return { badge: "💃 Danza", cats: ["Events", "Culture"] };
    case "teatro":
      return { badge: "🎭 Teatro", cats: ["Events", "Culture"] };
    case "sport":
      return { badge: "⚽ Sport", cats: ["Events", "Outdoor"] };
    case "bambini":
    case "ragazzi":
      return { badge: "👶 Bambini", cats: ["Events", "Family"] };
    case "conferenze":
    case "convegni":
      return { badge: "🎤 Talk", cats: ["Events", "Culture"] };
    default:
      return { badge: "📅 Evento", cats: ["Events"] };
  }
}

async function fetchBolognaOpenData(): Promise<LiveEvent[]> {
  const today = todayStr();
  const in30days = addDays(30);

  const params = new URLSearchParams({
    limit: "50",
    where: `start>='${today}' AND start<='${in30days}' AND online='NO'`,
    order_by: "start asc",
    select: "id,title,description,url,address,categories_1,start,imageurl,photo,image_url",
  });

  const res = await fetch(`${BOLOGNA_OD_BASE}?${params}`);
  if (!res.ok) throw new Error(`BolognaOD ${res.status}`);

  const data = (await res.json()) as any;
  const records: any[] = data.results ?? [];

  return records
    .filter((r: any) => r.title && r.start)
    .map((r: any): LiveEvent => {
      const { badge, cats } = categoryToBadgeAndCat(r.categories_1);
      const desc: string = r.description ?? "";
      const shortText = truncate(
        desc.replace(/\n/g, " ").trim() || r.categories_1 || "Evento a Bologna",
        100
      );
      const why = truncate(
        desc.replace(/\n/g, " ").trim() ||
          `${r.title} — un evento da non perdere a Bologna.`,
        200
      );

      // Try to get image from API fields, with category-based matching as fallback
      const apiImg: string | undefined =
        r.imageurl ?? r.image_url ?? r.photo ?? undefined;
      const imageUrl = pickLiveImage(r.title ?? "", r.categories_1 ?? "", apiImg);

      return {
        id: `bod-${r.id}`,
        title: truncate(r.title, 60),
        type: "EVENT",
        shortText,
        whyThisPick: why,
        badges: ["📍 Bologna", badge],
        category: r.start === today ? [...cats, "Today"] : cats,
        timeOfDay: ["Evening"],
        imageUrl,
        eventDate: r.start,
        address: r.address ? truncate(r.address, 80) : undefined,
        sourceUrl: r.url ?? undefined,
        isLive: true,
      };
    });
}

// ── Eventbrite ─────────────────────────────────────────────────────────────
// Note: Eventbrite deprecated public event search for standard API keys.
// Kept here as a no-op stub in case the key gains search permissions.
async function fetchEventbrite(): Promise<LiveEvent[]> {
  return [];
}

// ── Ticketmaster ───────────────────────────────────────────────────────────
async function fetchTicketmaster(): Promise<LiveEvent[]> {
  const apikey = process.env.TICKETMASTER_API_KEY;
  if (!apikey) return [];

  const params = new URLSearchParams({
    apikey,
    city: "Bologna",
    countryCode: "IT",
    size: "30",
    sort: "date,asc",
  });

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
  );
  if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);

  const data = (await res.json()) as any;
  const events: any[] = data._embedded?.events ?? [];

  return events.map((e: any): LiveEvent => {
    const startDate: string = e.dates?.start?.localDate ?? todayStr();
    const startTime: string = e.dates?.start?.localTime?.slice(0, 5) ?? "";
    const hour = parseInt(startTime.split(":")[0] ?? "20");
    const name: string = e.name ?? "Bologna Event";
    const venue: string = e._embedded?.venues?.[0]?.name ?? "";
    const address: string = [venue, e._embedded?.venues?.[0]?.city?.name]
      .filter(Boolean)
      .join(", ");

    const genres: string[] = [
      e.classifications?.[0]?.segment?.name,
      e.classifications?.[0]?.genre?.name,
    ].filter(Boolean);

    const images: any[] = e.images ?? [];
    const rawImg: string | undefined =
      images.find((i: any) => i.ratio === "16_9" && i.width > 500)?.url ??
      images[0]?.url;
    const img = pickLiveImage(name, genres.join(" "), rawImg);

    const badge = genres[0] ? `🎭 ${genres[0]}` : "🎟️ Event";

    return {
      id: `tm-${e.id}`,
      title: truncate(name, 60),
      type: "EVENT",
      shortText: truncate(
        `${genres.join(" · ")} in ${venue || "Bologna"}`,
        80
      ),
      whyThisPick: truncate(
        `${name} — live in Bologna at ${venue || "a Bologna venue"}. Don't miss it.`,
        200
      ),
      badges: ["📅 Live", badge],
      category: startDate === todayStr() ? ["Events", "Today"] : ["Events"],
      timeOfDay: hourToTimeOfDay(hour),
      imageUrl: img,
      eventDate: startDate,
      eventTime: startTime || undefined,
      address: address || undefined,
      isLive: true,
    };
  });
}

// ── Static fallback ────────────────────────────────────────────────────────
function staticFallback(): LiveEvent[] {
  const today = todayStr();
  const tomorrow = addDays(1);
  return [
    {
      id: "live-sagra-tortellini",
      title: "Sagra del Tortellino",
      type: "EVENT",
      shortText: "Annual tortellino festival in the city center.",
      whyThisPick:
        "Locals queue for hours for a taste of the gold standard. Handmade tortellini in brodo prepared by Bolognese nonnas.",
      badges: ["🍝 Food vibes", "🌅 Morning"],
      category: ["Now", "Food & Vibe", "Today"],
      timeOfDay: ["Morning", "Afternoon"],
      eventDate: today,
      eventTime: "10:00",
      isLive: true,
    },
    {
      id: "live-cinema-piazza",
      title: "Cinema in Piazza Maggiore",
      type: "EVENT",
      shortText: "Open-air cinema under the stars.",
      whyThisPick:
        "Bologna's legendary summer tradition: free open-air cinema in Europe's largest piazza. Bring a blanket and show up early.",
      badges: ["🎬 Culture", "🌙 Evening"],
      category: ["Today", "Culture"],
      timeOfDay: ["Evening"],
      eventDate: today,
      eventTime: "21:30",
      isLive: true,
    },
    {
      id: "live-mercato-antiquariato",
      title: "Mercato dell'Antiquariato",
      type: "EVENT",
      shortText: "Antique market in the historic center.",
      whyThisPick:
        "Every first weekend of the month, Piazza Santo Stefano transforms into a treasure hunt of vintage finds.",
      badges: ["🪙 Culture", "☀️ Afternoon"],
      category: ["Now", "Culture", "Outdoor"],
      timeOfDay: ["Morning", "Afternoon"],
      eventDate: tomorrow,
      eventTime: "09:00",
      isLive: true,
    },
  ];
}

// ── Deduplication (by normalised title) ────────────────────────────────────
function deduplicateEvents(events: LiveEvent[]): LiveEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.title.toLowerCase().replace(/\s+/g, "").slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Fetch & merge ──────────────────────────────────────────────────────────
async function getLiveEvents(): Promise<LiveEvent[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.events;
  }

  const results = await Promise.allSettled([
    fetchEventbrite(),
    fetchTicketmaster(),
    fetchBolognaOpenData(),
  ]);

  const eb = results[0].status === "fulfilled" ? results[0].value : [];
  const tm = results[1].status === "fulfilled" ? results[1].value : [];
  const bod = results[2].status === "fulfilled" ? results[2].value : [];

  if (results[0].status === "rejected") {
    console.error(
      "Eventbrite error:",
      (results[0] as PromiseRejectedResult).reason
    );
  }
  if (results[1].status === "rejected") {
    console.error(
      "Ticketmaster error:",
      (results[1] as PromiseRejectedResult).reason
    );
  }
  if (results[2].status === "rejected") {
    console.error(
      "Bologna OpenData error:",
      (results[2] as PromiseRejectedResult).reason
    );
  }

  // Ticketmaster first (has richer data: images, times), then Bologna OD
  const merged = deduplicateEvents([...eb, ...tm, ...bod]);
  const events = merged.length > 0 ? merged : staticFallback();

  events.sort((a, b) => (a.eventDate > b.eventDate ? 1 : -1));
  const top30 = events.slice(0, 30);

  cache = { events: top30, fetchedAt: Date.now() };
  return top30;
}

// ── Route ──────────────────────────────────────────────────────────────────
router.get("/events", async (_req, res) => {
  try {
    const events = await getLiveEvents();
    res.json({ success: true, events, source: "live" });
  } catch (err) {
    console.error("Events route error:", err);
    res.json({ success: true, events: staticFallback(), source: "fallback" });
  }
});

export default router;
