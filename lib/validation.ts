import { z } from "zod";
import { LIMITS } from "@/lib/constants";

export const GENDERS = ["woman", "man", "other"] as const;
export const LEVELS = ["beginner", "intermediate", "pro"] as const;
export const TIMES_OF_DAY = ["morning", "evening"] as const;
export const SHOW_ME = ["women", "men", "anyone"] as const;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

export const aboutYouSchema = z.object({
  firstName: z.string().trim().min(1).max(LIMITS.firstName),
  lastInitial: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/)
    .transform((s) => s.toUpperCase()),
  gender: z.enum(GENDERS),
  level: z.enum(LEVELS),
  areaId: z.number().int().positive(),
  gymId: z.uuid().nullable(),
  timeOfDay: z.enum(TIMES_OF_DAY),
  trainingDays: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
  focus: z
    .string()
    .trim()
    .max(LIMITS.focus)
    .nullable()
    .transform((s) => (s ? s : null)),
});

export const preferencesSchema = z.object({
  showMe: z.enum(SHOW_ME),
  womenOnlyVisibility: z.boolean(),
  confirmed18: z.literal(true),
});

export const profileInputSchema = aboutYouSchema
  .extend(preferencesSchema.shape)
  .refine((v) => !(v.gender === "man" && v.womenOnlyVisibility), {
    path: ["womenOnlyVisibility"],
  });

export type AboutYouInput = z.input<typeof aboutYouSchema>;
export type ProfileInput = z.input<typeof profileInputSchema>;

export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(LIMITS.feedback),
});

export const REPORT_REASONS = [
  "harassment",
  "fake_profile",
  "inappropriate_message",
  "unsafe_behavior",
  "other",
] as const;

export const reportSchema = z.object({
  reportedId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(LIMITS.reportDetails)
    .transform((s) => (s ? s : null)),
});
