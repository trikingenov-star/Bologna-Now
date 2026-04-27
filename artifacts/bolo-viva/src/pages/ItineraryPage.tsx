import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Trash2, Clock, Sparkles, RotateCcw, X,
  GripVertical, CalendarDays, BookmarkCheck,
  FileDown, Pencil, CheckCheck, MapPin, ChevronRight,
} from "lucide-react";
import { useAppContext, SavedItem, AIItinerary, AITimeBlock } from "@/context/AppContext";
import { Activity, getActivityImage } from "@/data/activities";
import { useLang } from "@/context/LanguageContext";
import { getDistanceBetween } from "@/lib/haversine";
import { LOCATION_COORDS } from "@/data/locations";
import { cn } from "@/lib/utils";

// ── Distance connector ────────────────────────────────────────────────────────
function DistanceConnector({ fromId, toId }: { fromId: string; toId: string }) {
  const { t } = useLang();
  const dist = getDistanceBetween(fromId, toId);
  if (!dist) return null;
  return (
    <div className="flex items-center gap-2 py-1 px-4 ml-[60px]">
      <div className="h-px flex-1 bg-border/60 border-dashed border" />
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
        <MapPin className="w-2.5 h-2.5 text-primary/60" />
        {dist.walkMin} min {t("itinerary.walk")} · {dist.km < 1 ? `${Math.round(dist.km * 1000)}m` : `${dist.km}km`}
      </span>
      <div className="h-px flex-1 bg-border/60 border-dashed border" />
    </div>
  );
}

// ── Event date badge ──────────────────────────────────────────────────────────
function EventDateBadge({ item, lang }: { item: SavedItem; lang: string }) {
  // Only show real dates for live API events, not static fictional activities
  if (!item.isLive || !item.eventDate) return null;
  const label = new Date(item.eventDate + "T12:00:00").toLocaleDateString(
    lang === "it" ? "it-IT" : "en-GB",
    { weekday: "short", day: "numeric", month: "short" }
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full">
      <CalendarDays className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ── Sortable item wrapper (drag only from grip handle, not full card) ─────────
function SortableItem({
  item,
  children,
}: {
  item: SavedItem;
  children: (startDrag: (e: React.PointerEvent) => void) => React.ReactNode;
}) {
  const controls = useDragControls();
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    controls.start(e);
  };
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="mb-0">
      {children(startDrag)}
    </Reorder.Item>
  );
}

// ── PDF export ────────────────────────────────────────────────────────────────
function exportToPDF(
  aiPlan: AIItinerary,
  savedItems: SavedItem[],
  lang: string
) {
  const getItem = (id: string) => savedItems.find((i) => i.id === id);

  const todLabel = (p: string) => {
    const map: Record<string, [string, string]> = {
      Morning: ["🌅 Morning", "🌅 Mattina"],
      Afternoon: ["☀️ Afternoon", "☀️ Pomeriggio"],
      Evening: ["🌙 Evening", "🌙 Sera"],
    };
    return (lang === "it" ? map[p]?.[1] : map[p]?.[0]) ?? p;
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d + "T12:00:00").toLocaleDateString(
          lang === "it" ? "it-IT" : "en-GB",
          { weekday: "long", day: "numeric", month: "long" }
        )
      : "";

  const blocksHtml = aiPlan.timeBlocks
    .map((block) => {
      const itemsHtml = block.items
        .map((bi) => {
          const it = getItem(bi.id);
          if (!it) return "";
          const distNext = "";
          return `
          <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;padding:10px;background:#faf8f5;border-radius:10px;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:13px;color:#1a1006;">${it.title}</div>
              ${it.address ? `<div style="font-size:11px;color:#888;margin-top:2px;">${it.address}</div>` : ""}
              ${bi.note ? `<div style="font-size:12px;color:#555;margin-top:4px;font-style:italic;">${bi.note}</div>` : ""}
              ${distNext}
            </div>
          </div>`;
        })
        .join("");

      return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:700;color:#C1432A;">${todLabel(block.period)}</span>
          <span style="font-size:12px;color:#888;">from ${block.startTime}</span>
          ${block.date ? `<span style="font-size:11px;color:#C1432A;border:1px solid #C1432A;border-radius:20px;padding:2px 8px;">${formatDate(block.date)}</span>` : ""}
        </div>
        ${itemsHtml}
      </div>`;
    })
    .join('<hr style="border:none;border-top:1px solid #e8e0d5;margin:16px 0;">');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>Bologna Now — My Bologna Itinerary</title>
  <style>
    body { font-family: Georgia, serif; max-width: 680px; margin: 40px auto; padding: 0 24px; color: #1a1006; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:32px;border-bottom:2px solid #C1432A;padding-bottom:20px;">
    <div style="font-size:28px;font-weight:900;color:#C1432A;font-family:Georgia,serif;">Bologna Now</div>
    <div style="font-size:13px;color:#888;margin-top:4px;">Your smart Bologna itinerary</div>
    <div style="margin-top:12px;">
      <span style="background:#C1432A;color:white;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px;">${aiPlan.vibe}</span>
    </div>
    <p style="font-size:14px;color:#555;font-style:italic;margin-top:10px;">"${aiPlan.intro}"</p>
    <p style="font-size:12px;color:#888;">${aiPlan.totalDuration} total${aiPlan.dateRange ? " · " + aiPlan.dateRange : ""}</p>
  </div>
  ${blocksHtml}
  <div style="text-align:center;margin-top:40px;color:#aaa;font-size:10px;">
    Generated by Bologna Now — Your smart Bologna guide
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.setTimeout(() => win.print(), 500);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ItineraryPage() {
  const {
    savedItems, removeItem, updateItemTime, reorderItems, buildMyDay,
    aiPlan, saveAiPlan, clearAiPlan,
  } = useAppContext();
  const { lang, t } = useLang();

  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // Local editable copy of the AI plan timeBlocks (for in-session edits)
  const [localBlocks, setLocalBlocks] = useState<AITimeBlock[] | null>(null);
  const displayedPlan = localBlocks != null && aiPlan
    ? { ...aiPlan, timeBlocks: localBlocks }
    : aiPlan;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleAiPlan = async () => {
    if (savedItems.length === 0) return;
    setAiLoading(true);
    setAiError(null);

    const itemsForAI = savedItems.map((i) => {
      const coords = LOCATION_COORDS[i.id];
      return {
        id: i.id,
        title: i.title,
        type: i.type,
        timeOfDay: i.timeOfDay,
        eventDate: i.eventDate,
        lat: coords?.lat,
        lng: coords?.lng,
      };
    });

    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsForAI, dateFrom: dateFrom || null, dateTo: dateTo || null, lang }),
      });
      if (!res.ok) {
        setAiError(t("itinerary.error_ai"));
        return;
      }
      const data = await res.json();
      if (data.success && data.itinerary) {
        saveAiPlan(data.itinerary);
        setLocalBlocks(null);
        setIsEditingPlan(false);
      } else {
        setAiError(t("itinerary.error_ai"));
      }
    } catch {
      setAiError(t("itinerary.error_conn"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSavePlan = useCallback(() => {
    if (!aiPlan || !localBlocks) return;
    saveAiPlan({ ...aiPlan, timeBlocks: localBlocks });
    setLocalBlocks(null);
    setIsEditingPlan(false);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2500);
  }, [aiPlan, localBlocks, saveAiPlan]);

  const handleRemoveFromBlock = useCallback((blockIdx: number, itemId: string) => {
    const base = localBlocks ?? aiPlan?.timeBlocks ?? [];
    const updated = base
      .map((b, i) =>
        i === blockIdx ? { ...b, items: b.items.filter((it) => it.id !== itemId) } : b
      )
      .filter((b) => b.items.length > 0);
    setLocalBlocks(updated);
  }, [localBlocks, aiPlan]);

  const getItemById = (id: string) => savedItems.find((i) => i.id === id);

  const TIME_OF_DAY_LABELS: Record<string, string> = {
    Morning: t("time.Morning"),
    Afternoon: t("time.Afternoon"),
    Evening: t("time.Evening"),
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32 pt-8 px-4 sm:px-5 flex flex-col">
      <div className="max-w-md mx-auto w-full">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {t("itinerary.title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {savedItems.length === 0
                ? t("itinerary.empty_subtitle")
                : `${savedItems.length} ${t("itinerary.stops")}`}
            </p>
          </div>
          {savedItems.length > 1 && (
            <button
              onClick={buildMyDay}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("itinerary.organize")}
            </button>
          )}
        </header>

        {/* ── Date picker ────────────────────────────────────── */}
        {savedItems.length > 0 && (
          <div className="mb-4 bg-white rounded-2xl border border-border card-shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {t("itinerary.date_label")}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  {t("itinerary.date_from")}
                </label>
                <input type="date" value={dateFrom} min={todayStr}
                  onChange={(e) => { setDateFrom(e.target.value); if (dateTo && e.target.value > dateTo) setDateTo(""); }}
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  {t("itinerary.date_to")}
                </label>
                <input type="date" value={dateTo} min={dateFrom || todayStr}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* ── AI Plan button row ──────────────────────────────── */}
        {savedItems.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleAiPlan}
              disabled={aiLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold bg-primary text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {t("itinerary.ai_thinking")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t("itinerary.ai_plan")}
                </>
              )}
            </button>
            {aiPlan && (
              <button
                onClick={() => { clearAiPlan(); setLocalBlocks(null); setIsEditingPlan(false); }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold bg-white border border-border text-muted-foreground hover:border-red-300 hover:text-red-400 transition-all"
                title={t("itinerary.clear_plan")}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
            <p className="text-red-600 text-xs text-center">{aiError}</p>
          </div>
        )}

        {/* ── AI Plan result ──────────────────────────────────── */}
        <AnimatePresence>
          {displayedPlan && (
            <motion.div
              key="ai-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-6 bg-white rounded-3xl border border-primary/20 overflow-hidden card-shadow-lg"
            >
              {/* Plan header */}
              <div className="p-4 bg-primary/5 border-b border-primary/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {t("itinerary.plan_header")}
                      </span>
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {displayedPlan.vibe}
                      </span>
                    </div>
                    <p className="text-foreground/80 text-sm italic leading-relaxed">"{displayedPlan.intro}"</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {displayedPlan.totalDuration} {t("itinerary.totali")}
                      {displayedPlan.dateRange && (
                        <span className="ml-2 text-primary font-semibold">· {displayedPlan.dateRange}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Plan action buttons */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {/* Edit / Done toggle */}
                  <button
                    onClick={() => {
                      if (isEditingPlan) {
                        if (localBlocks) handleSavePlan();
                        else setIsEditingPlan(false);
                      } else {
                        setLocalBlocks(aiPlan?.timeBlocks ? [...aiPlan.timeBlocks] : null);
                        setIsEditingPlan(true);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                      isEditingPlan
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-primary border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    {isEditingPlan ? (
                      <><CheckCheck className="w-3 h-3" />{t("itinerary.done_edit")}</>
                    ) : (
                      <><Pencil className="w-3 h-3" />{t("itinerary.edit_plan")}</>
                    )}
                  </button>

                  {/* Export PDF */}
                  <button
                    onClick={() => exportToPDF(displayedPlan, savedItems, lang)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-white border border-border px-3 py-1.5 rounded-full hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <FileDown className="w-3 h-3" />
                    {t("itinerary.export_pdf")}
                  </button>

                  {/* Save confirmation */}
                  {planSaved && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full"
                    >
                      <CheckCheck className="w-3 h-3" />
                      {t("itinerary.saved_plan")}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Time blocks */}
              <div className="divide-y divide-border">
                {displayedPlan.timeBlocks.map((block, blockIdx) => (
                  <div key={`${block.period}-${blockIdx}`} className="p-4">
                    {/* Block header */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {TIME_OF_DAY_LABELS[block.period] ?? block.period}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {block.startTime}
                      </span>
                      {block.date && (
                        <span className="text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full">
                          {new Date(block.date + "T12:00:00").toLocaleDateString(
                            lang === "it" ? "it-IT" : "en-GB",
                            { weekday: "short", day: "numeric", month: "short" }
                          )}
                        </span>
                      )}
                    </div>

                    {/* Items with distance connectors */}
                    <div className="space-y-0">
                      {block.items.map((blockItem, itemIdx) => {
                        const item = getItemById(blockItem.id);
                        if (!item) return null;
                        const nextItem = block.items[itemIdx + 1]
                          ? getItemById(block.items[itemIdx + 1].id)
                          : null;
                        return (
                          <div key={blockItem.id}>
                            <div className="flex gap-3 items-start bg-background rounded-2xl p-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-1">
                                {itemIdx + 1}
                              </div>
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                <img src={getActivityImage(item)} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-semibold leading-tight">{item.title}</p>
                                {item.address && (
                                  <p className="text-muted-foreground text-[11px] mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{item.address}</span>
                                  </p>
                                )}
                                {blockItem.note && (
                                  <p className="text-muted-foreground/80 text-xs mt-0.5 leading-relaxed italic">{blockItem.note}</p>
                                )}
                                {item.isLive && item.eventDate && (
                                  <div className="mt-1.5">
                                    <EventDateBadge item={item} lang={lang} />
                                  </div>
                                )}
                              </div>
                              {isEditingPlan && (
                                <button
                                  onClick={() => handleRemoveFromBlock(blockIdx, blockItem.id)}
                                  className="text-muted-foreground hover:text-red-500 transition-colors p-1 shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {/* Distance to next stop */}
                            {nextItem && (
                              <DistanceConnector fromId={item.id} toId={nextItem.id} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ─────────────────────────────────────── */}
        {savedItems.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-border card-shadow flex items-center justify-center mb-4">
              <BookmarkCheck className="w-8 h-8 text-primary/40" />
            </div>
            <p className="font-serif text-xl font-bold text-foreground mb-2">{t("itinerary.empty_title")}</p>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              {t("itinerary.empty_body")}
            </p>
          </motion.div>
        )}

        {/* ── Saved items list ────────────────────────────────── */}
        {savedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-lg font-bold text-foreground">
                {lang === "it" ? "Le tue tappe" : "Your stops"}
              </h2>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <Reorder.Group
              axis="y"
              values={savedItems}
              onReorder={(items) => reorderItems(items as SavedItem[])}
              className="space-y-0"
            >
              {savedItems.map((item, idx) => (
                <SortableItem key={item.id} item={item}>
                  {(startDrag) => (
                    <div>
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white border border-border rounded-3xl overflow-hidden card-shadow"
                      >
                        <div className="flex gap-3 p-4">
                          <div
                            onPointerDown={startDrag}
                            className="flex items-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 touch-none px-1"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                            <img src={getActivityImage(item)} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground font-semibold text-sm leading-tight truncate">{item.title}</h3>
                            {item.address && (
                              <p className="text-muted-foreground text-[11px] mt-0.5 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{item.address}</span>
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.timeOfDay.map((tod) => (
                                <span key={tod} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {TIME_OF_DAY_LABELS[tod] ?? tod}
                                </span>
                              ))}
                              <EventDateBadge item={item} lang={lang} />
                            </div>
                            <div className="mt-2">
                              {editingTimeId === item.id ? (
                                <input type="time" value={item.userTime || ""}
                                  onChange={(e) => updateItemTime(item.id, e.target.value)}
                                  onBlur={() => setEditingTimeId(null)} autoFocus
                                  className="text-xs bg-background text-primary font-semibold border border-primary/30 rounded-lg px-2 py-1 focus:outline-none" />
                              ) : (
                                <button onClick={() => setEditingTimeId(item.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.userTime
                                    ? <span className="text-primary font-semibold">{item.userTime}</span>
                                    : t("itinerary.add_time")}
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1 self-start shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>

                      {/* Distance to next stop */}
                      {idx < savedItems.length - 1 && (
                        <DistanceConnector fromId={item.id} toId={savedItems[idx + 1].id} />
                      )}
                    </div>
                  )}
                </SortableItem>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>
    </div>
  );
}
