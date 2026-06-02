export enum ActionType {
  POKER_DEV_ESTIMATE = "POKER_DEV_ESTIMATE",
  POKER_TEST_ESTIMATE = "POKER_TEST_ESTIMATE",
  POKER_REVEAL = "POKER_REVEAL",
}

export type Vibe =
  | "agree"
  | "disagree"
  | "boring"
  | "confused"
  | "skeptical"
  | "mindblown"
  | "love";

export interface VibeMeta {
  label: string;
  icon: string;
  /** RGB triple used to tint the ambient room mood. */
  color: [number, number, number];
}

export const VIBE_META: Record<Vibe, VibeMeta> = {
  agree: { label: "Agree", icon: "thumb_up", color: [138, 201, 38] },
  disagree: { label: "Disagree", icon: "thumb_down", color: [255, 89, 94] },
  boring: { label: "Boring", icon: "snooze", color: [154, 160, 166] },
  confused: { label: "Confused", icon: "question_mark", color: [106, 76, 147] },
  skeptical: { label: "Skeptical", icon: "sentiment_dissatisfied", color: [240, 147, 43] },
  mindblown: { label: "Mind blown", icon: "auto_awesome", color: [68, 212, 212] },
  love: { label: "Love it", icon: "favorite", color: [255, 77, 141] },
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

export enum ConnectionStatus {
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  Error = "Error",
  PinRequired = "PinRequired",
  SessionEnded = "SessionEnded",
}
