<template>
  <div>
    <nav class="nav-menu">
      <router-link class="item" :to="{ name: 'home' }">Home</router-link>
      <div v-if="scheduleStore.schedule.length === 0" @click="moderate" class="item moderate">
        Start a session
      </div>
      <div
        v-for="group in scheduleStore.groupedSchedule"
        :key="group.groupTitle"
        class="group"
        :class="{ 'active-group': isExpanded(group.groupTitle) }">
        <div @click="toggleGroup(group.groupTitle)" class="group-title" v-if="group.groupTitle">
          {{ group.groupTitle || "Ungrouped" }}
          <span class="toggle-icon material-icons">
            {{ isExpanded(group.groupTitle) ? "expand_less" : "expand_more" }}
          </span>
        </div>
        <transition name="slide">
          <div v-show="isExpanded(group.groupTitle) || !group.groupTitle" class="item-content">
            <router-link
              v-for="item in group.items"
              :key="item.code"
              class="item"
              :to="{ name: 'AgendaRoute', params: { code: item.code } }">
              <div class="line">
                <div>{{ item.title }}</div>
                <div v-if="item.locked" class="check icon material-icons">check_circle</div>
                <div v-else-if="isCurrent(item.code)" class="current icon material-icons">
                  forum
                </div>
                <div v-else class="pending icon material-icons">timer</div>
              </div>
            </router-link>
          </div>
        </transition>
      </div>

      <router-link v-if="scheduleStore.schedule.length > 0" class="item" :to="{ name: 'summary' }">
        Summary
      </router-link>
      <div class="spacer"></div>
      <div class="bare-item">
        <div class="sound-line local" @click="toggleLocalSound">
          Local:
          <span class="material-symbols-outlined button-icon">{{
            contextStore.playSounds ? "volume_up" : "volume_mute"
          }}</span>
        </div>
        <div class="sound-line">
          Remote:
          <span class="material-symbols-outlined button-icon">{{
            socketStore.playSounds ? "volume_up" : "volume_mute"
          }}</span>
        </div>
      </div>
      <div class="bare-item connection center" :class="{ highlight: !isConnected }">
        {{ wsStatus }}
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { ConnectionStatus } from "@/domain/types";
import router from "@/router";
import { useContextStore } from "@/stores/contextStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const contextStore = useContextStore();
const scheduleStore = useScheduleStore();
const route = useRoute();

const expandedGroup = ref<string | undefined>(undefined);
const selectedItemCode = ref<string | undefined>(undefined);

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

function moderate() {
  contextStore.setModerating(true);
}
function toggleLocalSound() {
  contextStore.setPlaySounds(!contextStore.playSounds);
}

const isConnected = computed(() => socketStore.status === ConnectionStatus.Connected);

const numConnected = computed(() => socketStore.numConnected);

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
.group {
  display: flex;
  flex-direction: column;
  border-right: 15px solid transparent;
  border-bottom: 0px solid transparent;
  transition: all 0.25s ease-out;

  &.active-group {
    border-color: var(--brand-color-5);
    border-bottom: 15px solid var(--brand-color-5);

    .group-title {
      background: var(--brand-color-5);
    }
  }
}

.group-title {
  display: flex;
  align-items: center;
  padding: var(--spacer);
  cursor: pointer;
  font-weight: bold;
  transition: all 0.25s ease-out;

  &:hover {
    background: var(--brand-color-4);
  }
}

.item-content {
  display: flex;
  flex-direction: column;
}

.sound-line {
  display: flex;
  align-items: center;
  justify-content: space-between;

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

  .connection {
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
</style>
