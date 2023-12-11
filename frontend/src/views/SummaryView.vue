<template>
  <h1>Session summary</h1>
  <section v-for="itemWithRoom in itemsWithRooms" :key="itemWithRoom.item.code">
    <h3>{{ itemWithRoom.item.title }}</h3>
    <p v-if="!itemWithRoom.item.locked">Discussion on the item remains incomplete.</p>
    <template v-else>
      <p>Dev: {{ formatDevEstimates(itemWithRoom.room) }}</p>
      <p>Test: {{ formatTestEstimates(itemWithRoom.room) }}</p>
    </template>
  </section>
  <button @click="refresh">Refresh</button>
</template>

<script setup lang="ts">
import { ActionType, type RoomStateFragment } from "@/domain/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";
import { computed } from "vue";

const scheduleStore = useScheduleStore();
const socketStore = useSocketStore();

const items = computed(() => scheduleStore.schedule);

function formatEstimates(room: RoomStateFragment[] | undefined, actionType: ActionType): string {
  if (!room) {
    return "None";
  }

  const estimates = room
    .filter((v) => v.type === actionType && v.value !== undefined)
    .map((v) => v.value);

  const countMap = new Map();
  estimates.forEach((value) => {
    const valueStr = String(value);
    countMap.set(valueStr, (countMap.get(valueStr) || 0) + 1);
  });

  return countMap.size === 0
    ? "None"
    : Array.from(countMap.entries())
        .map(([value, count]) => `${count}x ${value}sp`)
        .join(", ");
}

const formatDevEstimates = (room: RoomStateFragment[] | undefined) =>
  formatEstimates(room, ActionType.POKER_DEV_ESTIMATE);
const formatTestEstimates = (room: RoomStateFragment[] | undefined) =>
  formatEstimates(room, ActionType.POKER_TEST_ESTIMATE);

const itemsWithRooms = computed(() =>
  items.value.map((item) => ({
    item,
    room: getRoom(item.code),
  })),
);

function refresh() {
  socketStore.emitNamed("fetch_all_room_state");
}

function getRoom(roomKey: string) {
  return socketStore.getRoomState(roomKey);
}

onMounted(() => refresh());
</script>

<style lang="scss" scoped>
p {
  max-width: 75ch;
}
</style>
