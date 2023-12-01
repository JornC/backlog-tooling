<template>
  <nav class="nav-menu">
    <router-link class="item" :to="{ name: 'home' }">Home</router-link>
    <router-link
      v-for="item in schedule"
      :key="item.code"
      class="item"
      :to="{ name: 'AgendaRoute', params: { code: item.code } }">
      {{ item.title }}
    </router-link>
    <div class="spacer"></div>
    <div class="bare-item center">{{ wsStatus }}</div>
  </nav>
</template>

<script lang="ts" setup>
import { socketManager } from "@/ws/socketManager";

const schedule = ref([
  { title: "AER-1234", code: "aer-1234" },
  { title: "AER-4321", code: "aer-4321" },
]);

const wsStatus = computed(() => (socketManager.isConnected() ? "connected" : "disconnected"));
</script>

<style lang="scss" scoped>
.nav-menu {
  margin: var(--spacer);
  padding: var(--spacer) 0px;
  background: #1982c4;

  display: flex;
  flex-direction: column;
  gap: var(--spacer);

  color: white;

  .item,
  .bare-item {
    padding: var(--spacer);
    text-decoration: none;
    color: currentColor;
  }

  .item {
    cursor: pointer;

    &.router-link-active {
      background: var(--brand-color-2);
      color: black;
    }

    &:hover {
      background: var(--brand-color-2);
      color: black;
    }
  }

  .center {
    text-align: center;
  }

  .spacer {
    flex-grow: 1;
  }
}
</style>
