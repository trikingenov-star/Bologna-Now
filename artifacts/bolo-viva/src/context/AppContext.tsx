import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Activity } from "@/data/activities";

export interface SavedItem extends Activity {
  userTime?: string;
  order?: number;
}

export interface AITimeBlock {
  period: string;
  startTime: string;
  date?: string;
  items: Array<{ id: string; note?: string }>;
}

export interface AIItinerary {
  vibe: string;
  intro: string;
  totalDuration: string;
  dateRange?: string;
  timeBlocks: AITimeBlock[];
}

interface AppContextValue {
  savedItems: SavedItem[];
  saveItem: (item: Activity) => void;
  removeItem: (id: string) => void;
  updateItemTime: (id: string, time: string) => void;
  reorderItems: (items: SavedItem[]) => void;
  isItemSaved: (id: string) => boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  buildMyDay: () => void;
  // AI plan
  aiPlan: AIItinerary | null;
  saveAiPlan: (plan: AIItinerary) => void;
  clearAiPlan: () => void;
}

const SAVED_KEY = "bolo-saved-items-v1";
const AI_PLAN_KEY = "bolo-ai-plan-v1";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() =>
    loadFromStorage<SavedItem[]>(SAVED_KEY, [])
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<AIItinerary | null>(() =>
    loadFromStorage<AIItinerary | null>(AI_PLAN_KEY, null)
  );

  // Persist savedItems to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems)); } catch {}
  }, [savedItems]);

  // Persist aiPlan to localStorage whenever it changes
  useEffect(() => {
    try {
      if (aiPlan) localStorage.setItem(AI_PLAN_KEY, JSON.stringify(aiPlan));
      else localStorage.removeItem(AI_PLAN_KEY);
    } catch {}
  }, [aiPlan]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const saveItem = useCallback((item: Activity) => {
    setSavedItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, order: prev.length }];
    });
    showToast("Added to itinerary ✨");
  }, [showToast]);

  const removeItem = useCallback((id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItemTime = useCallback((id: string, time: string) => {
    setSavedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, userTime: time } : i))
    );
  }, []);

  const reorderItems = useCallback((items: SavedItem[]) => {
    setSavedItems(items.map((item, idx) => ({ ...item, order: idx })));
  }, []);

  const isItemSaved = useCallback(
    (id: string) => savedItems.some((i) => i.id === id),
    [savedItems]
  );

  const buildMyDay = useCallback(() => {
    const morning = savedItems.filter(
      (i) => i.timeOfDay.includes("Morning") && !i.timeOfDay.includes("Evening")
    );
    const afternoon = savedItems.filter(
      (i) => i.timeOfDay.includes("Afternoon") && !morning.includes(i)
    );
    const evening = savedItems.filter((i) => i.timeOfDay.includes("Evening"));
    const other = savedItems.filter(
      (i) => !morning.includes(i) && !afternoon.includes(i) && !evening.includes(i)
    );
    const ordered = [...morning, ...afternoon, ...evening, ...other];
    reorderItems(ordered);
    showToast("Day organized ✨");
  }, [savedItems, reorderItems, showToast]);

  const saveAiPlan = useCallback((plan: AIItinerary) => {
    setAiPlan(plan);
  }, []);

  const clearAiPlan = useCallback(() => {
    setAiPlan(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        savedItems,
        saveItem,
        removeItem,
        updateItemTime,
        reorderItems,
        isItemSaved,
        toastMessage,
        showToast,
        buildMyDay,
        aiPlan,
        saveAiPlan,
        clearAiPlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
}
