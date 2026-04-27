import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, Clock, Lightbulb, Sparkles, MapPin, Star, Calendar, Trash2, ExternalLink } from "lucide-react";
import { Activity, getActivityImage } from "@/data/activities";
import { useAppContext } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface AIDetail {
  description: string;
  localTips: string[];
  bestTime: string;
  duration: string;
}

interface Props {
  item: Activity | null;
  onClose: () => void;
}

function buildGCalUrl(item: Activity): string {
  const base = "https://www.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.whyThisPick + (item.address ? `\n📍 ${item.address}` : ""));
  const location = encodeURIComponent(item.address ?? `${item.title}, Bologna, Italy`);
  let dates = "";
  if (item.eventDate) {
    const d = item.eventDate.replace(/-/g, "");
    if (item.eventTime) {
      const [h, m] = item.eventTime.split(":").map(Number);
      const sh = String(h).padStart(2, "0"), sm = String(m || 0).padStart(2, "0");
      const eh = String(h + 2).padStart(2, "0");
      dates = `${d}T${sh}${sm}00/${d}T${eh}${sm}00`;
    } else { dates = `${d}/${d}`; }
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
    "BEGIN:VEVENT", `UID:${item.id}@boloviva`, `DTSTAMP:${dtstamp}`,
    dtStart, dtEnd,
    `SUMMARY:${item.title}`,
    `DESCRIPTION:${(item.whyThisPick || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${item.address || "Bologna, Italy"}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return "data:text/calendar;charset=utf8," + encodeURIComponent(ics);
}

export default function ActivityDetailModal({ item, onClose }: Props) {
  const { saveItem, removeItem, isItemSaved } = useAppContext();
  const { lang, t } = useLang();
  const [aiDetail, setAiDetail] = useState<AIDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [showCalMenu, setShowCalMenu] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCalMenu) return;
    const handle = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showCalMenu]);

  useEffect(() => {
    if (!item) return;
    setAiDetail(null);

    // Resolve the description and tips for the current language using inline fields
    const resolvedDesc = lang === "en"
      ? (item.descriptionEn || item.description)
      : item.description;
    const resolvedTips = lang === "en"
      ? (item.localTipsEn || item.localTips)
      : item.localTips;

    // Skip AI call if both are available for the current language
    if (resolvedDesc && resolvedTips) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/ai/activity-detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, lang }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.success && data.detail) setAiDetail(data.detail); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item?.id, lang]);

  const isSaved = item ? isItemSaved(item.id) : false;

  // Resolve language-specific description and tips using inline fields
  const displayDescription = item
    ? (lang === "en" ? (item.descriptionEn || item.description) : item.description)
    : undefined;
  const displayLocalTips = item
    ? (lang === "en" ? (item.localTipsEn || item.localTips) : item.localTips)
    : undefined;

  const handleAdd = () => {
    if (!item) return;
    if (isSaved) {
      removeItem(item.id);
      setAdded(false);
    } else {
      saveItem(item);
      setAdded(true);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto"
          >
            <div className="max-w-md mx-auto bg-white rounded-t-3xl border border-border overflow-hidden">
              {/* Image header */}
              <div className="relative h-56">
                <img
                  src={getActivityImage(item)}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />

                <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                  <X className="w-4 h-4 text-foreground" />
                </button>

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {item.type}
                  </span>
                  {item.priceRange && (
                    <span className="bg-white/80 text-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {item.priceRange}
                    </span>
                  )}
                </div>

                {item.rating && (
                  <div className="absolute top-12 left-4 flex items-center gap-1 bg-white/90 text-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {item.rating}
                  </div>
                )}

                <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
                  {item.badges.slice(0, 3).map((b) => (
                    <span key={b} className="bg-black/30 backdrop-blur-sm border border-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">{item.title}</h2>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{item.shortText}</p>

                {/* Description — editorial (hardcoded) or AI-generated */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    {displayDescription ? (
                      <MapPin className="w-4 h-4 text-primary" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {displayDescription ? t("detail.description") : t("detail.ai_description")}
                    </span>
                  </div>

                  {displayDescription ? (
                    <div className="bg-background rounded-2xl p-4 border border-border">
                      <p className="text-foreground/80 text-sm leading-relaxed">{displayDescription}</p>
                    </div>
                  ) : loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div key={i}
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                          className="h-3 bg-muted rounded-full"
                          style={{ width: i === 3 ? "60%" : "100%" }} />
                      ))}
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full" />
                        {t("detail.generating")}
                      </div>
                    </div>
                  ) : aiDetail ? (
                    <div className="bg-background rounded-2xl p-4 border border-border">
                      <p className="text-foreground/80 text-sm leading-relaxed">{aiDetail.description}</p>
                      {aiDetail.duration && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {aiDetail.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-background rounded-2xl p-4 border border-border">
                      <p className="text-foreground/80 text-sm leading-relaxed">{item.whyThisPick}</p>
                    </div>
                  )}
                </div>

                {/* Local Tips — editorial (hardcoded) or AI-generated */}
                {(displayLocalTips || aiDetail?.localTips?.length || loading) ? (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                        {t("detail.local_tips")}
                      </span>
                    </div>
                    {displayLocalTips ? (
                      <div className="flex gap-3 items-start bg-secondary/5 border border-secondary/15 rounded-xl p-3">
                        <span className="text-sm shrink-0">💡</span>
                        <p className="text-foreground/80 text-xs leading-relaxed">{displayLocalTips}</p>
                      </div>
                    ) : loading ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <motion.div key={i}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="h-3 bg-muted rounded-full"
                            style={{ width: i === 2 ? "75%" : "100%" }} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {aiDetail?.localTips.map((tip, i) => (
                          <div key={i} className="flex gap-3 items-start bg-secondary/5 border border-secondary/15 rounded-xl p-3">
                            <span className="text-sm shrink-0">💡</span>
                            <p className="text-foreground/80 text-xs leading-relaxed">{tip}</p>
                          </div>
                        ))}
                        {aiDetail?.bestTime && (
                          <div className="flex gap-3 items-start bg-primary/5 border border-primary/15 rounded-xl p-3">
                            <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-foreground/80 text-xs leading-relaxed">{aiDetail.bestTime}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Add / Remove button + Calendar picker */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={handleAdd}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all",
                      isSaved
                        ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                        : "bg-primary text-white shadow-sm hover:bg-primary/90"
                    )}
                  >
                    {isSaved
                      ? <><Trash2 className="w-5 h-5" />{t("detail.remove_itinerary")}</>
                      : <><Plus className="w-5 h-5" />{t("detail.add_itinerary")}</>}
                  </button>
                  <div ref={calRef} className="relative">
                    <button
                      onClick={() => setShowCalMenu((v) => !v)}
                      title={t("card.calendar")}
                      className={cn(
                        "flex items-center justify-center w-14 h-full rounded-2xl border transition-all",
                        showCalMenu
                          ? "border-primary/40 text-primary bg-primary/5"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showCalMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl border border-border shadow-lg overflow-hidden z-20"
                        >
                          <a
                            href={buildGCalUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowCalMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-background transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</span>
                            {t("card.cal_google")}
                          </a>
                          <div className="h-px bg-border" />
                          <a
                            href={buildICSData(item)}
                            download={`${item.id}.ics`}
                            onClick={() => setShowCalMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-background transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-gradient-to-b from-[#f5f5f5] to-[#e0e0e0] border border-border flex items-center justify-center text-[10px] font-bold shrink-0">🍎</span>
                            {t("card.cal_apple")}
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* TripAdvisor button — shown for restaurants */}
                {item.type === "RESTAURANT" && (
                  <a
                    href={item.tripAdvisorUrl || `https://www.tripadvisor.it/Search?q=${encodeURIComponent(item.title + " Bologna")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-[#00AF87]/30 text-[#007A5E] bg-[#00AF87]/8 hover:bg-[#00AF87]/15 font-semibold text-sm transition-all mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("detail.tripadvisor")}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
