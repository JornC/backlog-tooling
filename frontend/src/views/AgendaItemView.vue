<template>
  <h1>Item: {{ itemTitle }}</h1>
  <div v-for="(count, eventType) in eventCounts" :key="eventType">
    <button @click="sendEvent(eventType)">{{ eventType }}</button>
    <span>{{ count }}</span>
  </div>
</template>

<script setup lang="ts">
import { socketManager } from "@/ws/socketManager";
import { ButtonPressEventType, type ButtonPressEvent } from "@shared/types";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const itemTitle = computed(() => route.params.code);

// Event counter
const eventCounts = ref<{ [key in ButtonPressEventType]?: number }>({});

function sendEvent(eventType: ButtonPressEventType): void {
  const event: ButtonPressEvent = {
    type: eventType,
    value: 5, // You can change this value as needed
  };
  socketManager.emitEvent(event);
  incrementEventCount(eventType);
}

function incrementEventCount(eventType: ButtonPressEventType): void {
  if (!eventCounts.value[eventType]) {
    eventCounts.value[eventType] = 0;
  }
  eventCounts.value[eventType]++;
}

// Listen to WebSocket events
socketManager.onEvent((event: ButtonPressEvent) => {
  incrementEventCount(event.type);
});

watch(
  () => route.params.code,
  (newCode, oldCode) => {
    if (newCode !== oldCode) {
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
