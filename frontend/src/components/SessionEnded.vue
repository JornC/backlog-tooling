<template>
  <div class="session-ended">
    <span class="material-symbols-rounded icon">check_circle</span>
    <h2>Session ended</h2>
    <p>The session has been finished by the moderator.</p>
    <button @click="reload">
      <span class="material-symbols-rounded button-icon">refresh</span>
      Start fresh
    </button>
  </div>
</template>

<script setup lang="ts">
function reload() {
  window.location.reload();
}
</script>

<style lang="scss" scoped>
.session-ended {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 2rem;
}

h2 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.4rem;
}

p {
  margin: 0 0 1.5rem;
  opacity: 0.7;
  font-size: 0.9rem;
}

button {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacer) * 0.5);

  .button-icon {
    position: static;
  }
}

.icon {
  font-size: 3rem;
  color: var(--brand-color-2);
}
</style>
