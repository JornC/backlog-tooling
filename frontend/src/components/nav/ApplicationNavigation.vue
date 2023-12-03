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
    <div class="bare-item center" :class="{ highlight: !isConnected }">{{ wsStatus }}</div>
  </nav>
</template>

<script lang="ts" setup>
import { ConnectionStatus } from "@/domain/types";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();

const schedule = ref([
  { title: "AER-1234", code: "aer-1234" },
  { title: "AER-4321", code: "aer-4321" },
  { title: "Break", code: "break-1" },
]);

const wsStatus = computed(() => {
  return `${socketStore.status} (${numConnected.value || "?"})`;
});

const isConnected = computed(() => socketStore.status === ConnectionStatus.Connected);

const numConnected = computed(() => socketStore.numConnected);
</script>

<style lang="scss" scoped>
.nav-menu {
  margin: var(--spacer);

  display: flex;
  flex-direction: column;

  .bare-item {
    background: var(--brand-color-2);
  }

  .item,
  .bare-item {
    padding: var(--spacer);
    text-decoration: none;
    color: currentColor;

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
    }

    &:hover {
      background: var(--brand-color-4);
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
