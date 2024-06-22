<template>
  <section class="mod-panel">
    <p class="you-are-moderating hero" v-if="isModerator">
      You are moderating <span class="material-symbols-rounded">social_leaderboard</span>
    </p>
    <section class="nav">
      <div :class="{ active: isActive('user') }" @click="setActive('user')" class="nav-item">
        User
      </div>
      <div
        v-if="isIdentified"
        :class="{ active: isActive('moderator') }"
        @click="setActive('moderator')"
        class="nav-item">
        Moderator
      </div>
      <div
        v-if="isModerator"
        :class="{ active: isActive('session') }"
        @click="setActive('session')"
        class="nav-item">
        Schedule
      </div>
      <div
        v-if="isModerator"
        :class="{ active: isActive('controls') }"
        @click="setActive('controls')"
        class="nav-item">
        Controls
      </div>
    </section>
    <user-controls v-if="isActive('user')" />
    <moderator-controls v-if="isActive('moderator')" />
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
const isIdentified = computed(() => socketStore.isIdentified);

const drumrollSelection = ref<string>("");
watch(drumrollSelection, (neww) => {
  socketStore.emitNamed("persist_drumroll", neww);
});

const activeTab = ref("user");

function isActive(str: string) {
  return activeTab.value === str;
}

function setActive(str: string) {
  activeTab.value = str;
}

function closeModeration() {
  contextStore.setUserPanelActive(false);
}
</script>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}
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

  min-width: 400px;
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
