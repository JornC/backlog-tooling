<template>
  <nav class="nav-menu">
    <router-link class="item" :to="{ name: 'home' }">Home</router-link>
    <div v-if="scheduleStore.getSchedule().length === 0" @click="moderate" class="item moderate">
      Start a session
    </div>
    <router-link
      v-for="item in scheduleStore.getSchedule()"
      :key="item.code"
      class="item"
      :to="{ name: 'AgendaRoute', params: { code: item.code } }">
      <div class="line">
        <div>{{ item.title }}</div>
        <div v-if="item.locked" class="check icon material-icons">check_circle</div>
        <div v-else-if="isCurrent(item.code)" class="current icon material-icons">forum</div>
        <div v-else class="pending icon material-icons">timer</div>
      </div>
    </router-link>
    <div class="spacer"></div>
    <div class="bare-item center" :class="{ highlight: !isConnected }">{{ wsStatus }}</div>
  </nav>
</template>

<script lang="ts" setup>
import { ConnectionStatus } from "@/domain/types";
import { useContextStore } from "@/stores/contextStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const contextStore = useContextStore();
const scheduleStore = useScheduleStore();
const route = useRoute();

const wsStatus = computed(() => {
  return `${socketStore.status} (${numConnected.value || "?"})`;
});

function isCurrent(code: string) {
  return (route.params.code as string) === code;
}

function moderate() {
  contextStore.setModerating(true);
}

const isConnected = computed(() => socketStore.status === ConnectionStatus.Connected);

const numConnected = computed(() => socketStore.numConnected);
</script>

<style lang="scss" scoped>
.moderate {
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);

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
</style>
