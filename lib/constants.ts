export const APP_NAME = "Gym Buddy";
export const APP_TZ = "Asia/Kolkata";

export const AVATAR_COLORS = [
  "#8E5A73",
  "#3D6B52",
  "#4A5E82",
  "#8A6B3E",
  "#6B5B8A",
  "#5A7A7A",
] as const;

// 0 = Monday ... 6 = Sunday (matches the database).
export const DAY_SHORT = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
export const DAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"] as const;

export const LIMITS = {
  firstName: 30,
  lastName: 40,
  focus: 60,
  note: 200,
  message: 2000,
  reportDetails: 1000,
  feedback: 1000,
  maxPendingOutgoing: 10,
} as const;

export const SAFETY_LINE = "First sessions happen at the gym, in public.";
