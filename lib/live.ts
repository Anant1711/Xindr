"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Live events for the signed-in user, from the database triggers in migration 0011.
// One private channel ("user:<id>", joinable only by that user) shared by the tab bar
// and an open chat. "read" is local: this device just marked a chat read.

export type LiveMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type LiveEvent =
  | { type: "message"; message: LiveMessage }
  | { type: "request"; id: string; status: string }
  | { type: "match"; id: string; ended: boolean }
  | { type: "read" };

type Listener = (event: LiveEvent) => void;

const listeners = new Set<Listener>();
let channel: RealtimeChannel | null = null;
let channelUser: string | null = null;
let stopTimer: ReturnType<typeof setTimeout> | undefined;

function emit(event: LiveEvent) {
  for (const listener of listeners) listener(event);
}

/** Starts (or keeps) the user's channel. Returns a stop function. */
export function startLive(userId: string): () => void {
  clearTimeout(stopTimer);
  if (!channel || channelUser !== userId) {
    stopNow();
    const supabase = createClient();
    channelUser = userId;
    const next = supabase
      .channel(`user:${userId}`, { config: { private: true } })
      .on("broadcast", { event: "message" }, ({ payload }) =>
        emit({ type: "message", message: payload as LiveMessage }),
      )
      .on("broadcast", { event: "request" }, ({ payload }) =>
        emit({
          type: "request",
          ...(payload as { id: string; status: string }),
        }),
      )
      .on("broadcast", { event: "match" }, ({ payload }) =>
        emit({ type: "match", ...(payload as { id: string; ended: boolean }) }),
      );
    channel = next;
    // Private channels need the user's token before joining.
    const join = () => {
      if (channel === next) next.subscribe();
    };
    supabase.realtime.setAuth().then(join, join);
  }
  // Delay the stop so a quick unmount/remount (navigation, dev double effects) keeps the
  // same connection; a real exit (sign out) still closes it.
  return () => {
    clearTimeout(stopTimer);
    stopTimer = setTimeout(stopNow, 2000);
  };
}

function stopNow() {
  if (channel) createClient().removeChannel(channel);
  channel = null;
  channelUser = null;
}

/** Subscribes to live events; returns an unsubscribe function. */
export function onLive(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** This device marked messages read: the badge should drop. */
export function notifyRead() {
  emit({ type: "read" });
}
