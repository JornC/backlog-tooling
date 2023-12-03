export enum ActionType {
  POKER = "POKER",
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

const roomStates = new Map<string, RoomState>();

export const getRoomState = (roomName: string): RoomStateFragment[] | undefined => {
  const room = roomStates.get(roomName);
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
};

export const setRoomStateFragment = (
  roomName: string,
  userId: string,
  fragment: RoomStateFragment,
): void => {
  const roomState = roomStates.get(roomName) || {};

  const userState = roomState[userId] || new Map<ActionType, RoomStateFragment>();

  if (isRoomWideSignal(fragment.type)) {
    handleRoomWideSignal(roomState, userId, fragment);
  } else {
    if (userState.has(fragment.type) && userState.get(fragment.type)?.value === fragment.value) {
      userState.delete(fragment.type);
    } else {
      userState.set(fragment.type, fragment);
    }
  }

  roomState[userId] = userState;
  roomStates.set(roomName, roomState);
};

const handleRoomWideSignal = (
  roomState: RoomState,
  userId: string,
  fragment: RoomStateFragment,
) => {
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
      roomState[userId].set(fragment.type, fragment);
    }
  }
};

export const isRoomWideSignal = (actionType: ActionType): boolean => {
  return actionType === ActionType.POKER_REVEAL;
};

export const removeRoomStateFragment = (
  roomName: string,
  userId: string,
  actionType: ActionType,
): void => {
  const roomState = roomStates.get(roomName);
  if (roomState === undefined) {
    return;
  }

  const userState = roomState ? roomState[userId] : undefined;
  if (userState) {
    userState.delete(actionType);
    if (userState.size === 0) {
      delete roomState[userId];
    }
    roomStates.set(roomName, roomState);
  }
};
export function purgeUser(userId: string) {
  console.log(roomStates);
  roomStates.forEach((roomState) => {
    delete roomState[userId];
  });
}
