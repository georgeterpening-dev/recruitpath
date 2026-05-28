/**
 * useAthleteProfile — lightweight hook that persists athlete profile data
 * in localStorage so it's accessible across pages (Profile, Dashboard, etc.)
 * without requiring a full DB migration.
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "recruitpath_athlete_profile";

export interface AthleteProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  graduationYear: string;
  gpa: string;
  satScore: string;
  actScore: string;
  intendedMajor: string;
  primarySport: string;
  positions: string;
  jerseyNumber: string;
  height: string;
  weight: string;
  keyStats: string;
  awards: string;
  highlightFilmUrl: string;
  secondaryVideoUrl: string;
  profilePhoto: string | null;
  actionPhoto: string | null;
  twitterHandle: string;
  instagramHandle: string;
  clubTeam: string;
  verticalJump: string;
  approachJump: string;
  ncsaUrl: string;
  hudlUrl: string;
  highSchool: string;
}

const DEFAULT_PROFILE: AthleteProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  zipCode: "",
  graduationYear: "",
  gpa: "",
  satScore: "",
  actScore: "",
  intendedMajor: "",
  primarySport: "",
  positions: "",
  jerseyNumber: "",
  height: "",
  weight: "",
  keyStats: "",
  awards: "",
  highlightFilmUrl: "",
  secondaryVideoUrl: "",
  profilePhoto: null,
  actionPhoto: null,
  twitterHandle: "",
  instagramHandle: "",
  clubTeam: "",
  verticalJump: "",
  approachJump: "",
  ncsaUrl: "",
  hudlUrl: "",
  highSchool: "",
};

function loadFromStorage(): AthleteProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveToStorage(profile: AthleteProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function useAthleteProfile() {
  const [profile, setProfileState] = useState<AthleteProfile>(loadFromStorage);

  const updateProfile = useCallback((updates: Partial<AthleteProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setField = useCallback(
    (field: keyof AthleteProfile, value: string | null) => {
      updateProfile({ [field]: value } as Partial<AthleteProfile>);
    },
    [updateProfile]
  );

  return { profile, updateProfile, setField };
}

/**
 * Read-only helper — reads grad year from localStorage without subscribing
 * to state changes. Useful for components that only need to read once.
 */
export function getStoredGradYear(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.graduationYear || "";
  } catch {
    return "";
  }
}
