<template>
  <div class="mobile-nav">
    <div class="item" :class="{ active: isView(View.Menu) }" @click="setView(View.Menu)">
      <span class="material-symbols-rounded">menu</span>
      <span>Agenda</span>
    </div>
    <div class="item" :class="{ active: isView(View.Item) }" @click="setView(View.Item)">
      <span class="material-symbols-rounded">forum</span>
      <span>Item</span>
    </div>
    <div
      class="item"
      v-if="contextStore.isUserPanelActive"
      :class="{ active: isView(View.Mod) }"
      @click="setView(View.Mod)">
      <span class="material-symbols-rounded">settings</span>
      <span>Mod</span>
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
    display: none;
  }

  .mobile-nav {
    display: flex;
    align-items: stretch;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--brand-color-1);

    .item {
      flex: 1;
      cursor: pointer;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font-size: 0.75em;
      color: white;
      border-bottom: 3px solid transparent;

      .material-symbols-rounded {
        font-size: 20px;
      }

      &:hover {
        background: var(--brand-color-4);
      }
      &.active {
        border-bottom-color: white;
        background: var(--brand-color-2);
      }
    }
  }
  .app {
    grid-template-areas: "main";
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    min-height: auto;

    &.moderator-active {
      grid-template-areas: "main";
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }
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
