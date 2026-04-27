import { Switch, Route, Router as WouterRouter } from "wouter";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { UserProfileProvider, useUserProfile } from "@/context/UserProfileContext";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import AIAssistant from "@/components/AIAssistant";
import ExplorePage from "@/pages/ExplorePage";
import ItineraryPage from "@/pages/ItineraryPage";
import MapsPage from "@/pages/MapsPage";
import SurveyPage from "@/pages/SurveyPage";

function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      aria-label="Toggle language"
      className="fixed top-4 right-4 z-[200] flex items-center gap-1 bg-white border border-border shadow-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:border-primary/40 select-none"
    >
      <span className="text-sm">{lang === "en" ? "🇮🇹" : "🇬🇧"}</span>
      <span>{lang === "en" ? "IT" : "EN"}</span>
    </button>
  );
}

function AppShell() {
  const { profile } = useUserProfile();

  if (!profile.completed) {
    return <SurveyPage />;
  }

  return (
    <>
      <LangToggle />
      <Switch>
        <Route path="/" component={ExplorePage} />
        <Route path="/itinerary" component={ItineraryPage} />
        <Route path="/maps" component={MapsPage} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
      <BottomNav />
      <Toast />
      <AIAssistant />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <UserProfileProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
        </AppProvider>
      </UserProfileProvider>
    </LanguageProvider>
  );
}
