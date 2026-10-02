"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { endConversation, markRead, sendMessage } from "@/app/actions/chat";
import { blockUser } from "@/app/actions/safety";
import { ReportSheet } from "@/components/ReportSheet";
import { ActionSheet } from "@/components/ios/ActionSheet";
import { Avatar } from "@/components/ios/Avatar";
import { Ellipsis, SendIcon } from "@/components/ios/icons";
import { BackButton, IconButton } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { LIMITS } from "@/lib/constants";
import { dayLabel, sameDay, timeLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** Only for my own messages that are not confirmed yet. */
  status?: "sending" | "failed";
};

type Props = {
  matchId: string;
  meId: string;
  other: { id: string; firstName: string; lastInitial: string; name: string };
  plan: string | null;
  ended: boolean;
  initialMessages: Message[];
};

const GROUP_GAP_MS = 5 * 60 * 1000;

function byTime(a: Message, b: Message) {
  return a.created_at.localeCompare(b.created_at);
}

export function Thread({
  matchId,
  meId,
  other,
  plan,
  ended: initiallyEnded,
  initialMessages,
}: Props) {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [ended, setEnded] = useState(initiallyEnded);
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<
    "menu" | "end" | "block" | "report" | null
  >(null);
  const [, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  // Mark as read on open and whenever the thread becomes visible again.
  useEffect(() => {
    markRead(matchId);
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead(matchId);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [matchId]);

  // Live messages and the match ending (Realtime respects RLS).
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const channel = supabase
      .channel(`thread-${matchId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((cur) =>
            cur.some((x) => x.id === m.id) ? cur : [...cur, m].sort(byTime),
          );
          if (m.sender_id !== meId && document.visibilityState === "visible")
            markRead(matchId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          if ((payload.new as { ended_at: string | null }).ended_at)
            setEnded(true);
        },
      );
    const subscribe = () => {
      if (active) channel.subscribe();
    };
    supabase.realtime.setAuth().then(subscribe, subscribe);
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, meId]);

  // Keep the newest message in view unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scroller.current;
    if (el)
      stickToBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function deliver(tempId: string, body: string) {
    const fail = (ended = false) => {
      setMessages((cur) =>
        cur.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
      if (ended) setEnded(true);
    };
    startTransition(async () => {
      let res: Awaited<ReturnType<typeof sendMessage>>;
      try {
        res = await sendMessage(matchId, body);
      } catch {
        // Offline or the request failed: keep the text and offer a retry.
        fail();
        return;
      }
      if (!res.ok) {
        fail(res.ended);
        return;
      }
      const sent = res.message;
      // Realtime may have delivered the real row already; drop the temp either way.
      setMessages((cur) => {
        const rest = cur.filter((m) => m.id !== tempId);
        return rest.some((m) => m.id === sent.id)
          ? rest
          : [...rest, { ...sent, sender_id: meId }].sort(byTime);
      });
    });
  }

  function send() {
    const body = draft.trim();
    if (!body || body.length > LIMITS.message || ended) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    stickToBottom.current = true;
    setMessages((cur) => [
      ...cur,
      {
        id: tempId,
        sender_id: meId,
        body,
        created_at: new Date().toISOString(),
        status: "sending",
      },
    ]);
    setDraft("");
    if (input.current) input.current.style.height = "";
    deliver(tempId, body);
  }

  function retry(m: Message) {
    setMessages((cur) =>
      cur.map((x) => (x.id === m.id ? { ...x, status: "sending" } : x)),
    );
    deliver(m.id, m.body);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const now = new Date();
  const tooLong = draft.trim().length > LIMITS.message;

  return (
    <div className="fixed inset-0 z-10 mx-auto flex max-w-[430px] flex-col bg-white">
      <header className="pt-safe shrink-0 border-b border-separator bg-white">
        <div className="flex h-[60px] items-center gap-3 px-4">
          <BackButton fallbackHref="/chats" label="Back to Chats" />
          <Link
            href={`/people/${other.id}`}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Avatar
              id={other.id}
              firstName={other.firstName}
              lastInitial={other.lastInitial}
              size={36}
            />
            <span className="truncate font-display text-[16px] leading-[18px]">
              {other.name}
            </span>
          </Link>
          <IconButton label="More options" onClick={() => setSheet("menu")}>
            <Ellipsis size={18} />
          </IconButton>
        </div>
        {plan ? (
          <div className="px-4 pb-3">
            <p className="rounded-[14px] bg-accent-tint px-3.5 py-2.5 text-[13.5px] font-semibold text-accent">
              <span className="font-bold">Plan</span> · {plan}
            </p>
          </div>
        ) : null}
      </header>

      <div
        ref={scroller}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${other.name}`}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="mx-auto mt-10 max-w-[260px] text-center text-sub text-secondary">
            Say hello and confirm the plan. First sessions happen at the gym, in
            public.
          </p>
        ) : null}

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const at = new Date(m.created_at);
          const mine = m.sender_id === meId;
          const newDay = !prev || !sameDay(new Date(prev.created_at), at);
          const endOfRun =
            !next ||
            next.sender_id !== m.sender_id ||
            new Date(next.created_at).getTime() - at.getTime() > GROUP_GAP_MS ||
            !sameDay(new Date(next.created_at), at);
          return (
            <div key={m.id}>
              {newDay ? (
                <p className="my-3 text-center text-foot font-bold tracking-[0.6px] text-secondary uppercase">
                  {dayLabel(at, now)}
                </p>
              ) : null}
              <div
                className={`flex flex-col ${mine ? "items-end" : "items-start"} ${endOfRun ? "mb-3" : "mb-1"}`}
              >
                <p
                  className={`max-w-[78%] rounded-[20px] px-3.5 py-2 text-[15.5px] leading-[21px] break-words whitespace-pre-wrap ${
                    mine
                      ? `bg-accent text-white ${endOfRun ? "rounded-br-[6px]" : ""} ${m.status === "sending" ? "opacity-70" : ""}`
                      : `bg-surface text-label ${endOfRun ? "rounded-bl-[6px]" : ""}`
                  }`}
                >
                  {m.body}
                </p>
                {m.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => retry(m)}
                    className="mt-1 min-h-[32px] text-foot font-semibold text-destructive"
                  >
                    Not sent. Tap to retry
                  </button>
                ) : endOfRun ? (
                  <span className="mt-1 px-1 text-[11px] text-secondary">
                    {m.status === "sending" ? "Sending…" : timeLabel(at)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {ended ? (
        <div className="shrink-0 border-t border-separator px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <p className="rounded-[14px] bg-surface px-4 py-3 text-center text-sub font-semibold text-secondary">
            This conversation has ended.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex shrink-0 items-end gap-2.5 border-t border-separator bg-white px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        >
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            id="message"
            ref={input}
            rows={1}
            value={draft}
            placeholder="Message"
            onKeyDown={onKeyDown}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            className={`max-h-[120px] min-h-[44px] flex-1 resize-none rounded-[22px] bg-surface px-4 py-[11px] text-[16px] leading-[22px] outline-none placeholder:text-secondary focus:ring-2 ${
              tooLong ? "ring-2 ring-destructive" : "focus:ring-accent"
            }`}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || tooLong}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-85 disabled:opacity-35"
          >
            <SendIcon />
          </button>
        </form>
      )}
      {tooLong ? (
        <p role="alert" className="sr-only">
          Messages can be up to {LIMITS.message} characters.
        </p>
      ) : null}

      <ActionSheet
        open={sheet === "menu"}
        onClose={() => setSheet(null)}
        actions={[
          ...(ended
            ? []
            : [
                {
                  label: "End conversation",
                  destructive: true,
                  onSelect: () => setSheet("end"),
                },
              ]),
          { label: "Report…", onSelect: () => setSheet("report") },
          {
            label: "Block",
            destructive: true,
            onSelect: () => setSheet("block"),
          },
        ]}
      />
      <ActionSheet
        open={sheet === "end"}
        onClose={() => setSheet(null)}
        title="End this conversation?"
        message="Neither of you will be able to send more messages. You can still read it."
        actions={[
          {
            label: "End conversation",
            destructive: true,
            onSelect: () =>
              startTransition(async () => {
                const res = await endConversation(matchId);
                if (res.ok) setEnded(true);
                else toast.show("Something went wrong. Please try again.");
              }),
          },
        ]}
      />
      <ActionSheet
        open={sheet === "block"}
        onClose={() => setSheet(null)}
        title={`Block ${other.name}?`}
        message="This ends the conversation and you won't see each other in Nearby. They won't be told."
        actions={[
          {
            label: "Block",
            destructive: true,
            onSelect: () =>
              startTransition(async () => {
                const res = await blockUser(other.id);
                // On success the action redirects to Nearby.
                if (!res.ok) toast.show(res.error);
              }),
          },
        ]}
      />
      <ReportSheet
        open={sheet === "report"}
        onClose={() => setSheet(null)}
        personId={other.id}
        name={other.name}
      />
    </div>
  );
}
