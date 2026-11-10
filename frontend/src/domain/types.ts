export enum ActionType {
  POKER_DEV_ESTIMATE = "POKER_DEV_ESTIMATE",
  POKER_TEST_ESTIMATE = "POKER_TEST_ESTIMATE",
  POKER_REVEAL = "POKER_REVEAL",
  DRUMROLL_RATING = "DRUMROLL_RATING",
}

export type Vibe =
  | "agree"
  | "disagree"
  | "coffee"
  | "confused"
  | "skeptical"
  | "mindblown"
  | "love"
  | "ready";

export interface VibeMeta {
  label: string;
  icon: string;
  /** RGB triple used to tint the ambient room mood. */
  color: [number, number, number];
}

export const VIBE_META: Record<Vibe, VibeMeta> = {
  agree: { label: "Agree", icon: "thumb_up", color: [138, 201, 38] },
  disagree: { label: "Disagree", icon: "thumb_down", color: [255, 89, 94] },
  coffee: { label: "Coffee", icon: "coffee", color: [111, 78, 55] },
  confused: { label: "Confused", icon: "question_mark", color: [106, 76, 147] },
  skeptical: { label: "Skeptical", icon: "sentiment_dissatisfied", color: [240, 147, 43] },
  mindblown: { label: "Mind blown", icon: "auto_awesome", color: [68, 212, 212] },
  love: { label: "Love it", icon: "favorite", color: [255, 77, 141] },
  ready: { label: "Ready to size", icon: "check_circle", color: [25, 130, 196] },
};

export const VIBES: Vibe[] = Object.keys(VIBE_META) as Vibe[];

/** How long a single vibe contributes to the room mood before it fully decays. */
export const MOOD_WINDOW_MS = 25000;

export interface RoomStateFragment {
  type: ActionType;
  user?: string;
  value?: string | number;
  silent?: boolean;
}

export interface ScratchboardState {
  typingUserId: string | undefined;
  text: string;
}

export type DrumrollTier = "fantastic" | "fine" | "meh";

export const DRUMROLL_RATINGS = ["Fantastic", "Fine", "Meh", "Too long", "Drop"];

export interface Drumroll {
  id: string;
  label: string;
  tier: DrumrollTier;
}

export interface VibeSound {
  id: string;
  vibe: Vibe;
  tier: DrumrollTier;
}

export enum ConnectionStatus {
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  Error = "Error",
  PinRequired = "PinRequired",
  SessionEnded = "SessionEnded",
}
