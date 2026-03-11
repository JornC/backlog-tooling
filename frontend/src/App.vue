<template>
  <div class="mobile-nav">
    <div class="item" :class="{ active: isView(View.Menu) }" @click="setView(View.Menu)">
      Agenda
    </div>
    <div class="item" :class="{ active: isView(View.Item) }" @click="setView(View.Item)">
      Item
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

<script setup lang="ts">
import { useContextStore } from "./stores/contextStore";
const contextStore = useContextStore();
const route = useRoute();

enum View {
  Menu,
  Item,
  Mod,
}

const activeView = ref<View | undefined>(View.Item);

function setView(view: View) {
  activeView.value = view;
}

function isView(view: View): boolean {
  return activeView.value === view;
}

watch(
  () => route.params.code,
  (code) => {
    if (code) {
      activeView.value = View.Item;
    }
  },
);
</script>

<style lang="scss" scoped>
.app {
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
