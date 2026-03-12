export enum ActionType {
  POKER_DEV_ESTIMATE = "POKER_DEV_ESTIMATE",
  POKER_TEST_ESTIMATE = "POKER_TEST_ESTIMATE",
  POKER_REVEAL = "POKER_REVEAL",
  SIGNAL_ESTIMATE = "SIGNAL_ESTIMATE",
  SIGNAL_SNOOZE = "SIGNAL_SNOOZE",
  SIGNAL_QUESTIONS = "SIGNAL_QUESTIONS",
  SIGNAL_COFFEE = "SIGNAL_COFFEE",
  SIGNAL_THINKING = "SIGNAL_THINKING",
  SIGNAL_TAPOUT = "SIGNAL_TAPOUT",
}

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
