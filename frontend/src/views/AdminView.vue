<template>
  <div class="admin-container">
    <div class="admin-card">
      <h1>Admin</h1>

      <template v-if="!authenticated">
        <div class="input-row">
          <input
            type="password"
            v-model="secret"
            placeholder="Admin secret"
            @keyup.enter="authenticate" />
          <button class="primary" @click="authenticate">Login</button>
        </div>
        <p class="error" v-if="authError">{{ authError }}</p>
      </template>

      <template v-else>
        <div class="status-card" :class="{ active: status?.hasPin }">
          <p class="status-row">
            <span class="label">Session:</span>
            <span>{{ status?.hasPin ? "Active (PIN set)" : "No active session" }}</span>
          </p>
          <p class="status-row">
            <span class="label">Connected:</span>
            <span>{{ status?.numConnected ?? "..." }}</span>
          </p>
          <p class="status-row">
            <span class="label">Moderator:</span>
            <span>{{
              status?.moderatorReconnecting
                ? "Reconnecting..."
                : status?.moderatorName || (status?.hasModerator ? "Unknown" : "None")
            }}</span>
          </p>
        </div>

        <button
          class="danger"
          :disabled="resetting || !status?.hasPin"
          @click="confirmReset">
          Force reset session
        </button>
        <p class="hint" v-if="!status?.hasPin">No active session to reset.</p>
        <p class="hint" v-if="resetDone">Session has been reset.</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdminStatus {
  numConnected: number;
  hasPin: boolean;
  hasModerator: boolean;
  moderatorName: string | null;
  moderatorReconnecting: boolean;
}

const secret = ref("");
const authenticated = ref(false);
const authError = ref("");
const status = ref<AdminStatus | null>(null);
const resetting = ref(false);
const resetDone = ref(false);

let pollTimer: ReturnType<typeof setInterval> | undefined;

async function apiFetch(path: string, method = "GET") {
  return fetch(path, {
    method,
    headers: { "x-admin-secret": secret.value },
  });
}

async function authenticate() {
  authError.value = "";
  const res = await apiFetch("/api/admin/status");
  if (!res.ok) {
    authError.value = "Invalid secret";
    return;
  }
  authenticated.value = true;
  status.value = await res.json();
  pollTimer = setInterval(fetchStatus, 5000);
}

async function fetchStatus() {
  const res = await apiFetch("/api/admin/status");
  if (res.ok) {
    status.value = await res.json();
  }
}

async function confirmReset() {
  if (!confirm("This will end the session and disconnect all users. Continue?")) {
    return;
  }
  resetting.value = true;
  resetDone.value = false;
  await apiFetch("/api/admin/reset", "POST");
  resetting.value = false;
  resetDone.value = true;
  await fetchStatus();
}

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>

<style lang="scss" scoped>
.admin-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: calc(var(--spacer) * 3) var(--spacer);
  min-height: 100vh;
}

.admin-card {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.75);
  max-width: 400px;
  width: 100%;
}

h1 {
  margin: 0;
  font-size: 1.4em;
}

.input-row {
  display: flex;
  gap: calc(var(--spacer) * 0.5);

  input {
    flex: 1;
    min-width: 0;
  }
}

.status-card {
  padding: calc(var(--spacer) * 0.75);
  border-radius: var(--radius);
  background: var(--brand-color-4);
  transition: background var(--anim);

  &.active {
    background: var(--brand-color-2);
  }
}

.status-row {
  margin: 4px 0;
  font-size: 0.9em;

  .label {
    font-weight: bold;
    margin-right: 0.5em;
  }
}

.error {
  color: red;
  margin: 0;
  font-size: 0.85rem;
}

.hint {
  font-size: 0.8rem;
  opacity: 0.5;
  margin: 0;
}

button.primary {
  background: var(--brand-color-1);
  color: white;
}

button.danger {
  background: #c0392b;
  color: white;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
