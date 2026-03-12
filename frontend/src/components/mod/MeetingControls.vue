<template>
  <section class="control-panel" v-if="isModerator">
    <p v-if="!route.params.code" class="no-item-hint">Navigate to an agenda item to access controls.</p>
    <template v-else>
    <div class="group">
      <label class="group-label">Reveal</label>
      <div class="row">
        <button class="primary" @click="flash($event, drumroll)">
          <span class="material-symbols-rounded button-icon">music_note</span>
          Drumroll
        </button>
        <button class="primary" @click="flash($event, reveal)">
          <span class="material-symbols-rounded button-icon">casino</span>
          {{ revealText }} ({{ totalPokerCount }})
        </button>
      </div>
      <select v-model="drumrollSelection">
        <option value="random" selected>Random!</option>
        <option v-for="drumroll in drumrolls" :key="drumroll" :value="drumroll">
          {{ drumroll }}
        </option>
      </select>
    </div>

    <div class="group">
      <label class="group-label">Item</label>
      <button class="accent" @click="flash($event, finishItemAndNext)">
        <span class="material-symbols-rounded button-icon">start</span>
        Finish item &amp; next
      </button>
      <div class="row">
        <button class="subtle" @click="flash($event, lockItem)">
          <span class="material-symbols-rounded button-icon">Lock</span>
          Lock/unlock
        </button>
        <button class="subtle" @click="flash($event, resetPoker)">
          <span class="material-symbols-rounded button-icon">reset_image</span>
          Reset estimates
        </button>
      </div>
    </div>

    <div class="group">
      <label class="group-label">Navigation</label>
      <button @click="flash($event, everyoneToModerator)">
        <span class="material-symbols-rounded button-icon">groups</span>
        Move everyone here
      </button>
    </div>

    <div class="group">
      <div class="row">
        <button class="subtle small" @click="flash($event, resetSignals)">
          <span class="material-symbols-rounded button-icon">device_reset</span>
          Reset signals
        </button>
        <button class="subtle small" @click="flash($event, muteSounds)">
          <span class="material-symbols-rounded button-icon">{{
            socketStore.playSounds ? "volume_up" : "volume_off"
          }}</span>
          {{ socketStore.playSounds ? "Mute sounds" : "Unmute sounds" }}
        </button>
      </div>
    </div>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { ActionType } from "@/domain/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const drumrolls = [
  "/drumroll-1-low.mp3",
  "/drumroll-2-mid.mp3",
  "/fx-wait.mp3",
  "/jeopardy-fade.mp3",
  "/phone-ringing-marimba.mp3",
  "/sonido-de-siguiente.mp3",
  "/tarot-shuffle.mp3",
];

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();

const drumrollSelection = ref<string>(localStorage.getItem("drumrollSelection") || "random");
watch(drumrollSelection, (neww) => {
  localStorage.setItem("drumrollSelection", neww);
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
    setTimeout(() => {
      router.push({ name: "AgendaRoute", params: { code: nextRoomCode } }).then(() => {
        everyoneToModerator();
      });
    }, 250);
  }
}

function everyoneToModerator() {
  socketStore.emitNamed("everyone_to_moderator");
}

const currentRoomState = computed(() => {
  return socketStore.getRoomState(route.params.code as string);
});
const revealed = computed(() =>
  currentRoomState.value
    ? currentRoomState.value.filter((v) => v.type === ActionType.POKER_REVEAL).length > 0
    : false,
);
const revealText = computed(() => (revealed.value ? "Hide" : "Reveal"));
const totalPokerCount = computed(
  () =>
    currentRoomState.value?.filter(
      (v) => v.type === ActionType.POKER_DEV_ESTIMATE || v.type === ActionType.POKER_TEST_ESTIMATE,
    ).length ?? 0,
);

function reveal() {
  socketStore.emitEvent({
    type: ActionType.POKER_REVEAL,
  });
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
.control-panel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 1.5);
}

.group {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacer) * 0.5);
}

.group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  color: white;
}

.row {
  display: flex;
  gap: calc(var(--spacer) * 0.5);

  button {
    flex: 1;
  }
}

select {
  padding: 8px;
  font-size: 0.8rem;
}

button.primary {
  background: var(--brand-color-1);
  color: white;
}

button.accent {
  background: var(--brand-color-2);
  color: white;
}

button.subtle {
  background: var(--brand-color-4);
  font-size: 0.85rem;
}

button.small {
  font-size: 0.8rem;
  padding: 8px;
}

.no-item-hint {
  color: white;
  opacity: 0.6;
  font-size: 0.85rem;
  margin: 0;
}

button.flashed {
  background-color: var(--brand-color-2);
  color: white;
}
</style>
