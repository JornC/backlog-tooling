<template>
  <RouterView v-if="isAdminRoute" />
  <session-ended v-else-if="isSessionEnded" />
  <pin-gate v-else-if="isPinRequired" />
  <template v-else>
  <div
    class="mood-overlay"
    aria-hidden="true"
    :style="{ '--mood-color': moodColor, '--mood-intensity': moodIntensity }"></div>
  <div class="mobile-nav">
    <div class="item" :class="{ active: isView(View.Menu) }" @click="setView(View.Menu)">
      Agenda
    </div>
    <div class="item" :class="{ active: isView(View.Item) }" @click="setView(View.Item)">
      Item
    </div>
    <div class="item" :class="{ active: isView(View.Mod) }" @click="openMod">
      Mod
    </div>
  </div>

  <div class="app" :class="{ 'moderator-active': contextStore.isUserPanelActive }">
    <application-navigation class="app-navigation" :class="{ hide: !isView(View.Menu) }" />

    <main class="app-main" :class="{ hide: !isView(View.Item) }">
      <RouterView />
    </main>

    <user-panel
      v-if="contextStore.isUserPanelActive"
      class="app-user-panel"
      :class="{ hide: !isView(View.Mod) }" />
  </div>
  </template>
</template>

<script setup lang="ts">
import { ConnectionStatus } from "./domain/types";
import { useContextStore } from "./stores/contextStore";
import { useSocketStore } from "./ws/socketManager";
import { useRoomMood } from "./composables/useRoomMood";

const route = useRoute();
const contextStore = useContextStore();
const socketStore = useSocketStore();

const { moodColor, moodIntensity } = useRoomMood();
const isAdminRoute = computed(() => route.path === "/admin");
const isSessionEnded = computed(() => socketStore.status === ConnectionStatus.SessionEnded);
const isPinRequired = computed(() => socketStore.status === ConnectionStatus.PinRequired);

enum View {
  Menu,
  Item,
  Mod,
}

const activeView = ref<View | undefined>(View.Item);

function setView(view: View) {
  activeView.value = view;
}

function openMod() {
  contextStore.setUserPanelActive(true);
  activeView.value = View.Mod;
}

function isView(view: View): boolean {
  return activeView.value === view;
}

</script>

<style lang="scss" scoped>
.app {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-areas: "nav main";
  grid-template-columns: minmax(auto, auto) 1fr;
  grid-template-rows: 100vh;
  min-height: 100vh;

  &.moderator-active {
    grid-template-areas: "nav main user";
    grid-template-columns: minmax(auto, auto) 1fr minmax(auto, auto);
  }
}

.mood-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 40%, var(--mood-color, transparent), transparent 75%);
  opacity: var(--mood-intensity, 0);
  transition:
    opacity 0.8s ease-out,
    background 0.8s ease-out;
}

.mobile-nav {
  display: none;
}

@media (max-width: 1024px) {
  .hide {
    display: none !important;
  }

  .mobile-nav {
    display: flex;
    align-items: stretch;
    position: sticky;
    top: 0;
    z-index: 100;

    .item {
      flex: 1;
      cursor: pointer;
      padding: 12px;
      text-align: center;
      font-size: 1em;
      font-weight: bold;
      background: var(--brand-color-3);
      color: black;

      &.active {
        background: var(--brand-color-1);
        color: white;
      }
    }
  }

  .app {
    display: block;
    min-height: auto;

    &.moderator-active {
      display: block;
    }
  }

  .app-navigation,
  .app-main,
  .app-user-panel {
    width: 100%;
  }

  .app-navigation {
    width: auto !important;
  }
}

.app-navigation {
  grid-area: nav;

  display: flex;
  flex-direction: column;
}

.app-main {
  overflow: auto;
  grid-area: main;
  flex-grow: 1;
}

.app-user-panel {
  grid-area: user;
}
</style>
