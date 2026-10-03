import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buddyCardSchema, type LevelFilter } from "@/lib/buddy";
import type { Database } from "@/lib/database.types";
import { LEVELS, SHOW_ME } from "@/lib/validation";

// One database call per screen (see migration 0009). Each loader validates the JSON.

type Client = SupabaseClient<Database>;

const nearbyViewSchema = z.object({
  active: z.boolean(),
  area: z.string(),
  people: z.array(
    buddyCardSchema.extend({ photo_path: z.string().nullable() }),
  ),
});

export async function loadNearby(supabase: Client, level: LevelFilter) {
  const { data, error } = await supabase.rpc(
    "nearby_view",
    level === "all" ? {} : { p_level: level },
  );
  if (error) throw new Error("Could not load nearby people");
  return nearbyViewSchema.parse(data);
}

const personViewSchema = z.object({
  card: buddyCardSchema,
  match_id: z.string().nullable(),
  request: z
    .object({
      id: z.string(),
      from_me: z.boolean(),
      proposed_at: z.string(),
      note: z.string().nullable(),
    })
    .nullable(),
  last_name: z.string().nullable(),
  photos: z.array(
    z.object({
      path: z.string(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    }),
  ),
});

export type PersonView = z.infer<typeof personViewSchema>;

/** Null when the person is hidden from the viewer (same rule as get_buddy_profile). */
export async function loadPerson(
  supabase: Client,
  id: string,
): Promise<PersonView | null> {
  const { data, error } = await supabase.rpc("person_view", { p_id: id });
  if (error) throw new Error("Could not load profile");
  return data === null ? null : personViewSchema.parse(data);
}

export const threadMessageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  body: z.string(),
  created_at: z.string(),
});

const threadViewSchema = z.object({
  other_id: z.string(),
  first_name: z.string(),
  last_initial: z.string(),
  last_name: z.string().nullable(),
  ended: z.boolean(),
  proposed_at: z.string().nullable(),
  place: z.string().nullable(),
  has_more: z.boolean(),
  messages: z.array(threadMessageSchema),
});

/** Null unless the viewer is one of the two people in the chat. */
export async function loadThread(supabase: Client, matchId: string) {
  const { data, error } = await supabase.rpc("thread_view", {
    p_match: matchId,
  });
  if (error) throw new Error("Could not load chat");
  return data === null ? null : threadViewSchema.parse(data);
}

const personRefSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_initial: z.string(),
});

const chatsViewSchema = z.object({
  incoming: z.array(
    z.object({
      id: z.string(),
      proposed_at: z.string(),
      note: z.string().nullable(),
      person: personRefSchema,
    }),
  ),
  outgoing: z.array(
    z.object({
      id: z.string(),
      proposed_at: z.string(),
      person: personRefSchema,
    }),
  ),
  conversations: z.array(
    z.object({
      match_id: z.string(),
      other_id: z.string(),
      other_first_name: z.string(),
      other_last_initial: z.string(),
      last_name: z.string().nullable(),
      ended: z.boolean(),
      last_body: z.string().nullable(),
      last_at: z.string(),
      unread_count: z.number(),
    }),
  ),
});

export async function loadChats(supabase: Client) {
  const { data, error } = await supabase.rpc("chats_view");
  if (error) throw new Error("Could not load chats");
  return chatsViewSchema.parse(data);
}

const profileViewSchema = z.object({
  first_name: z.string(),
  last_initial: z.string(),
  last_name: z.string().nullable(),
  level: z.enum(LEVELS),
  show_me: z.enum(SHOW_ME),
  is_active: z.boolean(),
  area: z.string(),
  blocked_count: z.number(),
  photos: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      thumb_path: z.string().nullable(),
      position: z.number(),
    }),
  ),
});

export async function loadMyProfile(supabase: Client) {
  const { data, error } = await supabase.rpc("profile_view");
  if (error || data === null) throw new Error("Could not load profile");
  return profileViewSchema.parse(data);
}
