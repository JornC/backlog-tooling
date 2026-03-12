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

    <hr />

    <div class="email-section">
      <label class="section-label">Email recipients</label>
      <p class="hint">
        These addresses receive the session summary on finish.
        Server-configured recipients are always included separately.
        The full list is shared with and preserved by all future moderators.
      </p>
      <ul v-if="socketStore.sessionEmails.length" class="email-list">
        <li v-for="(email, index) in socketStore.sessionEmails" :key="email">
          <span class="email-text">{{ email }}</span>
          <button class="icon-only remove" @click="removeEmail(index)">
            <span class="material-symbols-rounded">close</span>
          </button>
        </li>
      </ul>
      <div class="row">
        <input
          type="email"
          v-model="newEmail"
          placeholder="you@example.com"
          @keyup.enter="addEmail"
        />
        <button class="icon-only" @click="addEmail">
          <span class="material-symbols-rounded">add</span>
        </button>
      </div>
    </div>

    <template v-if="socketStore.hasPin">
      <hr />
      <p class="finish-explanation">
        Finishing the session posts consensus estimates to JIRA (ties and
        existing values are skipped, never overwritten), sends a summary email
        to the recipients above, then resets everything:
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
import { ref } from "vue";

const socketStore = useSocketStore();
const newEmail = ref("");

function addEmail() {
  const email = newEmail.value.trim();
  if (!email || socketStore.sessionEmails.includes(email)) {
    return;
  }
  socketStore.updateSessionEmails([...socketStore.sessionEmails, email]);
  newEmail.value = "";
}

function removeEmail(index: number) {
  const filtered = socketStore.sessionEmails.filter((_, i) => i !== index);
  socketStore.updateSessionEmails(filtered);
}

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

.email-section {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.5);
}

.section-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  color: white;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.4;
}

.email-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.25);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--spacer) * 0.5) calc(var(--spacer) * 0.75);
    background: var(--brand-color-4);
    border-radius: 4px;
  }
}

.email-text {
  font-size: 0.9rem;
  word-break: break-all;
}

.row {
  display: flex;
  gap: calc(var(--spacer) * 0.5);

  input {
    flex: 1;
    min-width: 0;
  }
}

button.icon-only {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
}

button.remove {
  background: transparent;
  padding: 4px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
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
