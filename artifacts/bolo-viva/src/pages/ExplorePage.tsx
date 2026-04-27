import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, Settings, Plus, Check, MapPin, Calendar, Sparkles, Star, Trash2 } from "lucide-react";
import { STATIC_ACTIVITIES, Activity, getActivityImage } from "@/data/activities";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import EditorialSection from "@/components/EditorialSection";
import { useAppContext } from "@/context/AppContext";
import { useUserProfile, getFiltersForProfile } from "@/context/UserProfileContext";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL = 300_000;

function timeAgo(date: Date, lang: "en" | "it") {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return lang === "en" ? "just now" : "proprio ora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${lang === "en" ? "ago" : "fa"}`;
  return `${Math.floor(diff / 3600)}h ${lang === "en" ? "ago" : "fa"}`;
}

function buildGCalUrl(item: Activity): string {
  const base = "https://www.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.whyThisPick + (item.address ? `\n📍 ${item.address}` : ""));
  const location = encodeURIComponent(item.address ?? `${item.title}, Bologna, Italy`);

  // Build date/time for GCal
  let dates = "";
  if (item.eventDate) {
    const d = item.eventDate.replace(/-/g, "");
    if (item.eventTime) {
      const [h, m] = item.eventTime.split(":").map(Number);
      const startH = String(h).padStart(2, "0");
      const endH = String(h + 2).padStart(2, "0");
      dates = `${d}T${startH}${m ? String(m).padStart(2, "0") : "00"}00/${d}T${endH}${m ? String(m).padStart(2, "0") : "00"}00`;
    } else {
      dates = `${d}/${d}`;
    }
  }

  return `${base}&text=${title}&details=${details}&location=${location}${dates ? `&dates=${dates}` : ""}`;
}

function buildICSData(item: Activity): string {
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  let dtStart = "", dtEnd = "";
  if (item.eventDate && item.eventTime) {
    const d = item.eventDate.replace(/-/g, "");
    const [h, m] = item.eventTime.split(":").map(Number);
    const sh = String(h).padStart(2, "0"), sm = String(m || 0).padStart(2, "0");
    const eh = String(h + 2).padStart(2, "0");
    dtStart = `DTSTART:${d}T${sh}${sm}00`; dtEnd = `DTEND:${d}T${eh}${sm}00`;
  } else if (item.eventDate) {
    const d = item.eventDate.replace(/-/g, "");
    dtStart = `DTSTART;VALUE=DATE:${d}`; dtEnd = `DTEND;VALUE=DATE:${d}`;
  } else {
    const d = now.toISOString().slice(0, 10).replace(/-/g, "");
    dtStart = `DTSTART;VALUE=DATE:${d}`; dtEnd = `DTEND;VALUE=DATE:${d}`;
  }
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bologna Now//EN",
    "BEGIN:VEVENT",
    `UID:${item.id}@boloviva`,
    `DTSTAMP:${dtstamp}`,
    dtStart, dtEnd,
    `SUMMARY:${item.title}`,
    `DESCRIPTION:${(item.whyThisPick || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${item.address || "Bologna, Italy"}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return "data:text/calendar;charset=utf8," + encodeURIComponent(ics);
}

function CalendarMenu({ item, gcalUrl, t, lang }: {
  item: Activity;
  gcalUrl: string;
  t: (k: string) => string;
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t("card.calendar")}
        className={cn(
          "flex items-center justify-center w-12 py-3 rounded-2xl border transition-all",
          open
            ? "border-primary/40 text-primary bg-primary/5"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
        )}
      >
        <Calendar className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-2xl border border-border shadow-lg overflow-hidden z-20"
          >
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-background transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</span>
              {t("card.cal_google")}
            </a>
            <div className="h-px bg-border" />
            <a
              href={buildICSData(item)}
              download={`${item.id}.ics`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-background transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-gradient-to-b from-[#f5f5f5] to-[#e0e0e0] border border-border flex items-center justify-center text-[10px] font-bold shrink-0">🍎</span>
              {t("card.cal_apple")}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Single carousel card
function ActivityCard({ item, onAdd, isSaved, onDetail }: {
  item: Activity;
  onAdd: () => void;
  isSaved: boolean;
  onDetail: () => void;
}) {
  const { lang, t } = useLang();

  // Only show real dates for live API events (not static fictional activities)
  const dateLabel = item.isLive && item.eventDate
    ? new Date(item.eventDate + "T12:00:00").toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", {
        weekday: "short", day: "numeric", month: "short",
      })
    : null;

  const gcalUrl = buildGCalUrl(item);

  return (
    <div
      className="w-full bg-white rounded-3xl border border-border card-shadow-lg overflow-hidden cursor-pointer"
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative h-56">
        <img src={getActivityImage(item)} alt={item.title} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isLive && (
            <div className="flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded-full">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              <span className="text-white text-[10px] font-bold">LIVE</span>
            </div>
          )}
          {item.viral && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span className="text-white text-[10px] font-bold">{t("card.viral")}</span>
            </div>
          )}
          {item.localSecret && (
            <div className="flex items-center gap-1 bg-emerald-500/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="text-white text-[10px] font-bold">🌿 {t("card.secret")}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {item.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-bold text-foreground">{item.rating}</span>
          </div>
        )}

        {/* Bottom of image */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.badges.slice(0, 3).map((b) => (
              <span key={b} className="bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {b}
              </span>
            ))}
          </div>
          <h2 className="font-serif text-2xl font-bold text-white leading-tight">{item.title}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">{item.shortText}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {item.type}
          </span>
          {item.priceRange && (
            <span className="text-xs font-semibold text-primary">{item.priceRange}</span>
          )}
          {dateLabel && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {dateLabel}{item.eventTime && ` · ${item.eventTime}`}
            </span>
          )}
        </div>

        {/* Why this pick */}
        <div className="bg-background rounded-2xl p-3 mb-4 border border-border/60">
          <p className="text-foreground/70 text-xs leading-relaxed">{item.whyThisPick}</p>
        </div>

        {/* Actions — stop propagation so buttons don't open modal */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onAdd}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all",
              isSaved
                ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                : "bg-primary text-white shadow-sm hover:bg-primary/90"
            )}
          >
            {isSaved
              ? <><Trash2 className="w-4 h-4" />{t("card.remove")}</>
              : <><Plus className="w-4 h-4" />{t("card.add")}</>}
          </button>
          <CalendarMenu item={item} gcalUrl={gcalUrl} t={t} lang={lang} />
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { lang, t } = useLang();
  const { profile, resetProfile } = useUserProfile();
  const { saveItem, removeItem, isItemSaved } = useAppContext();
  const [activeCategory, setActiveCategory] = useState("For You");
  const [liveItems, setLiveItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailItem, setDetailItem] = useState<Activity | null>(null);
  const [dragDir, setDragDir] = useState<1 | -1>(1);
  const isDragging = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchLive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setLiveItems(data.events);
        setLastUpdated(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(() => fetchLive(true), REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchLive]);

  // Merge live + static
  const allItems: Activity[] = (() => {
    const seen = new Set<string>();
    const merged: Activity[] = [];
    for (const item of [...liveItems, ...STATIC_ACTIVITIES]) {
      if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
    }
    return merged;
  })();

  // Profile-based filters
  const availableFilters = getFiltersForProfile(profile);
  const forYouItems = (() => {
    const style = profile.travelStyle;
    const interests = new Set(profile.interests);
    return allItems.filter((item) => {
      if (item.familyOnly && style !== "family") return false;
      if (item.coupleOnly && style !== "couple") return false;
      if (item.noFamily && style === "family") return false;
      if (style === "family") return item.familyOnly || item.category.includes("Food") || item.category.includes("Outdoor") || item.category.includes("Culture");
      if (style === "couple") return item.coupleOnly || item.category.includes("Aperitivi") || item.category.includes("Food") || item.viral;
      if (style === "friends") return item.category.includes("Aperitivi") || item.category.includes("Events") || item.viral || item.category.includes("Shopping");
      if (style === "solo") return item.localSecret || item.category.includes("Art") || item.category.includes("Culture") || item.category.includes("Outdoor");
      return item.category.some((c) => interests.has(c) || interests.has(c.toLowerCase()));
    });
  })();

  // Filter logic — familyOnly/coupleOnly/noFamily based on travel style
  const isFamily = profile.travelStyle === "family";
  const filteredItems = (() => {
    const keep = (item: typeof allItems[number]) => {
      if (item.familyOnly && !isFamily) return false;
      if (item.noFamily && isFamily) return false;
      return true;
    };
    if (activeCategory === "For You") {
      return forYouItems;
    }
    if (activeCategory === "Today") {
      return allItems.filter((item) => {
        if (!keep(item)) return false;
        return item.isLive && item.eventDate === todayStr;
      });
    }
    if (activeCategory === "Events") {
      const today = new Date(todayStr + "T00:00:00");
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 30);
      return allItems.filter((item) => {
        if (!keep(item)) return false;
        if (!item.category.includes("Events")) return false;
        if (item.eventDate) {
          const d = new Date(item.eventDate + "T12:00:00");
          return d >= today && d <= maxDate;
        }
        return true;
      });
    }
    return allItems.filter((item) => {
      if (!keep(item)) return false;
      return item.category.includes(activeCategory);
    });
  })();

  // Reset index when category changes
  useEffect(() => { setCurrentIndex(0); }, [activeCategory]);

  const goNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setDragDir(1);
      setCurrentIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      setDragDir(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 20) {
      isDragging.current = true;
      if (info.offset.x < -60) goNext();
      else if (info.offset.x > 60) goPrev();
      // Reset after the click event would have fired
      setTimeout(() => { isDragging.current = false; }, 100);
    }
  };

  const currentItem = filteredItems[currentIndex] ?? null;

  const catEmoji: Record<string, string> = {
    "For You": "✨", Today: "📅", Events: "🎭", Art: "🎨", Culture: "🏛️",
    Food: "🍝", Outdoor: "🌿", Sport: "🏃",
    Aperitivi: "🍷", Shopping: "🛍️", OutCity: "🚗",
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-28 flex flex-col">
      <div className="max-w-md mx-auto w-full px-4 sm:px-5 pt-8 flex-1 flex flex-col">

        {/* Header */}
        <header className="mb-5 pr-20">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">
                {t("explore.title")}
              </h1>
              {profile.name && (
                <p className="text-muted-foreground text-sm mt-0.5">
                  {t("explore.greet")}, <span className="font-semibold text-primary">{profile.name}</span> 👋
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 mt-1">
              {loading ? (
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <RefreshCw className="w-3 h-3" /> {t("explore.loading")}
                </motion.div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full bg-emerald-500" />
                  {liveItems.length} {t("explore.live")}
                </div>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-muted-foreground">{timeAgo(lastUpdated, lang)}</span>
              )}
            </div>
          </div>

          {/* Profile pill */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 4).map((i) => (
                <span key={i} className="text-xs bg-primary/8 text-primary border border-primary/15 px-2.5 py-1 rounded-full font-medium capitalize">
                  {i}
                </span>
              ))}
            </div>
            <button
              onClick={resetProfile}
              title={t("explore.edit_prefs")}
              className="ml-auto flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-sm hover:bg-primary/90 transition-all shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              {t("explore.edit_prefs")}
            </button>
          </div>
        </header>

        {/* Category filters */}
        <div className="flex overflow-x-auto gap-2 pb-3 -mx-4 px-4 hide-scrollbar snap-x">
          {availableFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "snap-start whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shrink-0",
                activeCategory === cat
                  ? "bg-bordeaux text-white shadow-sm"
                  : "bg-white text-muted-foreground border border-border hover:border-bordeaux/40 hover:text-foreground"
              )}
            >
              <span>{catEmoji[cat]}</span>
              {cat === "For You" ? (lang === "it" ? "Per te" : "For You") : cat}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="flex-1 flex flex-col">
          {filteredItems.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl">{catEmoji[activeCategory] ?? "🔍"}</span>
              </div>
              <p className="font-serif text-lg font-bold text-foreground mb-2">{t("explore.seen_all")}</p>
              <button onClick={() => fetchLive()}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold mt-2 transition-all hover:bg-primary/90">
                <RefreshCw className="w-4 h-4" /> {t("explore.refresh_live")}
              </button>
            </motion.div>
          ) : (
            <>
              {/* Counter */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {currentIndex + 1} {t("explore.of")} {filteredItems.length}
                </span>
                <div className="flex gap-1">
                  {filteredItems.slice(0, Math.min(filteredItems.length, 8)).map((_, i) => (
                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === currentIndex ? "bg-primary w-3" : "bg-border")} />
                  ))}
                  {filteredItems.length > 8 && <span className="text-[10px] text-muted-foreground">+{filteredItems.length - 8}</span>}
                </div>
              </div>

              {/* Card + arrows */}
              <div className="relative">
                {/* Prev arrow */}
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center transition-all",
                    currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next arrow */}
                <button
                  onClick={goNext}
                  disabled={currentIndex === filteredItems.length - 1}
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center transition-all",
                    currentIndex === filteredItems.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Card */}
                <AnimatePresence mode="wait" custom={dragDir}>
                  {currentItem && (
                    <motion.div
                      key={currentItem.id}
                      custom={dragDir}
                      initial={{ opacity: 0, x: dragDir * 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: dragDir * -60 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.3}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing select-none"
                    >
                      <ActivityCard
                        item={currentItem}
                        onAdd={() => isItemSaved(currentItem.id) ? removeItem(currentItem.id) : saveItem(currentItem)}
                        isSaved={isItemSaved(currentItem.id)}
                        onDetail={() => { if (!isDragging.current) setDetailItem(currentItem); }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Editorial section */}
        <EditorialSection />
      </div>

      {/* Detail modal */}
      <ActivityDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
