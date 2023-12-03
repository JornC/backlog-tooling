import type { useSocketStore } from '@/ws/socketManager'; import type { resolveDirective } from
'vue';
<template>
  <section class="mod-panel">
    <template v-if="!compact">
      <input type="text" v-model="name" placeholder="name" />
      <p class="error" v-if="showError">Insert a name</p>
      <button @click="claimModeration">Moderate session</button>
    </template>
    <template v-if="isModerator">
      <template v-if="!compact">
        <p class="you-are-moderating">You are moderating</p>
        <button @click="stopModeration">Abdicate moderation</button>
        <h2>Schedule</h2>
        <textarea
          rows="10"
          v-model="schedule"
          placeholder="Put items/topics here, one per line"></textarea>
        <button @click="updateSchedule">Update schedule</button>
      </template>
      <h2>Meeting controls</h2>
      <button @click="resetSignals">Reset current item signals</button>
      <button @click="resetPoker">Reset current item estimates</button>
      <hr />
      <button @click="everyoneToModerator">Move everyone to current item</button>
      <button @click="lockItem">Lock/unlock current item</button>
      <button @click="finishItemAndNext">Lock + next item</button>
      <hr />

      <div class="spacer"></div>
      <button @click="compactExpandToggle">Compact/expand</button>
      <button @click="closeModeration">Close panel</button>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useContextStore } from "@/stores/contextStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();
const contextStore = useContextStore();

const name = ref("");
const showError = ref(false);
const schedule = ref("");
const compact = ref(false);

const route = useRoute();
const router = useRouter();

const isModerator = computed(() => socketStore.isModerator);

function resetSignals() {
  socketStore.emitNamed("reset_room_signals");
}
function resetPoker() {
  socketStore.emitNamed("reset_room_poker");
}
function lockItem() {
  socketStore.emitNamed("lock_room_toggle");
}

function finishItemAndNext() {
  socketStore.emitNamed("lock_room");
  const schedule = scheduleStore.getSchedule();
  const idx = schedule.findIndex((v) => v.code === (route.params.code as string));
  const nextIdx = idx + 1;
  if (nextIdx < schedule.length) {
    const nextRoomCode = schedule[nextIdx].code;
    router.push({ name: "AgendaRoute", params: { code: nextRoomCode } }).then(() => {
      everyoneToModerator();
    });
  }
}

function updateSchedule() {
  const scheduleArr = parseSchedule(schedule.value);
  socketStore.updateSchedule(scheduleArr);
}

function parseSchedule(scheduleText: string): Array<{ title: string; code: string }> {
  const titles = scheduleText.split("\n");

  return titles
    .map((title) => {
      const normalizedCode = title.trim().toLowerCase().replace(/\s+/g, "-");

      return { title: title.trim(), code: normalizedCode };
    })
    .filter((item) => item.title !== "");
}

function resetSchedule() {
  schedule.value = scheduleStore
    .getSchedule()
    .map((v) => v.title)
    .join("\n");
}

function everyoneToModerator() {
  socketStore.emitNamed("everyone_to_moderator");
}

function claimModeration() {
  if (name.value.length === 0) {
    showError.value = true;
    return;
  }

  showError.value = false;
  socketStore.claimModeration(name.value);
}
function stopModeration() {
  socketStore.stopModeration();
}

function closeModeration() {
  contextStore.setModerating(false);
}

function compactExpandToggle() {
  compact.value = !compact.value;
}

onMounted(() => {
  resetSchedule();
});
</script>

<style lang="scss" scoped>
.mod-panel {
  overflow-y: auto;
  margin: var(--spacer);
  background: var(--brand-color-6);

  display: flex;
  flex-direction: column;

  padding: var(--spacer);
  gap: var(--spacer);
}

.error {
  padding: var(--spacer);
  background: red;
  color: white;
}

.spacer {
  flex-grow: 1;
}
.you-are-moderating {
  padding: var(--spacer);
  background: var(--brand-color-2);
}

p {
  margin: 0px;
}

hr {
  min-width: 400px;
}

h2 {
  text-align: left;
  color: white;
}
</style>
