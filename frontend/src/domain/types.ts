export enum ActionType {
  POKER = "POKER",
  SIGNAL_ESTIMATE = "SIGNAL_ESTIMATE",
  SIGNAL_SNOOZE = "SIGNAL_SNOOZE",
  SIGNAL_POSTPONE = "SIGNAL_POSTPONE",
  SIGNAL_QUESTIONS = "SIGNAL_QUESTIONS",
  SIGNAL_COFFEE = "SIGNAL_COFFEE",
}

export interface RoomStateFragment {
  type: ActionType;
  value?: string | number;
}

export enum ConnectionStatus {
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  Error = "Error",
}
