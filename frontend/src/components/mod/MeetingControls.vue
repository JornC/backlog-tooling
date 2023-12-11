<template>
  <section class="control-panel">
    <template v-if="isModerator">
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
        {{ revealText }} ({{ totalPokerCount }})
      </button>
      <hr />

      <button @click="muteSounds">
        <span class="material-symbols-outlined button-icon">volume_mute</span>
        Mute/unmute all sounds
      </button>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { ActionType } from "@/domain/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();

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

function everyoneToModerator() {
  socketStore.emitNamed("everyone_to_moderator");
}

const currentRoomState = computed(() => {
  return socketStore.getRoomState(route.params.code as string);
});
const revealed = computed(
  () => currentRoomState.value!.filter((v) => v.type === ActionType.POKER_REVEAL).length > 0,
);
const revealText = computed(() => (revealed.value ? "Hide estimates" : "Reveal estimates"));
const totalPokerCount = computed(
  () =>
    currentRoomState.value!.filter(
      (v) => v.type === ActionType.POKER_DEV_ESTIMATE || v.type === ActionType.POKER_TEST_ESTIMATE,
    ).length,
);

function reveal() {
  socketStore.emitEvent({
    type: ActionType.POKER_REVEAL,
  });
}
</script>

<style lang="scss" scoped>
.control-panel {
  display: flex;
  flex-direction: column;

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

hr {
  min-width: 400px;
}
</style>
