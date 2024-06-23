<template>
  <div class="scratchboard-container">
    <textarea
      v-model="textInput"
      :disabled="isLocked"
      class="scratchboard-textarea"
      @input="handleInput"></textarea>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/ws/socketManager";
import { ref } from "vue";

const props = defineProps<{
  roomId: string;
}>();

const socketStore = useSocketStore();

const textInput = ref("");

const scratchboardState = computed(() => socketStore.scratchboard.get(props.roomId));
const remoteText = computed(() => scratchboardState.value?.text);
watch(remoteText, (newValue, _oldValue) => {
  if (scratchboardState.value?.typingUserId != socketStore.userId) {
    return;
  }

  textInput.value = newValue ?? "";
});

const isLocked = computed(() => !!scratchboardState.value?.typingUserId);

function handleInput() {
  if (scratchboardState.value?.typingUserId != socketStore.userId) {
    return;
  }

  socketStore.scratchboardUpdate(props.roomId, textInput.value);
}
</script>

<style scoped>
.scratchboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.scratchboard-textarea {
  width: 100%;
  height: 200px;
  resize: none;
  border: 2px solid #ccc;
  padding: 10px;
  font-size: 16px;
}

.scratchboard-textarea:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
}
</style>
