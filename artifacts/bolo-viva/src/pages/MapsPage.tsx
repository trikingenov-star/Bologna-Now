import { motion } from "framer-motion";
import { MapPin, Navigation, Send, Map } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { getCoords } from "@/data/locations";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function buildDirectionsUrl(items: { id: string; title: string }[]) {
  if (items.length === 0) return "";
  const getAddress = (item: { id: string; title: string }) => {
    const coords = getCoords(item.id);
    return coords ? coords.address : `${item.title}, Bologna, Italy`;
  };
  const base = "https://www.google.com/maps/dir/";
  const waypoints = items.map((i) => encodeURIComponent(getAddress(i))).join("/");
  return `${base}${waypoints}`;
}

export default function MapsPage() {
  const { savedItems } = useAppContext();
  const { lang, t } = useLang();

  const directionsUrl = buildDirectionsUrl(savedItems);

  const whatsappText =
    savedItems.length > 0
      ? `🍝 My Bologna itinerary:\n${savedItems.map((i, idx) => `${ALPHABET[idx]}. ${i.title}`).join("\n")}\n\n🗺️ ${directionsUrl}`
      : "Explore Bologna!";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-[100dvh] bg-background pb-32 pt-8 px-4 sm:px-5 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">

        {/* Header */}
        <header className="mb-6 flex items-start justify-between pr-20">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {t("maps.title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {savedItems.length} {t("maps.stops")}
            </p>
          </div>
          {savedItems.length > 0 && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full transition-colors">
              <Send className="w-3.5 h-3.5" />
              {t("maps.share")}
            </a>
          )}
        </header>

        {savedItems.length > 0 ? (
          <>
            {/* Stops list */}
            <div className="bg-white rounded-3xl border border-border card-shadow p-5 mb-5 relative">
              <div className="absolute left-[38px] top-8 bottom-8 w-px bg-border" />
              <div className="space-y-6 relative">
                {savedItems.map((item, idx) => {
                  const coords = getCoords(item.id);
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="flex gap-4 items-start relative z-10">
                      <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shrink-0 font-serif shadow-sm">
                        {ALPHABET[idx % ALPHABET.length]}
                      </div>
                      <div className="pt-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground leading-none mb-1 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {coords ? coords.address.split(",")[0] : item.type}
                          </span>
                          {item.userTime && (
                            <span className="text-xs text-primary font-semibold">{item.userTime}</span>
                          )}
                          {(item.type === "EVENT" || item.isLive) && item.eventDate && (
                            <span className="text-xs text-secondary font-semibold">
                              {new Date(item.eventDate + "T12:00:00").toLocaleDateString(
                                lang === "it" ? "it-IT" : "en-GB",
                                { day: "numeric", month: "short" }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold text-base py-4 rounded-2xl hover:bg-primary/90 transition-colors shadow-sm">
                <Navigation className="w-5 h-5" />
                {t("maps.open_nav")}
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-bold text-base py-4 rounded-2xl hover:bg-green-100 transition-colors border border-green-200">
                <Send className="w-5 h-5" />
                {t("maps.share_whatsapp")}
              </a>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white border border-border card-shadow flex items-center justify-center mb-4">
              <Map className="w-10 h-10 text-primary/30" />
            </div>
            <p className="font-serif text-xl font-bold text-foreground mb-2">
              {lang === "it" ? "Nessuna tappa" : "No stops yet"}
            </p>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              {t("maps.empty")}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
