<template>
  <div class="button-container">
    <h2>Poker</h2>
    <div class="buttons">
      <poker-button
        v-for="card in cards"
        @send-action="sendEvent(ActionType.POKER, card)"
        :value="card"
        :type="ActionType.POKER"
        :count="getEventCount(ActionType.POKER, card)" />
    </div>
    <poker-button
      v-if="totalPokerCount > 0"
      @send-action="sendEvent(ActionType.POKER_REVEAL)"
      :type="ActionType.POKER_REVEAL"
      :label="revealText"
      :count="revealed ? 0 : totalPokerCount" />
  </div>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";

const props = defineProps<{
  userId: string;
  roomState: RoomStateFragment[];
}>();

const cards = [1, 2, 3, 5, 8, 13, 20, 40, "inf"];

const revealed = computed(
  () => props.roomState.filter((v) => v.type === ActionType.POKER_REVEAL).length > 0,
);
const revealText = computed(() =>
  revealed.value
    ? "Hide estimates"
    : "Reveal " + (totalPokerCount.value - userPokerCount.value) + " estimates",
);

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

function getEventCount(eventType: ActionType, value: string | number) {
  return revealed.value
    ? props.roomState.filter((v) => v.type === eventType).filter((v) => v.value === value).length
    : props.roomState
        .filter((v) => v.user === props.userId)
        .filter((v) => v.type === eventType)
        .filter((v) => v.value === value).length;
}

const totalPokerCount = computed(
  () => props.roomState.filter((v) => v.type === ActionType.POKER).length,
);
const userPokerCount = computed(
  () =>
    props.roomState
      .filter((v) => v.user === props.userId)
      .filter((v) => v.type === ActionType.POKER).length,
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
}
</style>
