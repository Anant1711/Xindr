import type { GENDERS, LEVELS, SHOW_ME, TIMES_OF_DAY } from "@/lib/validation";

export type Gender = (typeof GENDERS)[number];
export type Level = (typeof LEVELS)[number];
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];
export type ShowMe = (typeof SHOW_ME)[number];

export type Area = { id: number; name: string };
export type Gym = { id: string; name: string; area_id: number };

export type AboutYouDraft = {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  level: Level | null;
  areaId: number | null;
  gymId: string | null;
  timeOfDay: TimeOfDay | null;
  trainingDays: number[];
  focus: string;
};

export type PreferencesDraft = {
  showMe: ShowMe;
  womenOnlyVisibility: boolean;
};

export const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "other", label: "Other" },
] as const;

export const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "pro", label: "Pro" },
] as const;

export const TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
] as const;

export const SHOW_ME_OPTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "anyone", label: "Anyone" },
] as const;
