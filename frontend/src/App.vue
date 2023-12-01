<template>
  <div class="app">
    <application-navigation />

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<style lang="scss" scoped>
.app {
  display: grid;
  grid-template-columns: minmax(200px, auto) 1fr;

  height: 100vh;
  min-height: 800px;
}
</style>
