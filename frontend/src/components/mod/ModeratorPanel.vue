<template>
  <section class="mod-panel">
    <section class="nav" v-if="isModerator">
      <div :class="{ active: isActive('session') }" @click="setActive('session')" class="nav-item">
        Session
      </div>
      <div
        :class="{ active: isActive('controls') }"
        @click="setActive('controls')"
        class="nav-item">
        Controls
      </div>
    </section>
    <session-controls v-if="isActive('session')" />
    <meeting-controls v-if="isActive('controls')" />

    <div class="spacer"></div>
    <button @click="closeModeration">
      <span class="material-symbols-rounded button-icon">close</span>
      Close panel
    </button>
  </section>
</template>

<script lang="ts" setup>
import { useContextStore } from "@/stores/contextStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const contextStore = useContextStore();

const isModerator = computed(() => socketStore.isModerator);

const drumrollSelection = ref<string>("");
watch(drumrollSelection, (neww) => {
  socketStore.emitNamed("persist_drumroll", neww);
});

const activeTab = ref("session");

function isActive(str: string) {
  return activeTab.value === str;
}

function setActive(str: string) {
  activeTab.value = str;
}

function closeModeration() {
  contextStore.setModerating(false);
}
</script>

<style lang="scss" scoped>
.nav {
  display: flex;
  gap: var(--spacer);

  .nav-item {
    padding: var(--spacer);
    background: var(--brand-color-3);
    cursor: pointer;

    &:hover,
    &.active {
      background: var(--brand-color-4);
    }
  }
}

textarea {
  min-height: 150px;
  flex-shrink: 0;
}
.hero {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}
select {
  padding: 20px;
}
button {
  position: relative;
}
.button-icon {
  color: black;
  position: absolute;
  width: 24px;
  height: 24px;
  left: var(--spacer);
}
.mod-panel {
  overflow-y: auto;
  margin: var(--spacer);
  background: var(--brand-color-6);

  display: flex;
  flex-direction: column;

  padding: var(--spacer);
  gap: var(--spacer);
}

.error {
  padding: var(--spacer);
  background: red;
  color: white;
}

.spacer {
  flex-grow: 1;
}
.you-are-moderating {
  padding: var(--spacer);
  background: var(--brand-color-2);
}

p {
  margin: 0px;
}

hr {
  min-width: 400px;
}

h2 {
  text-align: left;
  color: white;
}
</style>
