<template>
  <section class="session-panel">
    <p class="you-are-moderating hero" v-if="isModerator">
      You are moderating <span class="material-symbols-rounded">social_leaderboard</span>
    </p>
    <input type="text" v-model="name" placeholder="name" />
    <p class="error" v-if="showError">Insert a name</p>
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

const name = ref("");
const showError = ref(false);

const isModerator = computed(() => socketStore.isModerator);
const hasModerator = computed(() => socketStore.moderator);

function claimModeration() {
  if (name.value.length === 0) {
    showError.value = true;
    return;
  }

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
  socketStore.claimModeration(name.value);
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
.hero {
  display: flex;
  align-items: center;
  gap: var(--spacer);
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
