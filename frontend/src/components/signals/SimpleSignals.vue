<template>
  <div class="buttons">
    <signal-button
      icon="verified"
      label="Ready!"
      sound="/ready.mp3"
      :play-sound="isPlaySounds"
      :user-highlight="isUserSelection(ActionType.SIGNAL_ESTIMATE)"
      @send-action="sendEvent(ActionType.SIGNAL_ESTIMATE)"
      :type="ActionType.SIGNAL_ESTIMATE"
      :count="getEventCount(ActionType.SIGNAL_ESTIMATE)" />
    <signal-button
      icon="contact_support"
      label="Question"
      sound="/ding.mp3"
      :play-sound="isPlaySounds"
      :user-highlight="isUserSelection(ActionType.SIGNAL_QUESTIONS)"
      @send-action="sendEvent(ActionType.SIGNAL_QUESTIONS)"
      :type="ActionType.SIGNAL_QUESTIONS"
      :count="getEventCount(ActionType.SIGNAL_QUESTIONS)" />
    <signal-button
      icon="psychology"
      label="Thinking"
      sound="/minecraft-villager-sound-effect.mp3"
      :play-sound="isPlaySounds"
      :user-highlight="isUserSelection(ActionType.SIGNAL_THINKING)"
      @send-action="sendEvent(ActionType.SIGNAL_THINKING)"
      :type="ActionType.SIGNAL_THINKING"
      :count="getEventCount(ActionType.SIGNAL_THINKING)" />
    <signal-button
      icon="hourglass_bottom"
      label="Wrap up"
      sound="/clock.mp3"
      :play-sound="isPlaySounds"
      :user-highlight="isUserSelection(ActionType.SIGNAL_SNOOZE)"
      @send-action="sendEvent(ActionType.SIGNAL_SNOOZE)"
      :type="ActionType.SIGNAL_SNOOZE"
      :count="getEventCount(ActionType.SIGNAL_SNOOZE)" />
    <signal-button
      icon="coffee"
      label="Coffee!"
      sound="/can-open.mp3"
      :play-sound="isPlaySounds"
      :user-highlight="isUserSelection(ActionType.SIGNAL_COFFEE)"
      @send-action="sendEvent(ActionType.SIGNAL_COFFEE)"
      :type="ActionType.SIGNAL_COFFEE"
      :count="getEventCount(ActionType.SIGNAL_COFFEE)" />
  </div>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";
import { useContextStore } from "@/stores/contextStore";
import { useSocketStore } from "@/ws/socketManager";

const contextStore = useContextStore();
const socketStore = useSocketStore();

const props = defineProps<{
  userId: string;
  roomState: RoomStateFragment[];
}>();

const isPlaySounds = computed(() => contextStore.playSounds && socketStore.playSounds);

const emit = defineEmits<{
  (event: "sendAction", value: RoomStateFragment): void;
}>();

function isUserSelection(type: ActionType) {
  return (
    props.roomState.filter((v) => v.user === props.userId).filter((v) => v.type === type).length > 0
  );
}

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
  gap: var(--spacer);
  margin: 0px var(--spacer);
  padding: 0px var(--spacer);
  justify-content: space-around;
}
</style>
