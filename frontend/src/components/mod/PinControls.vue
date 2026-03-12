<template>
  <section class="pin-panel">
    <template v-if="socketStore.hasPin">
      <p>Session PIN active. Share it verbally.</p>
      <div class="pin-display">{{ socketStore.sessionPin }}</div>
      <button @click="flash($event, resetSession)">
        <span class="material-symbols-rounded button-icon">restart_alt</span>
        Clear PIN and reset session
      </button>
      <button @click="flash($event, setPin)">
        <span class="material-symbols-rounded button-icon">refresh</span>
        Generate new PIN
      </button>
    </template>
    <template v-else>
      <p>No session PIN set. Anyone with the link can join.</p>
      <button @click="flash($event, setPin)">
        <span class="material-symbols-rounded button-icon">lock</span>
        Set session PIN
      </button>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();

function setPin() {
  if (
    socketStore.hasPin &&
    !window.confirm("This will disconnect everyone and require them to re-enter the new PIN.")
  ) {
    return;
  }
  socketStore.setPin();
}

function resetSession() {
  if (
    !window.confirm(
      "This will wipe everything: PIN, schedule, all signals, estimates, scratchboard notes, and disconnect everyone (including you). Are you sure?",
    )
  ) {
    return;
  }
  socketStore.resetSession();
}

function flash(event: MouseEvent, action: () => void) {
  const button = (event.target as HTMLElement).closest("button");
  if (button) {
    button.classList.add("flashed");
    setTimeout(() => button.classList.remove("flashed"), 300);
  }
  action();
}
</script>

<style lang="scss" scoped>
.pin-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}

.pin-display {
  font-size: 3rem;
  font-weight: bold;
  letter-spacing: 0.5em;
  text-align: center;
  padding: 1rem;
}

p {
  margin: 0;
  color: white;
}

button.flashed {
  background-color: var(--brand-color-2);
  color: white;
}
</style>
