<template>
  <section class="pin-panel">
    <template v-if="socketStore.hasPin">
      <p>Session PIN active. Share it verbally or via private channels (e.g. Mattermost).</p>
      <div class="pin-display">{{ socketStore.sessionPin }}</div>
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

    <template v-if="socketStore.hasPin">
      <hr />
      <p class="finish-explanation">
        Finishing the session posts consensus estimates to JIRA (ties and
        existing values are skipped, never overwritten), sends a summary email
        to all moderators who provided their address, then resets everything:
        schedule, estimates, emails, scratchboard, and PIN are all cleared.
        Everyone is disconnected.
      </p>
      <button class="finish-button" @click="flash($event, finishSession)">
        <span class="material-symbols-rounded button-icon">stop_circle</span>
        Finish session
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

function finishSession() {
  if (
    !window.confirm(
      "This will finish the session: post estimates to JIRA, send the summary email, and disconnect everyone. Are you sure?",
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

.finish-explanation {
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.4;
}

.finish-button {
  background: var(--brand-color-2);
}

p {
  margin: 0;
  color: white;
}

hr {
  min-width: 400px;
}

button.flashed {
  background-color: var(--brand-color-2);
  color: white;
}
</style>
