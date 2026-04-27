import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Sparkles, MapPin, Globe } from "lucide-react";
import { UserProfile, useUserProfile } from "@/context/UserProfileContext";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const INTERESTS = [
  { id: "food",      emoji: "🍝", en: "Food & Wine",      it: "Cibo & Vino" },
  { id: "art",       emoji: "🎨", en: "Art & Design",      it: "Arte & Design" },
  { id: "culture",   emoji: "🏛️", en: "History & Culture", it: "Storia & Cultura" },
  { id: "outdoor",   emoji: "🌿", en: "Outdoor",           it: "Outdoor" },
  { id: "sport",     emoji: "🏃", en: "Sport",             it: "Sport" },
  { id: "aperitivi", emoji: "🍷", en: "Aperitivi",         it: "Aperitivi" },
  { id: "events",    emoji: "🎭", en: "Events & Music",    it: "Eventi & Musica" },
  { id: "shopping",  emoji: "🛍️", en: "Shopping",         it: "Shopping" },
  { id: "outofcity", emoji: "🚗", en: "Out the city",      it: "Fuori città" },
];

const TRAVEL_STYLES = [
  { id: "solo", emoji: "🧳", en: "Solo Explorer", it: "Solo Explorer" },
  { id: "couple", emoji: "❤️", en: "With Partner", it: "In Coppia" },
  { id: "friends", emoji: "👥", en: "With Friends", it: "Con Amici" },
  { id: "family", emoji: "👨‍👩‍👧", en: "Family", it: "In Famiglia" },
];

const TIME_PREFS = [
  { id: "morning", emoji: "🌅", en: "Early Bird", it: "Mattiniero" },
  { id: "afternoon", emoji: "☀️", en: "Afternoon Explorer", it: "Esploratore Pomeridiano" },
  { id: "evening", emoji: "🌙", en: "Night Owl", it: "Nottambulo" },
  { id: "all", emoji: "🌟", en: "All Day", it: "Tutto il Giorno" },
];

export default function SurveyPage() {
  const { completeProfile } = useUserProfile();
  const { lang, toggleLang } = useLang();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<UserProfile>>({
    interests: [],
    travelStyle: "",
    timePreference: "all",
    name: "",
  });

  const t = (en: string, it: string) => lang === "it" ? it : en;

  const TOTAL_STEPS = 3;

  const toggleInterest = (id: string) => {
    setDraft((d) => {
      const interests = d.interests ?? [];
      return {
        ...d,
        interests: interests.includes(id)
          ? interests.filter((i) => i !== id)
          : [...interests, id],
      };
    });
  };

  const canNext = () => {
    if (step === 0) return (draft.travelStyle ?? "").length > 0;
    if (step === 1) return (draft.interests?.length ?? 0) > 0;
    if (step === 2) return (draft.timePreference ?? "").length > 0;
    return true;
  };

  const handleFinish = () => {
    completeProfile({
      completed: true,
      name: draft.name ?? "",
      travelStyle: (draft.travelStyle ?? "") as UserProfile["travelStyle"],
      interests: draft.interests ?? [],
      timePreference: (draft.timePreference ?? "all") as UserProfile["timePreference"],
      ageGroup: "",
    });
  };

  const steps = [
    // Step 0 — Travel style + name
    <div key="style" className="space-y-4">
      <h2 className="font-serif text-2xl font-bold text-foreground">
        {t("How are you exploring Bologna?", "Come stai esplorando Bologna?")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("We'll personalize your experience.", "Personalizzeremo la tua esperienza.")}</p>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {TRAVEL_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setDraft((d) => ({ ...d, travelStyle: s.id as UserProfile["travelStyle"] }))}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all",
              draft.travelStyle === s.id
                ? "border-bordeaux bg-bordeaux/5 shadow-sm"
                : "border-border bg-white hover:border-bordeaux/40"
            )}
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className={cn("text-sm font-semibold", draft.travelStyle === s.id ? "text-bordeaux" : "text-foreground")}>
              {lang === "it" ? s.it : s.en}
            </span>
          </button>
        ))}
      </div>
      <div className="pt-1">
        <label className="text-sm text-muted-foreground mb-1.5 block">
          {t("Your name (optional)", "Il tuo nome (opzionale)")}
        </label>
        <input
          type="text"
          placeholder={lang === "it" ? "Come ti chiami?" : "What's your name?"}
          value={draft.name ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-bordeaux/60 transition-colors"
        />
      </div>
    </div>,

    // Step 1 — Interests
    <div key="interests" className="space-y-4">
      <h2 className="font-serif text-2xl font-bold text-foreground">
        {t("What interests you?", "Cosa ti interessa?")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("Select all that apply — filters will adapt.", "Seleziona tutto ciò che ti interessa — i filtri si adatteranno.")}</p>
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        {INTERESTS.map((i) => {
          const selected = (draft.interests ?? []).includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => toggleInterest(i.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left",
                selected
                  ? "border-bordeaux bg-bordeaux/6 shadow-sm"
                  : "border-border bg-white hover:border-bordeaux/40"
              )}
            >
              <span className="text-xl shrink-0">{i.emoji}</span>
              <span className={cn("text-sm font-semibold leading-tight", selected ? "text-bordeaux" : "text-foreground")}>
                {lang === "it" ? i.it : i.en}
              </span>
              {selected && <Check className="w-4 h-4 text-bordeaux ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2 — Time preference
    <div key="time" className="space-y-4">
      <h2 className="font-serif text-2xl font-bold text-foreground">
        {t("When do you prefer to explore?", "Quando preferisci esplorare?")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("We'll prioritize activities for your schedule.", "Daremo priorità alle attività per il tuo orario.")}</p>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {TIME_PREFS.map((tp) => (
          <button
            key={tp.id}
            onClick={() => setDraft((d) => ({ ...d, timePreference: tp.id as UserProfile["timePreference"] }))}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all",
              draft.timePreference === tp.id
                ? "border-bordeaux bg-bordeaux/5 shadow-sm"
                : "border-border bg-white hover:border-bordeaux/40"
            )}
          >
            <span className="text-3xl">{tp.emoji}</span>
            <span className={cn("text-sm font-semibold text-center leading-tight", draft.timePreference === tp.id ? "text-bordeaux" : "text-foreground")}>
              {lang === "it" ? tp.it : tp.en}
            </span>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="pt-12 px-6 pb-6 text-center relative">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="absolute top-12 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border bg-white text-xs font-bold text-foreground hover:border-bordeaux/40 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          {lang === "en" ? "IT" : "EN"}
        </button>
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Bologna Now</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Your smart Bologna guide", "La tua guida smart di Bologna")}</p>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i < step ? "bg-bordeaux" : i === step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {step + 1} / {TOTAL_STEPS}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 py-6 flex gap-3 pb-safe">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl border-2 border-border bg-white text-foreground font-semibold transition-colors hover:border-bordeaux/40"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all",
              canNext()
                ? "bg-primary text-white shadow-md hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            {t("Continue", "Continua")}
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canNext()}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all",
              canNext()
                ? "bg-primary text-white shadow-md hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Sparkles className="w-5 h-5" />
            {t("Explore Bologna!", "Esplora Bologna!")}
          </button>
        )}
      </div>
    </div>
  );
}
