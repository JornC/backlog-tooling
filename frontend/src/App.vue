<template>
  <div class="app" :class="{ 'moderator-active': contextStore.isModerating }">
    <application-navigation />

    <main>
      <RouterView />
    </main>

    <moderator-panel v-if="contextStore.isModerating" />
  </div>
</template>

<script setup lang="ts">
import { useContextStore } from "./stores/contextStore";
const contextStore = useContextStore();
</script>

<style lang="scss" scoped>
.app {
  display: grid;
  grid-template-columns: minmax(200px, auto) 1fr;

  &.moderator-active {
    display: grid;
    grid-template-columns: minmax(200px, auto) 1fr minmax(400px, auto);
  }

  height: 100vh;
  min-height: 800px;
}

main {
  overflow: auto;
}
</style>
