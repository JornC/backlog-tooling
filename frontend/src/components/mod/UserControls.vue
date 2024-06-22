<template>
  <section class="session-panel">
    <p>Either</p>
    <input type="text" v-model="name" placeholder="name" />
    <p class="error" v-if="showError">Insert a name</p>
    <button @click="updateName">Handshake</button>
    <p>Or</p>
    <button @click="setRandomName1">Random name ({{ random1 }})</button>
    <button @click="setRandomName2">Random name ({{ random2 }})</button>
    <button @click="setRandomName3">Random name ({{ random3 }})</button>
  </section>
</template>

<script lang="ts" setup>
import { useSocketStore } from "@/ws/socketManager";
import dockerNames from "docker-names";
import { ref } from "vue";

const socketStore = useSocketStore();

const name = ref(socketStore.name);
const showError = ref(false);

const random1 = ref(generateRandomName());
const random2 = ref(generateRandomName());
const random3 = ref(generateRandomName());

function updateName() {
  if (!name.value) {
    showError.value = true;
    return;
  }

  socketStore.updateName(name.value);
}

function setRandomName1() {
  name.value = random1.value;
  updateName();
}

function setRandomName2() {
  name.value = random2.value;
  updateName();
}

function setRandomName3() {
  name.value = random3.value;
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
</style>
