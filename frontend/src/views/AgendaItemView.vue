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
      <h1 class="center-wrap">
        Current topic
        <a :href="aeriusItemHref" v-if="isAeriusItem" target="_blank" class="item-title">
          {{ aeriusItemTitle }}
        </a>
        <span v-else class="item-title">{{ aeriusItemTitle }}</span>
      </h1>
      <div v-if="scheduleItem?.description" class="description" v-html="itemDescription" />
      <a class="anchor-link center-wrap" v-if="isAeriusItem" :href="aeriusItemHref" target="_blank">
        <div class="anchor-style">{{ aeriusItemHref }}</div>
        <span class="no-style">(opens new window)</span>
      </a>
    </section>

    <div class="actions" v-if="currentRoomState && socketStore.userId">
      <h2>Signals</h2>
      <simple-signals
        :user-id="socketStore.userId"
        :roomState="currentRoomState"
        @send-action="sendAction($event)" />
      <template v-if="isAeriusItem">
        <h2 class="poker-count-title">
          <span>Poker</span>
          <div :class="{ showing: totalPokerCount > 0 }" class="count-badge">
            {{ totalPokerCount || 1 }}
          </div>
        </h2>
        <div class="poker-section center-wrap">
          <h3>Dev</h3>
          <estimation-poker
            class="panel"
            :revealed="revealed"
            :user-id="socketStore.userId"
            :roomState="currentRoomState"
            :estimate-action="ActionType.POKER_DEV_ESTIMATE"
            @send-action="sendAction($event)" />
        </div>
        <div class="poker-section center-wrap">
          <h3>Test</h3>
          <estimation-poker
            class="panel"
            :revealed="revealed"
            :user-id="socketStore.userId"
            :roomState="currentRoomState"
            :estimate-action="ActionType.POKER_TEST_ESTIMATE"
            @send-action="sendAction($event)" />
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { RoomStateFragment } from "@/domain/types";
import { ActionType } from "@/domain/types";
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
  () => "https://aerius.atlassian.net/browse/" + String(scheduleItem.value?.code).toUpperCase(),
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

const revealed = computed(
  () => currentRoomState.value!.filter((v) => v.type === ActionType.POKER_REVEAL).length > 0,
);

function openModeration() {
  contextStore.setModerating(true);
}

function sendAction(fragment: RoomStateFragment): void {
  socketStore.emitEvent(fragment);
}

const itemDescription = computed(() => {
  return scheduleItem.value?.description
    ?.split("\n")
    .map((v) => `<p>${formatDescriptionLine(v)}</p>`)
    .join("");
});

function formatDescriptionLine(text: string): string {
  const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });
}

const totalPokerCount = computed(
  () =>
    currentRoomState.value!.filter(
      (v) => v.type === ActionType.POKER_DEV_ESTIMATE || v.type === ActionType.POKER_TEST_ESTIMATE,
    ).length,
);

const isPlaySounds = computed(() => contextStore.playSounds && socketStore.playSounds);

const currentRoomState = computed(() => {
  return socketStore.getRoomState(route.params.code as string);
});
watch(
  () => currentRoomState.value,
  (neww, old) => {
    if (
      (old?.filter((v) => v.type === ActionType.POKER_REVEAL).length === 0 &&
        neww?.filter((v) => v.type === ActionType.POKER_REVEAL).length) ||
      0 > 0
    ) {
      if (isPlaySounds.value) {
        const audioPlayer = new Audio("/angelic.mp3");
        audioPlayer.volume = 0.5;
        audioPlayer.play();
      }
    }
  },
);

onUnmounted(() => {
  socketStore.leaveRoom();
});
</script>

<style lang="scss" scoped>
.poker-section {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}

.center-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
  padding-bottom: var(--spacer);

  div {
    margin: 0 auto;
  }
}
.description {
  background: var(--brand-color-3);
  padding: var(--spacer);
}
.estimate-button {
  margin: 15px auto;
}

.panel {
  margin: var(--spacer) auto;
}

h1,
h2,
h3 {
  margin: 0px;
}

.poker-count-title {
  position: relative;
  display: inline-block;
  margin: 0 auto;
  padding: 0 20px;
}

main {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
  padding-bottom: var(--spacer);

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
    margin: 0px var(--spacer);
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

@media (max-width: 1024px) {
  h1,
  h2,
  h3 {
    display: none;
  }

  main {
    .moderator {
      margin: 0px var(--spacer);
    }

    .title {
      .anchor-link {
        display: none;
      }
      .item-title {
        padding: 0px var(--spacer);
      }
    }
  }
}

.count-badge {
  position: absolute;
  top: -4px;
  right: -30px;
  font-size: 20px;
  width: 20px;
  height: 20px;
  padding: 10px;
  border-radius: 50%;
  line-height: 20px;
  font-weight: bold;

  background-color: var(--brand-color-3);
  color: black;
  text-align: center;
  opacity: 0;
  transition: all 0.15s ease-out;
  pointer-events: none;
  aspect-ratio: 1 / 1;

  &.showing {
    opacity: 1;
  }
}
</style>
