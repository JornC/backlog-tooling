<template>
  <div class="pin-overlay">
    <div class="pin-card">
      <h2>Session PIN required</h2>
      <p>Enter the 4-digit PIN shared by the moderator.</p>

      <div class="digit-boxes" @click="hiddenInput?.focus()">
        <div v-for="i in 4" :key="i" class="digit-box" :class="{ active: digits.length === i - 1 }">
          {{ digits[i - 1] ?? "" }}
        </div>
      </div>

      <p v-if="error" class="error">Invalid PIN. Try again.</p>
      <p v-if="submitting" class="status">Verifying...</p>

      <!-- Hidden input captures keyboard/mobile input -->
      <input
        ref="hiddenInput"
        v-model="raw"
        type="text"
        inputmode="numeric"
        maxlength="4"
        class="hidden-input"
        autofocus
        @input="onInput" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const raw = ref("");
const error = ref(false);
const submitting = ref(false);
const hiddenInput = ref<HTMLInputElement>();

const digits = computed(() => raw.value.replace(/\D/g, "").slice(0, 4).split(""));

function onInput() {
  // Strip non-digits
  raw.value = raw.value.replace(/\D/g, "").slice(0, 4);
  error.value = false;

  if (raw.value.length === 4) {
    submit();
  }
}

async function submit() {
  submitting.value = true;
  const ok = await socketStore.submitPin(raw.value);
  submitting.value = false;
  if (!ok) {
    error.value = true;
    raw.value = "";
    nextTick(() => hiddenInput.value?.focus());
  }
}

onMounted(() => {
  hiddenInput.value?.focus();
});
</script>

<style lang="scss" scoped>
.pin-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
}

.pin-card {
  background: var(--brand-color-3, #2a2a2a);
  color: var(--brand-color-1, #fff);
  padding: 2.5rem 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  position: relative;

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
  }

  p {
    margin: 0 0 1.5rem;
    opacity: 0.7;
    font-size: 0.9rem;
  }
}

.digit-boxes {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  cursor: text;
}

.digit-box {
  width: 60px;
  height: 70px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  transition: border-color 0.15s;

  &.active {
    border-color: var(--brand-color-1, #fff);
  }
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.error {
  color: #ff6b6b;
  font-weight: bold;
  margin-top: 0;
}

.status {
  opacity: 0.6;
}
</style>
