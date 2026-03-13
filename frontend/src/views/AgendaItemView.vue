<template>
  <main>
    <section class="moderator">
      <template v-if="moderator">
        <span class="name">{{ moderator }}</span> is moderating
      </template>
      <template v-else>
        <span>No moderator</span>
      </template>

      <button
        v-if="!contextStore.isUserPanelActive"
        class="moderate-button"
        @click="openModeration">
        Scratch board and moderation
      </button>
    </section>

    <div class="actions" v-if="currentRoomState && socketStore.userId">
      <div class="centered-content" :style="{ '--title-offset': titleHeight }">
      <div ref="titleSectionRef" class="title-section">
        <div class="title-row">
          <div class="title-left">
            <h1 class="current-topic">
              <a :href="aeriusItemHref" v-if="isAeriusItem" target="_blank" class="item-title">
                {{ aeriusItemTitle }}
                <span class="material-symbols-rounded open-icon">open_in_new</span>
              </a>
              <span v-else class="item-title">{{ aeriusItemTitle }}</span>
            </h1>
            <span
              title="Item is locked"
              :class="{ visible: scheduleItem?.locked }"
              class="lock material-symbols-rounded"
              >lock</span
            >
          </div>
          <div v-if="scheduleItem?.description" class="description" v-html="itemDescription"></div>
        </div>
      </div>
      <div class="secondary-row" v-if="scheduleItem">
        <fieldset class="secondary-section">
          <legend>Signals</legend>
          <simple-signals
            :user-id="socketStore.userId"
            :roomState="currentRoomState"
            @send-action="sendAction($event)" />
        </fieldset>
        <fieldset class="secondary-section scratchboard-field">
          <legend>Scratchboard</legend>
          <scratchboard
            :user-id="socketStore.userId"
            :room-id="scheduleItem.code"
            :locked="scheduleItem?.locked || false" />
        </fieldset>
      </div>

      <template v-if="isAeriusItem">
        <h2 class="poker-count-title">
          <span>Estimates</span>
          <div :class="{ showing: totalPokerCount > 0 }" class="count-badge">
            {{ totalPokerCount || 1 }}
          </div>
        </h2>
        <fieldset class="poker-section" :class="{ revealed }">
          <legend>Dev</legend>
          <estimation-poker
            :revealed="revealed"
            :user-id="socketStore.userId"
            :roomState="currentRoomState"
            :estimate-action="ActionType.POKER_DEV_ESTIMATE"
            @send-action="sendAction($event)" />
        </fieldset>
        <fieldset class="poker-section" :class="{ revealed }">
          <legend>Test</legend>
          <estimation-poker
            :revealed="revealed"
            :user-id="socketStore.userId"
            :roomState="currentRoomState"
            :estimate-action="ActionType.POKER_TEST_ESTIMATE"
            @send-action="sendAction($event)" />
        </fieldset>
      </template>
      </div>
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
const router = useRouter();

watch(
  () => [socketStore.hasPin, socketStore.userId] as const,
  ([hasPin, userId]) => {
    if (userId && !hasPin) {
      router.push("/");
    }
  },
  { immediate: true },
);

const scheduleItem = computed(() => scheduleStore.findScheduleItem(route.params.code as string));
const isAeriusItem = computed(() => scheduleItem.value?.code.startsWith("aer-"));
const aeriusItemTitle = computed(() => scheduleItem.value?.title);
const aeriusItemHref = computed(
  () =>
    `https://aerius.atlassian.net/browse/${ 
    String(scheduleItem.value?.code)
      .replace(":", "")
      .toUpperCase()}`,
);
const moderator = computed(() => socketStore.moderator);

const titleSectionRef = ref<HTMLElement>();
const titleHeight = ref("0px");

watchEffect((onCleanup) => {
  const el = titleSectionRef.value;
  if (!el) return;
  const observer = new ResizeObserver(() => {
    titleHeight.value = `${el.offsetHeight}px`;
  });
  observer.observe(el);
  onCleanup(() => observer.disconnect());
});

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
  contextStore.setUserPanelActive(true);
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
      old?.filter((v) => v.type === ActionType.POKER_REVEAL).length === 0 &&
      (neww?.filter((v) => v.type === ActionType.POKER_REVEAL).length ?? 0) > 0
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
  border: var(--signal-border-width) var(--signal-border-style) #ddd;
  border-radius: var(--radius);
  padding: var(--spacer);
  width: 100%;
  max-width: min(800px, 100%);
  box-sizing: border-box;
  transition: border-color 0.15s ease-out;

  &.revealed {
    border-color: var(--brand-color-1);
  }

  legend {
    font-size: 0.85em;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.6;
    padding: 0 0.5em;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacer);
  flex: 1;
}

.centered-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacer);
  width: 100%;

  &::after {
    content: "";
    height: var(--title-offset, 0px);
  }
}

.secondary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacer);
  width: 100%;
  max-width: min(800px, 100%);
  box-sizing: border-box;
}

.secondary-section {
  border: var(--signal-border-width) var(--signal-border-style) #ddd;
  border-radius: var(--radius);
  margin: 0;
  padding: var(--spacer);

  legend {
    font-size: 0.85em;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.6;
    padding: 0 0.5em;
  }
}

.scratchboard-field {
  flex: 1;
  min-width: 0;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}
.description {
  background: var(--brand-color-2);
  padding: var(--spacer);
  border-radius: var(--radius);
  font-size: 0.9em;
  flex: 1;
  display: flex;
  align-items: center;
}
.estimate-button {
  margin: 15px auto;
}

.lock {
  font-size: 2em;
  margin-left: 0.3em;
  opacity: 0;
  color: crimson;
  transition: opacity 0.15s ease-out;
  display: flex;
  align-items: center;

  &.visible {
    opacity: 1;
  }
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
  padding: var(--spacer);
  min-height: 100%;

  .moderator {
    display: none;
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
      text-shadow: var(--moderator-glow);
    }
  }

}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacer) * 0.5);
  width: 100%;
  max-width: min(800px, 100%);
  margin-bottom: var(--spacer);
}

.title-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  gap: var(--spacer);
  width: 100%;
}

.title-left {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.title-row h1 {
  display: flex;
  align-items: stretch;
  position: relative;
  flex: 1;
}

.item-title {
  background: var(--brand-color-1);
  color: white;
  padding: var(--spacer) calc(var(--spacer) * 2);
  text-decoration: none;
  font-size: 1.6em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
  border-radius: var(--radius);
  flex: 1;
}

.open-icon {
  font-size: 0.55em;
  opacity: 0.7;
  transition: opacity var(--anim);

  .item-title:hover & {
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  main {
    .moderator {
      margin: 0;
      display: block;
      font-size: 1em;
    }

  }
}

@media (max-width: 768px) {
  .title-row {
    flex-direction: column;
    align-items: center;
  }

  .description {
    max-width: 100%;
  }

  .secondary-row {
    flex-direction: column;
    align-items: center;
  }

  .scratchboard-field {
    max-width: 100%;
    width: 100%;
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
