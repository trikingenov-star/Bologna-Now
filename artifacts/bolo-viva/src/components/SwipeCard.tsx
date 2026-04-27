import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Plus, Check, MapPin, Calendar, Info } from "lucide-react";
import { Activity, getActivityImage } from "@/data/activities";
import { useAppContext } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  item: Activity;
  isActive: boolean;
  isNext: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onTap?: () => void;
}

export default function SwipeCard({
  item, isActive, isNext, onSwipeRight, onSwipeLeft, onTap,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const { saveItem, isItemSaved } = useAppContext();
  const { t } = useLang();
  const [feedback, setFeedback] = useState<"added" | null>(null);
  const draggedRef = useRef(false);

  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const leftGlow = useTransform(x, [-200, -100, 0], [
    "inset 60px 0 80px -40px rgba(248,113,113,0.3)",
    "inset 30px 0 40px -20px rgba(248,113,113,0.1)",
    "inset 0px 0 0px 0px rgba(0,0,0,0)",
  ]);
  const rightGlow = useTransform(x, [0, 100, 200], [
    "inset 0px 0 0px 0px rgba(0,0,0,0)",
    "inset -30px 0 40px -20px rgba(74,222,128,0.1)",
    "inset -60px 0 80px -40px rgba(74,222,128,0.3)",
  ]);

  const handleDragStart = () => { draggedRef.current = false; };

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8) {
      draggedRef.current = true;
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const shouldSwipe = Math.abs(info.offset.x) > Math.abs(info.offset.y);
    if (!shouldSwipe) return;
    if (info.offset.x > 80 || info.velocity.x > 500) {
      onSwipeRight();
    } else if (info.offset.x < -80 || info.velocity.x < -500) {
      onSwipeLeft();
    }
  };

  const handleClick = () => {
    if (!draggedRef.current && onTap) onTap();
  };

  const isSaved = isItemSaved(item.id);

  const displayImage = getActivityImage(item);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSaved) {
      saveItem(item);
      setFeedback("added");
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const dateLabel = (item.type === "EVENT" || item.isLive) && item.eventDate
    ? new Date(item.eventDate + "T12:00:00").toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate: isActive ? rotate : 0,
        opacity: isActive ? opacity : isNext ? 0.8 : 0.6,
        scale: isNext ? 0.95 : 1,
        zIndex: isActive ? 10 : isNext ? 9 : 8,
        pointerEvents: isActive ? "auto" : "none",
      }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <motion.div
        className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl"
        style={{ boxShadow: isActive ? leftGlow : undefined }}
      >
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{ boxShadow: isActive ? rightGlow : undefined }}
        />

        {/* Image */}
        <img
          src={displayImage}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Live badge */}
        {item.isLive && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-secondary/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-white inline-block"
            />
            <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
          </div>
        )}

        {/* Tap for details hint */}
        {isActive && onTap && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white/70 text-[10px] px-2 py-1 rounded-full">
            <Info className="w-2.5 h-2.5" />
            {t("card.tap_detail")}
          </div>
        )}

        {/* Date badge */}
        {dateLabel && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-white">
            {dateLabel}{item.eventTime && ` · ${item.eventTime}`}
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.badges.map((badge) => (
              <span
                key={badge}
                className="bg-white/10 backdrop-blur-sm border border-white/10 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>

          <h2 className="font-serif text-2xl font-bold text-white leading-tight mb-1">
            {item.title}
          </h2>
          <p className="text-white/70 text-sm mb-4 leading-snug">{item.shortText}</p>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 mb-4">
            <p className="text-white/80 text-xs leading-relaxed">{item.whyThisPick}</p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {item.type}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                isSaved || feedback === "added"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(186,255,41,0.3)]"
              )}
            >
              {isSaved || feedback === "added" ? (
                <>
                  <Check className="w-4 h-4" />
                  {t("card.added")}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("card.add")}
                </>
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleAdd(e); }}
              title={t("card.calendar")}
              className="flex items-center gap-1.5 px-3 py-3 rounded-2xl text-xs text-muted-foreground hover:text-primary bg-white/5 hover:bg-white/10 transition-all"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
