<template>
  <div class="button-container">
    <h2>Poker</h2>
    <div class="buttons" :class="{ revealed }">
      <poker-button
        v-for="card in cards"
        :user-highlight="isUserSelection(card)"
        @send-action="sendEvent(ActionType.POKER_ESTIMATE, card)"
        :scale="true"
        :value="card"
        :type="ActionType.POKER_ESTIMATE"
        :count="getEventCount(ActionType.POKER_ESTIMATE, card)" />
    </div>
    <poker-button
      v-if="totalPokerCount > 0"
      class="estimate-button"
      :scale="false"
      @send-action="revealToggle()"
      :type="ActionType.POKER_REVEAL"
      :label="revealText"
      :count="revealed ? 0 : totalPokerCount" />
  </div>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";
import { useContextStore } from "@/stores/contextStore";
import { useSocketStore } from "@/ws/socketManager";

const props = defineProps<{
  userId: string;
  roomState: RoomStateFragment[];
}>();

const contextStore = useContextStore();
const socketStore = useSocketStore();

const cards = [0.5, 1, 2, 3, 5, 8, 13, 20, 40, "inf"];

const isPlaySounds = computed(() => contextStore.playSounds && socketStore.playSounds);

const revealed = computed(
  () => props.roomState.filter((v) => v.type === ActionType.POKER_REVEAL).length > 0,
);
const revealText = computed(() => (revealed.value ? "Hide estimates" : "Reveal estimates"));

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

function revealToggle() {
  if (!revealed.value && isPlaySounds.value) {
    const audioPlayer = new Audio("/angelic.mp3");
    audioPlayer.play();
  }
  sendEvent(ActionType.POKER_REVEAL);
}

function isUserSelection(value: string | number) {
  return (
    props.roomState.filter((v) => v.user === props.userId).filter((v) => v.value === value).length >
    0
  );
}

function getEventCount(eventType: ActionType, value: string | number) {
  return revealed.value
    ? props.roomState.filter((v) => v.type === eventType).filter((v) => v.value === value).length
    : props.roomState
        .filter((v) => v.user === props.userId)
        .filter((v) => v.type === eventType)
        .filter((v) => v.value === value).length;
}

const totalPokerCount = computed(
  () => props.roomState.filter((v) => v.type === ActionType.POKER_ESTIMATE).length,
);

function sendEvent(eventType: ActionType, value?: string | number): void {
  const event: RoomStateFragment = {
    type: eventType,
    value,
  };

  emit("sendAction", event);
}
</script>

<style lang="scss" scoped>
.button-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}
.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 auto;
  gap: var(--spacer);
  padding: 25px;
  border: 10px solid #ddd;
  transition: all 0.15s ease-out;

  &.revealed {
    border: 10px solid var(--brand-color-1);
  }
}

.estimate-button {
  margin: 15px;
}
</style>
