export enum ButtonPressEventType {
  Poker = "poker",
  Signal = "signal",
}

export interface ButtonPressEvent {
  type: ButtonPressEventType;
  value: string | number;
}
