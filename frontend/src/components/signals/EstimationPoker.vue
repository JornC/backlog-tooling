<template>
  <div class="button-container">
    <div class="buttons" :class="{ revealed }">
      <poker-button
        v-for="card in cards"
        :user-highlight="isUserSelection(card)"
        @send-action="sendEvent(props.estimateAction, card)"
        :scale="true"
        :value="card"
        :type="props.estimateAction"
        :count="getEventCount(props.estimateAction, card)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";

const props = defineProps<{
  userId: string;
  estimateAction: ActionType;
  roomState: RoomStateFragment[];
  revealed: boolean;
}>();

const cards = [0.5, 1, 2, 3, 5, 8, 13, 20, 40, "inf", "?"];

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

function isUserSelection(value: string | number) {
  return (
    props.roomState
      .filter((v) => v.user === props.userId)
      .filter((v) => v.type === props.estimateAction)
      .filter((v) => v.value === value).length > 0
  );
}

function getEventCount(eventType: ActionType, value: string | number) {
  return props.revealed
    ? props.roomState.filter((v) => v.type === eventType).filter((v) => v.value === value).length
    : props.roomState
        .filter((v) => v.user === props.userId)
        .filter((v) => v.type === eventType)
        .filter((v) => v.value === value).length;
}

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
  padding: 0px var(--spacer);
}
.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 auto;
  gap: var(--spacer);
  padding: 25px;
  border: var(--signal-border-width) var(--signal-border-style) #ddd;
  border-radius: var(--radius);

  &.revealed {
    border: var(--signal-border-width) var(--signal-border-style) var(--brand-color-1);
  }
}
</style>
