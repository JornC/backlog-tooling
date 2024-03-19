export enum ActionType {
  POKER_DEV_ESTIMATE = "POKER_DEV_ESTIMATE",
  POKER_TEST_ESTIMATE = "POKER_TEST_ESTIMATE",
  POKER_REVEAL = "POKER_REVEAL",
  SIGNAL_ESTIMATE = "SIGNAL_ESTIMATE",
  SIGNAL_SNOOZE = "SIGNAL_SNOOZE",
  SIGNAL_POSTPONE = "SIGNAL_POSTPONE",
  SIGNAL_QUESTIONS = "SIGNAL_QUESTIONS",
  SIGNAL_COFFEE = "SIGNAL_COFFEE",
}

export interface RoomStateFragment {
  type: ActionType;
  user: string;
  value?: string | number;
}

interface RoomState {
  [userId: string]: Map<ActionType, RoomStateFragment>;
}

export class RoomStateManager {
  private roomStates: Map<string, RoomState>;

  constructor() {
    this.roomStates = new Map<string, RoomState>();
  }

  roomKeys() {
    return this.roomStates.keys();
  }

  getRoomState(roomName: string): RoomStateFragment[] | undefined {
    const room = this.roomStates.get(roomName);
    if (!room) {
      return undefined;
    }

    let fragments: RoomStateFragment[] = [];
    for (const [userId, userState] of Object.entries(room)) {
      for (const fragment of userState.values()) {
        const updatedFragment = { ...fragment, user: userId };
        fragments.push(updatedFragment);
      }
    }
    return fragments;
  }

  setRoomStateFragment(roomName: string, userId: string, fragment: RoomStateFragment): void {
    let roomState = this.roomStates.get(roomName) || {};

    const userState = roomState[userId] || new Map<ActionType, RoomStateFragment>();

    if (this.isRoomWideSignal(fragment.type)) {
      this.handleRoomWideSignal(roomState, userId, fragment);
    } else {
      if (userState.has(fragment.type) && userState.get(fragment.type)?.value === fragment.value) {
        userState.delete(fragment.type);
      } else {
        userState.set(fragment.type, fragment);
      }
    }

    roomState[userId] = userState;
    this.roomStates.set(roomName, roomState);
  }

  private handleRoomWideSignal(roomState: RoomState, userId: string, fragment: RoomStateFragment) {
    if (fragment.type === ActionType.POKER_REVEAL) {
      let isSignalSet = false;

      // Check if any user has the signal set
      for (const userStates of Object.values(roomState)) {
        if (userStates.get(fragment.type)) {
          isSignalSet = true;
          break;
        }
      }

      // Toggle the signal: unset if set, set for current user if not
      if (isSignalSet) {
        Object.keys(roomState).forEach((userKey) => {
          roomState[userKey].delete(fragment.type);
        });
      } else {
        const userRoomState = roomState[userId];
        if (userRoomState) {
          userRoomState.set(fragment.type, fragment);
        }
      }
    }
  }

  private isRoomWideSignal(actionType: ActionType): boolean {
    return actionType === ActionType.POKER_REVEAL;
  }

  removeRoomStateFragment(roomName: string, userId: string, actionType: ActionType): void {
    const roomState = this.roomStates.get(roomName);
    if (!roomState) {
      return;
    }

    const userState = roomState[userId];
    if (userState) {
      userState.delete(actionType);
      if (userState.size === 0) {
        delete roomState[userId];
      }
      this.roomStates.set(roomName, roomState);
    }
  }

  purgeUser(userId: string, lockedRooms: Set<string>) {
    this.roomStates.forEach((roomState, roomName) => {
      if (!lockedRooms.has(roomName)) {
        delete roomState[userId];
      }
    });
  }

  purgeSignal(roomName: string) {
    const room = this.roomStates.get(roomName) || {};
    this.purgeRoom(room, (v) => v.startsWith("SIGNAL_"));
  }

  purgePoker(roomName: string) {
    const room = this.roomStates.get(roomName) || {};
    this.purgeRoom(room, (v) => v.startsWith("POKER_"));
  }

  private purgeRoom(room: RoomState, predicate: (v: ActionType) => boolean) {
    for (const userState of Object.values(room)) {
      for (let key of userState.keys()) {
        if (predicate(key)) userState.delete(key);
      }
    }
  }
}
