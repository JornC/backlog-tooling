<template>
  <div class="mobile-nav">
    <div class="item" :class="{ active: isView(View.Menu) }" @click="setView(View.Menu)">Menu</div>
    <div class="item" :class="{ active: isView(View.Item) }" @click="setView(View.Item)">Item</div>
    <div
      class="item"
      v-if="contextStore.isUserPanelActive"
      :class="{ active: isView(View.Mod) }"
      @click="setView(View.Mod)">
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

<script setup lang="ts">
import { useContextStore } from "./stores/contextStore";
const contextStore = useContextStore();

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
    align-items: center;
    gap: var(--spacer);
    padding: var(--spacer);

    .item {
      cursor: pointer;
      padding: var(--spacer);
      background: var(--brand-color-3);

      &:hover {
        background: var(--brand-color-4);
      }
      &.active {
        background: var(--brand-color-5);
      }
    }
  }
  .app {
    grid-template-areas:
      "nav"
      "main";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;

    &.moderator-active {
      grid-template-areas:
        "nav"
        "main"
        "user";
      grid-template-columns: 1fr;
      grid-template-rows: auto auto 1fr;
    }
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
