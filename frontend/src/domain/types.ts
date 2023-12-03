export enum ActionType {
  POKER = "POKER",
  POKER_REVEAL = "POKER_REVEAL",
  SIGNAL_ESTIMATE = "SIGNAL_ESTIMATE",
  SIGNAL_SNOOZE = "SIGNAL_SNOOZE",
  SIGNAL_POSTPONE = "SIGNAL_POSTPONE",
  SIGNAL_QUESTIONS = "SIGNAL_QUESTIONS",
  SIGNAL_COFFEE = "SIGNAL_COFFEE",
  SIGNAL_THINKING = "SIGNAL_THINKING",
}

export interface RoomStateFragment {
  type: ActionType;
  user?: string;
  value?: string | number;
}

export enum ConnectionStatus {
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  Error = "Error",
}