import React, { createContext, useContext, useState } from "react";

export type Lang = "en" | "it";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Header / Explore
  "explore.title": { en: "Bologna Now", it: "Bologna Now" },
  "explore.subtitle": { en: "Discover today's mood", it: "Scopri l'umore di oggi" },
  "explore.live": { en: "live", it: "in diretta" },
  "explore.loading": { en: "Loading live…", it: "Caricamento…" },
  "explore.offline": { en: "Offline", it: "Offline" },
  "explore.updated": { en: "Updated", it: "Aggiornato" },
  "explore.seen_all": { en: "You've seen it all!", it: "Hai visto tutto!" },
  "explore.start_over": { en: "Start Over", it: "Ricomincia" },
  "explore.refresh_live": { en: "Refresh", it: "Aggiorna" },
  "explore.edit_prefs": { en: "Edit preferences", it: "Modifica preferenze" },
  "explore.greet": { en: "Hello", it: "Ciao" },
  "explore.your_picks": { en: "Your picks", it: "I tuoi filtri" },
  "explore.of": { en: "of", it: "di" },

  // Spotify
  "spotify.label":  { en: "Bologna Soundtrack", it: "Colonna sonora di Bologna" },
  "spotify.desc":   { en: "Historical songs of the city — from Lucio Dalla to Guccini", it: "Le canzoni storiche della città — da Lucio Dalla a Guccini" },
  "spotify.cta":    { en: "Open playlist", it: "Apri la playlist" },

  // Categories
  "cat.Today": { en: "Today", it: "Oggi" },
  "cat.Events": { en: "Events", it: "Eventi" },
  "cat.Culture": { en: "Culture", it: "Cultura" },
  "cat.Food": { en: "Food", it: "Food" },
  "cat.Outdoor": { en: "Outdoor", it: "Outdoor" },
  "cat.Sport": { en: "Sport", it: "Sport" },
  "cat.Locations": { en: "Locations", it: "Luoghi" },
  "cat.Aperitivi": { en: "Aperitivi", it: "Aperitivi" },

  // Card
  "card.add": { en: "Add", it: "Aggiungi" },
  "card.added": { en: "Added ✓", it: "Aggiunto ✓" },
  "card.remove": { en: "Remove", it: "Rimuovi" },
  "card.calendar": { en: "Add to Calendar", it: "Aggiungi al Calendario" },
  "card.cal_google": { en: "Google Calendar", it: "Google Calendar" },
  "card.cal_apple": { en: "Apple Calendar", it: "Apple Calendar" },
  "card.tap_detail": { en: "Tap for details", it: "Tocca per dettagli" },
  "card.viral": { en: "Viral", it: "Virale" },
  "card.secret": { en: "Local Secret", it: "Segreto Locale" },

  // Detail modal
  "detail.description": { en: "Description", it: "Descrizione" },
  "detail.ai_description": { en: "AI Description", it: "Descrizione AI" },
  "detail.local_tips": { en: "Local Tips", it: "Consigli Locali" },
  "detail.generating": { en: "AI is thinking…", it: "AI sta pensando…" },
  "detail.close": { en: "Close", it: "Chiudi" },
  "detail.add_itinerary": { en: "Add to Itinerary", it: "Aggiungi all'Itinerario" },
  "detail.added": { en: "Added ✓", it: "Aggiunto ✓" },
  "detail.remove_itinerary": { en: "Remove from Itinerary", it: "Rimuovi dall'Itinerario" },
  "detail.tripadvisor": { en: "View on TripAdvisor", it: "Vedi su TripAdvisor" },

  // Itinerary
  "itinerary.title": { en: "My Day", it: "La Mia Giornata" },
  "itinerary.empty_subtitle": { en: "Add places to explore", it: "Aggiungi luoghi da scoprire" },
  "itinerary.stops": { en: "stops planned", it: "tappe pianificate" },
  "itinerary.organize": { en: "Sort by Time", it: "Ordina per Orario" },
  "itinerary.ai_plan": { en: "AI Plan My Day", it: "AI Pianifica la Giornata" },
  "itinerary.ai_thinking": { en: "AI is thinking…", it: "AI sta pensando…" },
  "itinerary.empty_title": { en: "Your day is a blank canvas", it: "La tua giornata è una tela bianca" },
  "itinerary.empty_body": { en: "Browse activities in Explore and add them here. Then let AI build the perfect schedule.", it: "Sfoglia le attività in Esplora e aggiungile qui. Poi lascia che l'AI costruisca il programma perfetto." },
  "itinerary.ai_generated": { en: "AI Generated", it: "Generato dall'AI" },
  "itinerary.totali": { en: "total", it: "totali" },
  "itinerary.dalle": { en: "from", it: "dalle" },
  "itinerary.error_ai": { en: "AI didn't respond. Please try again!", it: "L'AI non ha risposto. Riprova!" },
  "itinerary.error_conn": { en: "Connection error. Check your network.", it: "Errore di connessione. Controlla la rete." },
  "itinerary.add_time": { en: "Add time…", it: "Aggiungi ora..." },
  "itinerary.date_label": { en: "Trip dates (optional)", it: "Date del viaggio (opzionale)" },
  "itinerary.date_from": { en: "From", it: "Da" },
  "itinerary.date_to": { en: "To", it: "A" },
  "itinerary.share": { en: "Share", it: "Condividi" },
  "itinerary.whatsapp": { en: "WhatsApp", it: "WhatsApp" },
  "itinerary.gcal": { en: "Google Calendar", it: "Google Calendar" },
  "itinerary.copy": { en: "Copy link", it: "Copia link" },
  "itinerary.copied": { en: "Copied!", it: "Copiato!" },
  "itinerary.reset": { en: "Reset", it: "Reset" },
  "itinerary.save_plan": { en: "Save Plan", it: "Salva Piano" },
  "itinerary.saved_plan": { en: "Plan saved ✓", it: "Piano salvato ✓" },
  "itinerary.clear_plan": { en: "Clear Plan", it: "Cancella Piano" },
  "itinerary.edit_plan": { en: "Edit", it: "Modifica" },
  "itinerary.done_edit": { en: "Done", it: "Fatto" },
  "itinerary.export_pdf": { en: "Export PDF", it: "Esporta PDF" },
  "itinerary.walk": { en: "walk", it: "a piedi" },
  "itinerary.event_on": { en: "Event on", it: "Evento il" },
  "itinerary.no_plan_yet": { en: "No saved plan yet. Generate one!", it: "Nessun piano salvato. Generane uno!" },
  "itinerary.remove_from_block": { en: "Remove", it: "Rimuovi" },
  "itinerary.plan_header": { en: "Your AI Itinerary", it: "Il Tuo Itinerario AI" },

  // Time of day
  "time.Morning": { en: "🌅 Morning", it: "🌅 Mattina" },
  "time.Afternoon": { en: "☀️ Afternoon", it: "☀️ Pomeriggio" },
  "time.Evening": { en: "🌙 Evening", it: "🌙 Sera" },

  // Maps
  "maps.title": { en: "Map Route", it: "Percorso" },
  "maps.stops": { en: "stops · Bologna", it: "tappe · Bologna" },
  "maps.share": { en: "Share", it: "Condividi" },
  "maps.open_nav": { en: "Open in Maps", it: "Apri in Maps" },
  "maps.share_whatsapp": { en: "Share route on WhatsApp", it: "Condividi su WhatsApp" },
  "maps.empty": { en: "Add places from Explore to generate your route.", it: "Aggiungi luoghi da Esplora per generare il percorso." },

  // Toast
  "toast.added": { en: "Added to itinerary ✨", it: "Aggiunto all'itinerario ✨" },
  "toast.organized": { en: "Day organized ✨", it: "Giornata organizzata ✨" },

  // Editorial
  "editorial.title": { en: "Bologna Stories", it: "Storie di Bologna" },
  "editorial.read_more": { en: "Read more", it: "Leggi di più" },
  "editorial.min_read": { en: "min read", it: "min di lettura" },

  // Nav
  "nav.explore": { en: "Explore", it: "Esplora" },
  "nav.itinerary": { en: "Itinerary", it: "Itinerario" },
  "nav.maps": { en: "Maps", it: "Mappa" },

  // Survey
  "survey.skip": { en: "Skip for now", it: "Salta per ora" },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bolo-lang") as Lang) || "en"; } catch { return "en"; }
  });

  const toggleLang = () => {
    setLang((l) => {
      const next = l === "en" ? "it" : "en";
      try { localStorage.setItem("bolo-lang", next); } catch {}
      return next;
    });
  };

  const t = (key: string): string => translations[key]?.[lang] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
