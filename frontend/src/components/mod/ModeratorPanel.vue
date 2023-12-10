import type { useSocketStore } from '@/ws/socketManager'; import type { resolveDirective } from
'vue';
<template>
  <section class="mod-panel">
    <template v-if="!compact">
      <input type="text" v-model="name" placeholder="name" />
      <p class="error" v-if="showError">Insert a name</p>
      <button @click="claimModeration">
        <span class="material-symbols-outlined button-icon">stars</span>
        Moderate session
      </button>
    </template>
    <template v-if="isModerator">
      <template v-if="!compact">
        <p class="you-are-moderating hero">
          You are moderating <span class="material-symbols-outlined">social_leaderboard</span>
        </p>
        <button @click="stopModeration">
          <span class="material-symbols-outlined button-icon">hiking</span>
          Abdicate moderation
        </button>
        <h2>Schedule</h2>
        <textarea
          rows="10"
          v-model="schedule"
          placeholder="Put items/topics here, one per line"></textarea>
        <button @click="updateSchedule">
          <span class="material-symbols-outlined button-icon">event_note</span>
          Update schedule
        </button>
      </template>
      <h2>Meeting controls</h2>
      <button @click="resetSignals">
        <span class="material-symbols-outlined button-icon">device_reset</span>
        Reset current item signals
      </button>
      <button @click="resetPoker">
        <span class="material-symbols-outlined button-icon">reset_image</span>
        Reset current item estimates
      </button>
      <hr />
      <button @click="everyoneToModerator">
        <span class="material-symbols-outlined button-icon">groups</span>
        Move everyone to current item
      </button>
      <button @click="lockItem">
        <span class="material-symbols-outlined button-icon">Lock</span>
        Lock/unlock current item
      </button>
      <button @click="finishItemAndNext">
        <span class="material-symbols-outlined button-icon">start</span>
        Finish/lock item + next
      </button>
      <hr />
      <select v-model="drumrollSelection">
        <option value="" hidden selected>Select to change drumroll sound</option>
        <option value="/drumroll-1-low.mp3">/drumroll-1-low.mp3</option>
        <option value="/drumroll-2-mid.mp3">/drumroll-2-mid.mp3</option>
        <option value="/jeopardy-fade.mp3">/jeopardy-fade.mp3</option>
      </select>
      <button @click="drumroll">
        <span class="material-symbols-outlined button-icon">music_note</span>
        Drum roll
      </button>
      <button @click="reveal">
        <span class="material-symbols-outlined button-icon">casino</span>
        Reveal estimates
      </button>
      <hr />

      <button @click="muteSounds">
        <span class="material-symbols-outlined button-icon">volume_mute</span>
        Mute/unmute all sounds
      </button>

      <div class="spacer"></div>
      <button @click="compactExpandToggle">
        <span class="material-symbols-outlined button-icon">visibility</span>
        Compact/expand
      </button>
      <button @click="closeModeration">
        <span class="material-symbols-outlined button-icon">close</span>
        Close panel
      </button>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { ActionType } from "@/domain/types";
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

const drumrollSelection = ref<string>("");
watch(drumrollSelection, (neww) => {
  socketStore.emitNamed("persist_drumroll", neww);
});

const route = useRoute();
const router = useRouter();

function drumroll() {
  socketStore.emitNamed("drumroll");
}

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

function muteSounds() {
  socketStore.emitNamed("mute_sounds_toggle");
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

function reveal() {
  socketStore.emitEvent({
    type: ActionType.POKER_REVEAL,
  });
}

function compactExpandToggle() {
  compact.value = !compact.value;
}

onMounted(() => {
  resetSchedule();
});
</script>

<style lang="scss" scoped>
textarea {
  min-height: 150px;
  flex-shrink: 0;
}
.hero {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}
select {
  padding: 20px;
}
button {
  position: relative;
}
.button-icon {
  color: black;
  position: absolute;
  width: 24px;
  height: 24px;
  left: var(--spacer);
  top: 7px;
}
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
