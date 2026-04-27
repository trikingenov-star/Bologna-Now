import { Link, useLocation } from "wouter";
import { Compass, BookmarkCheck, Map } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();
  const { savedItems } = useAppContext();
  const { t } = useLang();

  const tabs = [
    { path: "/", icon: Compass, label: t("nav.explore") },
    { path: "/itinerary", icon: BookmarkCheck, label: t("nav.itinerary") },
    { path: "/maps", icon: Map, label: t("nav.maps") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="max-w-md mx-auto relative">
        <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="glass-panel border-t border-border flex justify-around items-center px-6 py-3">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            const count = path === "/itinerary" ? savedItems.length : undefined;
            return (
              <Link key={path} href={path} className="relative group">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all duration-200",
                    isActive ? "bg-bordeaux/10 text-bordeaux" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                    {count !== undefined && count > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-bordeaux text-white text-[9px] font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isActive ? "text-bordeaux" : "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
