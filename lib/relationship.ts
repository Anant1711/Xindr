import type { PersonView } from "@/lib/views";

export type Relationship =
  | { kind: "none" }
  | { kind: "sent"; requestId: string; proposedAt: string; note: string | null }
  | {
      kind: "received";
      requestId: string;
      proposedAt: string;
      note: string | null;
    }
  | { kind: "matched"; matchId: string };

/** The viewer's relationship with a person: active match, else the latest pending request. */
export function relationshipOf(view: PersonView): Relationship {
  if (view.match_id) return { kind: "matched", matchId: view.match_id };
  if (view.request) {
    const { id, from_me, proposed_at, note } = view.request;
    return {
      kind: from_me ? "sent" : "received",
      requestId: id,
      proposedAt: proposed_at,
      note,
    };
  }
  return { kind: "none" };
}
