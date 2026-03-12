<template>
  <section class="session-panel">
    <div class="group">
      <label class="group-label">Name</label>
      <div class="row">
        <input type="text" v-model="name" placeholder="Your name" @keyup.enter="updateName" />
        <button class="icon-only" @click="updateName">
          <span class="material-symbols-rounded">badge</span>
        </button>
      </div>
      <p class="error" v-if="showError">Enter a name first</p>
      <button class="subtle" @click="pickRandomName">
        <span class="material-symbols-rounded button-icon">shuffle</span>
        Random: {{ randomName }}
      </button>
    </div>

    <template v-if="socketStore.name">
      <div class="group">
        <label class="group-label">Session</label>
        <label class="field-label">
          Email (for session summary)
          <input type="email" v-model="email" placeholder="you@example.com" @input="saveEmail" />
        </label>
        <button class="primary" @click="claimModeration" v-if="!isModerator">
          <span class="material-symbols-rounded button-icon">stars</span>
          {{ hasModerator ? "Take moderation" : "Claim moderation" }}
        </button>
        <button @click="stopModeration" v-if="isModerator">
          <span class="material-symbols-rounded button-icon">hiking</span>
          Abdicate moderation
        </button>
      </div>

      <div class="group">
        <button class="subtle small" @click="forget()">
          <span class="material-symbols-rounded button-icon">delete_history</span>
          Forget name
        </button>
      </div>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useSocketStore } from "@/ws/socketManager";
import dockerNames from "docker-names";
import { ref } from "vue";

const socketStore = useSocketStore();

const name = ref(socketStore.name || localStorage.getItem("moderatorName") || "");
const email = ref(localStorage.getItem("moderatorEmail") || "");
const showError = ref(false);
const randomName = ref(generateRandomName());

const isModerator = computed(() => socketStore.isModerator);
const hasModerator = computed(() => socketStore.moderator);

function updateName() {
  if (!name.value) {
    showError.value = true;
    return;
  }

  showError.value = false;
  localStorage.setItem("moderatorName", name.value);
  socketStore.updateName(name.value);
}

function forget() {
  name.value = "";
  localStorage.removeItem("moderatorName");
  socketStore.updateName(undefined);
}

function pickRandomName() {
  name.value = randomName.value;
  localStorage.removeItem("moderatorName");
  socketStore.updateName(randomName.value);
  randomName.value = generateRandomName();
}

function generateRandomName(): string {
  return dockerNames
    .getRandomName()
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function saveEmail() {
  if (email.value) {
    localStorage.setItem("moderatorEmail", email.value);
  } else {
    localStorage.removeItem("moderatorEmail");
  }
  if (isModerator.value && email.value) {
    socketStore.emitNamed("register_email", email.value);
  }
}

function claimModeration() {
  if (hasModerator.value) {
    if (
      !window.confirm(
        `Take over moderation from ${socketStore.moderator}?`,
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
.session-panel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 1.5);
}

.group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.5);
}

.group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  color: white;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) / 2);
  color: white;
  font-size: 0.85rem;
}

.row {
  display: flex;
  gap: calc(var(--spacer) * 0.5);

  input {
    flex: 1;
    min-width: 0;
  }
}

.error {
  color: red;
  margin: 0;
  font-size: 0.85rem;
}

button.primary {
  background: var(--brand-color-1);
  color: white;
}

button.subtle {
  background: var(--brand-color-4);
  font-size: 0.85rem;
}

button.small {
  font-size: 0.8rem;
  padding: 8px;
}

button.icon-only {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
}

p {
  margin: 0;
  color: white;
}
</style>
