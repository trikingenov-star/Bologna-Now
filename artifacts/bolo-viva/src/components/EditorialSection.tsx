import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, BookOpen, Music2 } from "lucide-react";
import { EDITORIAL_CARDS, EditorialCard } from "@/data/editorial";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<EditorialCard["category"], string> = {
  storia: "bg-amber-100 text-amber-800",
  personaggio: "bg-rose-100 text-rose-800",
  luogo: "bg-emerald-100 text-emerald-800",
  curiosità: "bg-violet-100 text-violet-800",
};

function ReadMoreModal({ card, onClose }: { card: EditorialCard; onClose: () => void }) {
  const { lang } = useLang();
  return (
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
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto max-w-md mx-auto"
      >
        <div className="bg-white rounded-t-3xl overflow-hidden border border-border">
          <div className="relative h-48">
            <img src={card.imageUrl} alt={lang === "it" ? card.title.it : card.title.en} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <span className={cn("absolute bottom-4 left-5 text-xs font-bold px-2.5 py-1 rounded-full", CATEGORY_COLORS[card.category])}>
              {lang === "it" ? card.categoryLabel.it : card.categoryLabel.en}
            </span>
          </div>
          <div className="p-5 pb-8">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-1">
              {lang === "it" ? card.title.it : card.title.en}
            </h3>
            <p className="text-muted-foreground text-sm italic mb-4">
              {lang === "it" ? card.subtitle.it : card.subtitle.en}
            </p>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {lang === "it" ? card.body.it : card.body.en}
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {card.readTime} {lang === "it" ? "min di lettura" : "min read"}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function EditorialSection() {
  const { lang, t } = useLang();
  const [activeCard, setActiveCard] = useState<EditorialCard | null>(null);

  return (
    <section className="mt-8 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        <h2 className="font-serif text-lg font-bold text-foreground">{t("editorial.title")}</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2 hide-scrollbar snap-x">
        {EDITORIAL_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveCard(card)}
            className="snap-start shrink-0 w-72 bg-white rounded-2xl border border-border card-shadow overflow-hidden text-left transition-all hover:card-shadow-lg hover:-translate-y-0.5"
          >
            <div className="relative h-36">
              <img
                src={card.imageUrl}
                alt={lang === "it" ? card.title.it : card.title.en}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className={cn("absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full", CATEGORY_COLORS[card.category])}>
                {lang === "it" ? card.categoryLabel.it : card.categoryLabel.en}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-serif font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                {lang === "it" ? card.title.it : card.title.en}
              </h3>
              <p className="text-muted-foreground text-xs italic line-clamp-1">
                {lang === "it" ? card.subtitle.it : card.subtitle.en}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {card.readTime} {t("editorial.min_read")}
                </span>
                <span className="ml-auto text-[10px] font-semibold text-primary">
                  {t("editorial.read_more")} →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <a
        href="https://open.spotify.com/search/canzoni%20storiche%20bologna%20lucio%20dalla%20guccini"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-3 bg-[#0d0d0d] rounded-2xl px-4 py-3.5 hover:bg-[#181818] transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center">
          <Music2 className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">{t("spotify.label")}</p>
          <p className="text-white/50 text-xs leading-tight mt-0.5 line-clamp-1">{t("spotify.desc")}</p>
        </div>
        <span className="flex-shrink-0 text-[#1DB954] text-xs font-bold whitespace-nowrap">{t("spotify.cta")} →</span>
      </a>

      <AnimatePresence>
        {activeCard && <ReadMoreModal card={activeCard} onClose={() => setActiveCard(null)} />}
      </AnimatePresence>
    </section>
  );
}
