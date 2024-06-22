<template>
  <section class="session-panel">
    <button @click="claimModeration" v-if="!isModerator">
      <span class="material-symbols-rounded button-icon">stars</span>
      {{ hasModerator ? "Steal moderation" : "Claim moderation" }}
    </button>
    <template v-if="isModerator">
      <button @click="stopModeration">
        <span class="material-symbols-rounded button-icon">hiking</span>
        Abdicate moderation
      </button>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();

const showError = ref(false);

const isModerator = computed(() => socketStore.isModerator);
const hasModerator = computed(() => socketStore.moderator);

function claimModeration() {
  if (hasModerator.value) {
    if (
      !window.confirm(
        "Are you sure you want to take moderation responsibilities away from " +
          socketStore.moderator +
          "?",
      )
    ) {
      return;
    }
  }

  showError.value = false;
  socketStore.claimModeration();
}
function stopModeration() {
  socketStore.stopModeration();
}
</script>

<style lang="scss" scoped>
ul {
  color: white;
  max-width: 400px;
  padding: var(--spacer);
  margin: 0px;
}
.session-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}
textarea {
  min-height: 150px;
  flex-shrink: 0;
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

.error {
  padding: var(--spacer);
  background: red;
  color: white;
}
.you-are-moderating {
  padding: var(--spacer);
  background: var(--brand-color-2);
}

p {
  margin: 0px;
}

h2 {
  text-align: left;
  color: white;
}
</style>
