<template>
  <main>
    <section class="moderator">
      <template v-if="moderator">
        <span class="name">{{ moderator }}</span> is moderating
        <button
          class="moderate-button"
          v-if="socketStore.isModerator && !contextStore.isModerating"
          @click="openModeration">
          Mod panel
        </button>
      </template>
      <template v-else>
        <span>No moderator</span>
        <button class="moderate-button" @click="openModeration">Volunteer</button>
      </template>
    </section>
    <section class="title">
      <h1>
        Current item
        <a :href="aeriusItemHref" v-if="isAeriusItem" target="_blank" class="item-title">
          {{ aeriusItemTitle }}
        </a>
        <span v-else class="item-title">{{ aeriusItemTitle }}</span>
      </h1>
      <a v-if="isAeriusItem" :href="aeriusItemHref" target="_blank">
        <div class="anchor-style">{{ aeriusItemHref }}</div>
        <span class="no-style">(opens new window)</span></a
      >
    </section>

    <div class="actions">
      <simple-signals
        v-if="currentRoomState && socketStore.userId"
        :user-id="socketStore.userId"
        :roomState="currentRoomState"
        @send-action="sendAction($event)" />
      <estimation-poker
        v-if="isAeriusItem && currentRoomState && socketStore.userId"
        class="panel"
        :user-id="socketStore.userId"
        :roomState="currentRoomState"
        @send-action="sendAction($event)" />
    </div>
  </main>
</template>

<script setup lang="ts">
import type { RoomStateFragment } from "@/domain/types";
import { useContextStore } from "@/stores/contextStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();
const contextStore = useContextStore();

const route = useRoute();

const scheduleItem = computed(() => scheduleStore.findScheduleItem(route.params.code as string));
const isAeriusItem = computed(() => scheduleItem.value?.code.startsWith("aer-"));
const aeriusItemTitle = computed(() => scheduleItem.value?.title);
const aeriusItemHref = computed(
  () => "https://aerius.atlassian.net/browse/" + scheduleItem.value?.code,
);
const moderator = computed(() => socketStore.moderator);

watch(
  () => route.params.code,
  (newCode, oldCode) => {
    if (newCode !== oldCode) {
      socketStore.joinRoom(newCode as string);
    }
  },
  { immediate: true },
);

function openModeration() {
  contextStore.setModerating(true);
}

function sendAction(fragment: RoomStateFragment): void {
  socketStore.emitEvent(fragment);
}

const currentRoomState = computed(() => {
  return socketStore.getRoomState(route.params.code as string);
});

onUnmounted(() => {
  socketStore.leaveRoom();
});
</script>

<style lang="scss" scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);

  div {
    margin: 0 auto;
  }
}

.panel {
  margin: var(--spacer) auto;
}

main {
  display: flex;
  flex-direction: column;

  .moderator {
    margin: var(--spacer);
    padding: var(--spacer);
    background: var(--brand-color-2);
    text-align: center;
    font-size: 2em;

    .moderate-button {
      float: right;
      clear: all;
    }

    .name {
      font-weight: bold;

      text-shadow:
        0 0 5px white,
        0 0 15px white,
        0 0 20px white,
        0 0 40px white,
        0 0 60px red,
        0 0 10px white,
        0 0 98px red;
    }
  }

  .title {
    margin: var(--spacer);
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    gap: var(--spacer);

    h1 {
      display: flex;
      align-items: center;
      gap: var(--spacer);
    }

    .item-title {
      background: var(--brand-color-1);
      color: white;
      padding: var(--spacer);
      text-decoration: none;
      font-size: 2em;
      display: inline-block;
    }

    a {
      background: white;
      padding: var(--spacer);
      display: flex;
      align-items: center;
      text-decoration: none;
      background: var(--brand-color-3);

      .anchor-style {
        color: #0000ee;
        text-decoration: underline;
      }

      .no-style {
        color: black;
        margin-left: var(--spacer);
        text-decoration: none;
      }

      &:hover {
        background: var(--brand-color-4);
      }
    }
  }
}
</style>
