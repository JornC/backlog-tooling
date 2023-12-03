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
  for (const userState of Object.values(room)) {
    for (const fragment of userState.values()) {
      fragments.push(fragment);
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

  if (userState.has(fragment.type) && userState.get(fragment.type)?.value === fragment.value) {
    userState.delete(fragment.type);
  } else {
    userState.set(fragment.type, fragment);
  }

  roomState[userId] = userState;
  roomStates.set(roomName, roomState);
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
