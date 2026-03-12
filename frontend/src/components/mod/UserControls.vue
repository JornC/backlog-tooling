<template>
  <section class="session-panel">
    <p>Either</p>
    <input type="text" v-model="name" placeholder="name" />
    <p class="error" v-if="showError">Insert a name</p>
    <button @click="updateName">
      <span class="material-symbols-rounded button-icon">badge</span>
      Set name
    </button>
    <p>Or</p>
    <button @click="setRandomName(random1)">
      <span class="material-symbols-rounded button-icon">shuffle</span>
      Random name ({{ random1 }})
    </button>
    <button @click="setRandomName(random2)">
      <span class="material-symbols-rounded button-icon">shuffle</span>
      Random name ({{ random2 }})
    </button>
    <button @click="setRandomName(random3)">
      <span class="material-symbols-rounded button-icon">shuffle</span>
      Random name ({{ random3 }})
    </button>
    <template v-if="socketStore.name">
      <hr />
      <button @click="forget()">
        <span class="material-symbols-rounded button-icon">delete_history</span>
        Forget name
      </button>
    </template>
    <template v-if="socketStore.name">
      <hr />
      <label class="email-label">
        Email (for session summary)
        <input type="email" v-model="email" placeholder="you@example.com" @change="saveEmail" />
      </label>
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
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useSocketStore } from "@/ws/socketManager";
import dockerNames from "docker-names";
import { ref } from "vue";

const socketStore = useSocketStore();

const name = ref(socketStore.name);
const email = ref(localStorage.getItem("moderatorEmail") || "");
const showError = ref(false);

const random1 = ref(generateRandomName());
const random2 = ref(generateRandomName());
const random3 = ref(generateRandomName());

const isModerator = computed(() => socketStore.isModerator);
const hasModerator = computed(() => socketStore.moderator);

function updateName() {
  if (!name.value) {
    showError.value = true;
    return;
  }

  socketStore.updateName(name.value);
}

function forget() {
  name.value = "";
  socketStore.updateName(undefined);
}

function setRandomName(randomName: string) {
  name.value = randomName;
  updateName();
}

function generateRandomName(): string {
  const randomName = dockerNames.getRandomName();
  return toPascalCaseWithSpace(randomName);
}

function toPascalCaseWithSpace(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function saveEmail() {
  if (email.value) {
    localStorage.setItem("moderatorEmail", email.value);
  } else {
    localStorage.removeItem("moderatorEmail");
  }
}

function claimModeration() {
  if (hasModerator.value) {
    if (
      !window.confirm(
        `Are you sure you want to take moderation responsibilities away from ${ 
          socketStore.moderator 
          }?`,
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

<style scoped>
.error {
  color: red;
}
</style>

<style lang="scss" scoped>
.session-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}
hr {
  min-width: 400px;
}

p {
  margin: 0px;
  color: white;
}

.email-label {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) / 2);
  color: white;
}
</style>
