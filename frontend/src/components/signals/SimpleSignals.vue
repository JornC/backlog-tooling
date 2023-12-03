<template>
  <div class="buttons">
    <signal-button
      icon="verified"
      label="Estimate!"
      @send-action="sendEvent(ActionType.SIGNAL_ESTIMATE)"
      :type="ActionType.SIGNAL_ESTIMATE"
      :count="getEventCount(ActionType.SIGNAL_ESTIMATE)" />
    <signal-button
      icon="contact_support"
      label="Questions"
      @send-action="sendEvent(ActionType.SIGNAL_QUESTIONS)"
      :type="ActionType.SIGNAL_QUESTIONS"
      :count="getEventCount(ActionType.SIGNAL_QUESTIONS)" />
    <signal-button
      icon="hourglass_bottom"
      label="Wrap up"
      @send-action="sendEvent(ActionType.SIGNAL_SNOOZE)"
      :type="ActionType.SIGNAL_SNOOZE"
      :count="getEventCount(ActionType.SIGNAL_SNOOZE)" />
    <signal-button
      icon="coffee"
      label="Coffee!"
      @send-action="sendEvent(ActionType.SIGNAL_COFFEE)"
      :type="ActionType.SIGNAL_COFFEE"
      :count="getEventCount(ActionType.SIGNAL_COFFEE)" />
  </div>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";

const props = defineProps<{
  roomState: RoomStateFragment[];
}>();

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

function getEventCount(eventType: ActionType) {
  return props.roomState.filter((v) => v.type === eventType).length;
}

function sendEvent(eventType: ActionType): void {
  const event: RoomStateFragment = {
    type: eventType,
  };

  emit("sendAction", event);
}
</script>

<style lang="scss" scoped>
.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 auto;
  gap: var(--spacer);
}
</style>
