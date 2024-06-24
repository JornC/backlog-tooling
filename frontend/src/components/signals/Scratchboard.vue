<template>
  <div class="scratchboard-container">
    <button class="info" v-if="!isNamedUser" @click="openUserPanel">
      Register a name to contribute to the scratchboard
    </button>
    <div class="text-area">
      <textarea
        v-model="textInput"
        :disabled="!isUnlocked"
        class="scratchboard-textarea"
        @input="handleInput"></textarea>
      <div :class="{ visible: typingUserName }" class="user-notify">
        {{ typeText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContextStore } from "@/stores/contextStore";
import { useSocketStore } from "@/ws/socketManager";

const props = defineProps<{
  roomId: string;
}>();

const contextStore = useContextStore();
const socketStore = useSocketStore();

const textInput = ref("");

const scratchboardState = computed(() => socketStore.scratchboard.get(props.roomId));
const remoteText = computed(() => scratchboardState.value?.text);
watch(
  remoteText,
  (newValue, _oldValue) => {
    if (!isHandlingInput()) {
      textInput.value = newValue ?? "";
    }
  },
  { immediate: true },
);

const isNamedUser = computed(() => socketStore.name);

const typingUserName = computed(() => {
  const state = scratchboardState.value;
  return state?.typingUserId ? socketStore.roster.get(state.typingUserId) : undefined;
});

const typeText = computed(() =>
  !scratchboardState.value?.typingUserId
    ? " "
    : scratchboardState.value?.typingUserId === socketStore.userId
      ? "You are typing"
      : typingUserName.value + " is typing",
);

const isUnlocked = computed(() => {
  const state = scratchboardState.value;
  return (isNamedUser.value && !state?.typingUserId) || isHandlingInput();
});

function isHandlingInput() {
  const state = scratchboardState.value;
  return state?.typingUserId == socketStore.userId;
}

function handleInput() {
  socketStore.scratchboardUpdate(props.roomId, textInput.value);
}

function openUserPanel() {
  contextStore.setUserPanelActive(true);
}
</script>

<style scoped>
.scratchboard-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 600px;
  gap: var(--spacer);
}

.scratchboard-textarea {
  width: 100%;
  height: 200px;
  resize: none;
  border: 2px solid #ccc;
  padding: var(--spacer) calc(var(--spacer) - 2px);
  font-size: 16px;
}

.text-area {
  position: relative;
  width: 100%;
}

.user-notify {
  position: absolute;
  background: var(--brand-color-1);
  color: white;
  padding: var(--spacer);
  bottom: 0px;
  width: calc(100%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease-out;

  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;

  &.visible {
    opacity: 1;
  }
}

.scratchboard-textarea:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
}
</style>
