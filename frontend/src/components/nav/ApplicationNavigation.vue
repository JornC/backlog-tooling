<template>
  <div class="nav-section">
    <section class="moderator">
      <template v-if="socketStore.moderator">
        <span class="name">{{ socketStore.moderator }}</span> is moderating
      </template>
      <template v-else>
        <span>No moderator</span>
      </template>
    </section>

    <button v-if="!contextStore.isUserPanelActive" class="moderate-button" @click="openModeration">
      User panel
    </button>

    <hr />

    <nav class="nav-menu">
      <router-link class="item" :to="{ name: 'home' }">Home</router-link>
      <template v-if="socketStore.hasPin && scheduleStore.schedule.length > 0">
      <div
        v-for="group in scheduleStore.groupedSchedule"
        :key="group.groupTitle"
        class="group"
        :class="{ 'active-group': isExpanded(group.groupTitle) }">
        <div @click="toggleGroup(group.groupTitle)" class="group-title" v-if="group.groupTitle">
          <div class="title-line">
            <span class="title-text">{{ group.groupTitle || "Ungrouped" }}</span>
            <span
              v-if="
                group.items.map((v) => v.size || 0).reduce((acc: number, v: number) => acc + v, 0)
              "
              class="room-count"
              >({{
                group.items.map((v) => v.size || 0).reduce((acc: number, v: number) => acc + v, 0)
              }})</span
            >
          </div>
          <span class="toggle-icon material-symbols-rounded">
            {{ isExpanded(group.groupTitle) ? "expand_less" : "expand_more" }}
          </span>
        </div>
        <transition name="slide">
          <div v-show="isExpanded(group.groupTitle) || !group.groupTitle" class="item-content">
            <router-link
              v-for="item in group.items"
              :title="item.title + ': ' + item.description?.split('\n')[0]"
              :key="item.code"
              class="item"
              :to="{ name: 'AgendaRoute', params: { code: item.code } }">
              <div class="line">
                <div class="item-content">
                  <div class="title-line">
                    <span class="title-text">{{ item.title }}</span>
                    <span v-if="item.size" class="room-count">({{ item.size }})</span>
                  </div>
                  <div v-if="item.description" class="description">
                    {{ item.description?.split("\n")[0] }}
                  </div>
                </div>
                <div v-if="item.locked" class="check icon material-symbols-rounded">
                  check_circle
                </div>
                <div v-else-if="isCurrent(item.code)" class="current icon material-symbols-rounded">
                  forum
                </div>
                <div v-else class="pending icon material-symbols-rounded">timer</div>
              </div>
            </router-link>
          </div>
        </transition>
      </div>

      <router-link v-if="scheduleStore.schedule.length > 0" class="item" :to="{ name: 'summary' }">
        Summary
      </router-link>
      </template>
      <div class="spacer"></div>
      <div class="bare-item settings-toggle" @click="settingsExpanded = !settingsExpanded">
        <div class="line">
          <span>Settings</span>
          <span class="material-symbols-rounded sound-icon">{{
            settingsExpanded ? "expand_more" : "expand_less"
          }}</span>
        </div>
      </div>
      <template v-if="settingsExpanded">
        <div class="bare-item toggle-line" @click="toggleSignals">
          <div class="line">
            <span><span v-if="hasSignals && !contextStore.showSignals" class="activity-indicator">!</span>Signals:</span>
            <span class="material-symbols-rounded sound-icon">{{
              contextStore.showSignals ? "visibility" : "visibility_off"
            }}</span>
          </div>
        </div>
        <div class="bare-item toggle-line" @click="toggleScratchboard">
          <div class="line">
            <span><span v-if="hasScratchboard && !contextStore.showScratchboard" class="activity-indicator">!</span>Scratchboard:</span>
            <span class="material-symbols-rounded sound-icon">{{
              contextStore.showScratchboard ? "visibility" : "visibility_off"
            }}</span>
          </div>
        </div>
        <div class="bare-item theme-switcher">
          <div class="theme-options">
            <button
              class="theme-dot modern"
              :class="{ active: contextStore.theme === 'modern' }"
              title="Modern theme"
              @click="setTheme('modern')">
              <span class="dot"></span>
            </button>
            <button
              class="theme-dot fun"
              :class="{ active: contextStore.theme === 'fun' }"
              title="Fun theme"
              @click="setTheme('fun')">
              <span class="dot"></span>
            </button>
            <button
              class="theme-dot funner"
              :class="{ active: contextStore.theme === 'funner' }"
              title="Funner theme"
              @click="setTheme('funner')">
              🤡
            </button>
          </div>
        </div>
        <div class="bare-item sound-line local" @click="toggleLocalSound">
          <div class="line">
            <span>Personal mute:</span>
            <span class="material-symbols-rounded sound-icon">{{
              contextStore.playSounds ? "volume_up" : "volume_mute"
            }}</span>
          </div>
          <span class="explain">Mute all sounds for yourself.</span>
        </div>
        <div class="bare-item sound-line local" @click="toggleSilentSignals">
          <div class="line">
            <span>Shy mode:</span>
            <span class="material-symbols-rounded sound-icon">{{
              contextStore.silentSignals ? "notifications_off" : "notifications_active"
            }}</span>
          </div>
          <span class="explain">Your signals won't make sound for others.</span>
        </div>
        <div class="bare-item sound-line">
          <div class="line">
            <span>Global mute:</span>
            <span class="material-symbols-rounded sound-icon">{{
              socketStore.playSounds ? "volume_up" : "volume_mute"
            }}</span>
          </div>
          <span class="explain">Mod action: Mute all sounds for everyone</span>
        </div>
      </template>
      <div class="bare-item connection center" :class="{ highlight: !isConnected }">
        {{ wsStatus }}
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { ActionType, ConnectionStatus } from "@/domain/types";
import router from "@/router";
import { useContextStore, type Theme } from "@/stores/contextStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const contextStore = useContextStore();
const scheduleStore = useScheduleStore();
const route = useRoute();

const expandedGroup = ref<string | undefined>(undefined);
const selectedItemCode = ref<string | undefined>(undefined);
const settingsExpanded = ref(false);

function openModeration() {
  contextStore.setUserPanelActive(true);
}

const wsStatus = computed(() => {
  return `${socketStore.status} (${numConnected.value || "?"})`;
});

function isCurrent(code: string) {
  return (route.params.code as string) === code;
}

function toggleGroup(groupTitle: string) {
  if (expandedGroup.value === groupTitle) {
    expandedGroup.value = undefined;
    selectedItemCode.value = undefined;
  } else {
    expandedGroup.value = groupTitle;
    const firstItem = scheduleStore.groupedSchedule.find((group) => group.groupTitle === groupTitle)
      ?.items[0];

    if (firstItem) {
      router.push({ name: "AgendaRoute", params: { code: firstItem?.code } });
    }
  }
}

function isExpanded(groupTitle: string) {
  return expandedGroup.value === groupTitle && groupTitle;
}

function toggleLocalSound() {
  contextStore.setPlaySounds(!contextStore.playSounds);
}

function toggleSilentSignals() {
  contextStore.setSilentSignals(!contextStore.silentSignals);
}

function toggleSignals() {
  contextStore.setShowSignals(!contextStore.showSignals);
}

function toggleScratchboard() {
  contextStore.setShowScratchboard(!contextStore.showScratchboard);
}

function setTheme(theme: Theme) {
  contextStore.setTheme(theme);
}

const isConnected = computed(() => socketStore.status === ConnectionStatus.Connected);

const numConnected = computed(() => socketStore.numConnected);

const signalTypes = new Set([
  ActionType.SIGNAL_ESTIMATE,
  ActionType.SIGNAL_QUESTIONS,
  ActionType.SIGNAL_THINKING,
  ActionType.SIGNAL_TAPOUT,
  ActionType.SIGNAL_SNOOZE,
  ActionType.SIGNAL_COFFEE,
]);

const currentRoomState = computed(() => {
  const code = route.params.code as string;
  return code ? socketStore.getRoomState(code) : undefined;
});

const hasSignals = computed(
  () => currentRoomState.value?.some((v) => signalTypes.has(v.type)) ?? false,
);

const hasScratchboard = computed(() => {
  const code = route.params.code as string;
  if (!code) {return false;}
  const state = socketStore.scratchboard.get(code);
  return !!state?.text;
});

watch(route, () => {
  const itemCode = route.params.code;
  const foundGroup = scheduleStore.groupedSchedule.find((group) =>
    group.items.some((item) => item.code === itemCode),
  );

  if (foundGroup) {
    expandedGroup.value = foundGroup.groupTitle;
  }
});
</script>

<style lang="scss" scoped>
.nav-section {
  width: 300px;
}
.moderator {
  display: flex;
  flex-direction: column;
  padding: var(--spacer);
  margin: var(--nav-gap);
  border-radius: var(--radius);
  background: var(--brand-color-2);
  text-align: center;
  font-size: 2em;

  .name {
    font-weight: bold;
    text-shadow: var(--moderator-glow);
  }
}

.moderate-button {
  display: block;
  width: auto;
  margin: var(--nav-gap);
  border-radius: var(--radius);
}

.settings-toggle {
  cursor: pointer;
  font-weight: bold;

  .line {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sound-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--brand-color-4);
  }
}

.group {
  display: flex;
  flex-direction: column;
  border-right: var(--group-border-width) solid transparent;
  border-bottom: 0px solid transparent;
  transition: all 0.25s var(--transition-timing);

  &.active-group {
    border-color: var(--brand-color-5);
    border-bottom: var(--group-border-width) solid var(--brand-color-5);

    .group-title {
      background: var(--brand-color-5);
    }
  }
}

.title-line {
  flex-grow: 1;
  display: flex;
  align-items: center;

  .title-text {
    flex-grow: 1;
  }
}

.toggle-icon {
  margin-left: var(--spacer);
}

.group-title {
  display: flex;
  align-items: center;
  padding: var(--spacer);
  margin: var(--nav-gap);
  cursor: pointer;
  font-weight: bold;
  border-radius: var(--radius);
  transition: all 0.25s var(--transition-timing);

  .title-text {
    flex-grow: 1;
  }

  &:hover {
    background: var(--brand-color-4);
  }
}

.room-count {
  margin-left: var(--spacer);
}

.description {
  font-size: 0.7em;
  max-width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-content {
  display: flex;
  flex-direction: column;
}

.theme-switcher {
  display: flex;
  justify-content: center;
}

.theme-options {
  display: flex;
  gap: calc(var(--spacer) / 2);
  align-items: center;
}

.theme-dot {
  all: unset;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all var(--anim);

  &.active {
    border-color: black;
    transform: scale(1.2);
  }

  &:hover {
    transform: scale(1.15);
  }

  &.active:hover {
    transform: scale(1.2);
  }

  .dot {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  &.modern .dot {
    background: #94a3b8;
  }

  &.fun .dot {
    background: conic-gradient(#ff595e, #ffca3a, #8ac926, #1982c4, #6a4c93, #ff595e);
  }

  &.funner {
    font-size: 16px;
  }
}

.activity-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand-color-4);
  color: white;
  font-weight: bold;
  font-size: 12px;
  margin-right: 6px;
}

.toggle-line {
  cursor: pointer;

  .line {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sound-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--brand-color-4);
  }
}

.sound-line {
  display: flex;
  flex-direction: column;

  .line {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sound-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .explain {
    font-size: 0.8em;
  }

  &.local {
    cursor: pointer;
  }

  &.local:hover {
    background: var(--brand-color-4);
  }
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);

  .item-content {
    flex-grow: 1;
  }

  .icon {
    width: 24px;
  }

  .check {
    color: var(--brand-color-2);
  }

  .current {
    color: gray;
  }

  .pending {
    color: gray;
  }
}

.nav-menu {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: var(--nav-gap);
  padding: var(--nav-gap);

  .connection {
    background: var(--brand-color-2);
  }

  .item,
  .bare-item {
    padding: var(--spacer);
    margin: var(--nav-gap);
    text-decoration: none;
    color: currentColor;
    border-radius: var(--radius);

    &.highlight {
      background: red;
      color: white;
    }
  }

  .item {
    cursor: pointer;

    &.router-link-active {
      background: var(--brand-color-3);
      color: black;
      .icon {
        color: black;
      }
    }

    &:hover {
      background: var(--brand-color-4);
      color: black;

      .icon {
        color: white;
      }
    }
  }

  .center {
    text-align: center;
  }

  .spacer {
    flex-grow: 1;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.25s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
}

.item-content {
  overflow: hidden;
}
button {
  width: 100%;
}
</style>
