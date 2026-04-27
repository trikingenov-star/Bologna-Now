import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type TravelStyle = "solo" | "couple" | "friends" | "family" | "";
export type TimePreference = "morning" | "afternoon" | "evening" | "all" | "";

export interface UserProfile {
  completed: boolean;
  name: string;
  travelStyle: TravelStyle;
  interests: string[];
  timePreference: TimePreference;
  ageGroup: string;
}

const DEFAULT_PROFILE: UserProfile = {
  completed: false,
  name: "",
  travelStyle: "",
  interests: [],
  timePreference: "all",
  ageGroup: "",
};

// Filters that appear based on survey interests — aligned with Excel categories
export function getFiltersForProfile(profile: UserProfile): string[] {
  const always = ["For You", "Today"];
  const conditional: Record<string, string[]> = {
    food:      ["Food"],
    art:       ["Art"],
    culture:   ["Culture"],
    outdoor:   ["Outdoor"],
    sport:     ["Sport"],
    aperitivi: ["Aperitivi"],
    events:    ["Events"],
    shopping:  ["Shopping"],
    outofcity: ["OutCity"],
  };

  const extra = new Set<string>();
  for (const interest of profile.interests) {
    for (const filter of conditional[interest] ?? []) {
      extra.add(filter);
    }
  }

  const ORDER = [
    "For You", "Today", "Events", "Art", "Culture", "Food",
    "Outdoor", "Sport", "Aperitivi", "Shopping", "OutCity",
  ];
  const all = [...always, ...extra];
  return ORDER.filter((f) => all.includes(f));
}

interface UserProfileContextValue {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  completeProfile: (p: UserProfile) => void;
  resetProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

const STORAGE_KEY = "bolo-user-profile-v3";

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const completeProfile = useCallback((p: UserProfile) => {
    setProfile({ ...p, completed: true });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, completeProfile, resetProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be within UserProfileProvider");
  return ctx;
}
