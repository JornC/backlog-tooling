<template>
  <h1>Item: {{ itemTitle }}</h1>
  <div v-for="eventType in eventTypes" :key="eventType">
    <button @click="sendEvent(eventType)">{{ eventType }}</button>
    <span>{{ eventCounts[eventType] || 0 }}</span>
  </div>
</template>

<script setup lang="ts">
import { ButtonPressEventType, type ButtonPressEvent } from "@/domain/types";
import { socketManager } from "@/ws/socketManager";

const route = useRoute();
const itemTitle = computed(() => route.params.code);

const eventTypes = Object.values(ButtonPressEventType);

const eventCounts = ref(
  eventTypes.reduce(
    (acc, eventType) => {
      acc[eventType] = 0;
      return acc;
    },
    {} as { [key in ButtonPressEventType]: number },
  ),
);

function sendEvent(eventType: ButtonPressEventType): void {
  const event: ButtonPressEvent = {
    type: eventType,
    value: 5,
  };
  socketManager.emitEvent(event);
}

function incrementEventCount(eventType: ButtonPressEventType): void {
  if (eventCounts.value[eventType] === undefined) {
    eventCounts.value[eventType] = 0;
  }

  eventCounts.value[eventType]!++;
}

socketManager.onEvent((event: ButtonPressEvent) => {
  incrementEventCount(event.type);
});

watch(
  () => route.params.code,
  (newCode, oldCode) => {
    if (newCode !== oldCode) {
      Object.values(ButtonPressEventType).forEach((eventType) => {
        eventCounts.value[eventType] = 0;
      });
      socketManager.joinRoom(newCode as string);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  socketManager.leaveRoom();
});
</script>

<style lang="scss" scoped></style>
