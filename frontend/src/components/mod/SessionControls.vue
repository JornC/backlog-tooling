<template>
  <section class="session-panel">
    <p class="you-are-moderating hero" v-if="isModerator">
      You are moderating <span class="material-symbols-outlined">social_leaderboard</span>
    </p>
    <input type="text" v-model="name" placeholder="name" />
    <p class="error" v-if="showError">Insert a name</p>
    <button @click="claimModeration">
      <span class="material-symbols-outlined button-icon">stars</span>
      Moderate session
    </button>
    <template v-if="isModerator">
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
      <ul>
        <li>
          <strong>Group Titles</strong>: Lines starting with "# " mark the beginning of a new group.
        </li>
        <li><strong>End of a Group</strong>: The line "-- group" indicates the end of a group.</li>
        <li>
          <strong>Normal Items</strong>: Other lines are treated as individual items within the
          current group, or as standalone items if not within a group.
        </li>
        <li>
          <strong>AER-* Handling</strong>: Items with titles starting with "aer-" (case insensitive)
          provide the "poker" feature.
        </li>
      </ul>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();

const name = ref("");
const showError = ref(false);
const schedule = ref("");

const isModerator = computed(() => socketStore.isModerator);

function updateSchedule() {
  const scheduleArr = parseSchedule(schedule.value);
  socketStore.updateSchedule(scheduleArr);
}

function parseSchedule(
  scheduleText: string,
): Array<{ title: string; code: string; groupTitle?: string }> {
  const lines = scheduleText.split("\n");
  let currentGroupTitle: string | undefined;

  return lines
    .map((line) => {
      if (line.startsWith("# ")) {
        currentGroupTitle = line.substring(2).trim();
        return null;
      }

      if (line.trim() === "-- group") {
        currentGroupTitle = undefined;
        return null;
      }

      const title = line.trim();
      const normalizedCode = title.toLowerCase().replace(/\s+/g, "-");

      return title !== "" ? { title, code: normalizedCode, groupTitle: currentGroupTitle } : null;
    })
    .filter((item) => item !== null) as Array<{ title: string; code: string; groupTitle?: string }>;
}

function resetSchedule() {
  const groupedSchedule = scheduleStore.groupedSchedule;

  const scheduleText = groupedSchedule
    .map((group, index, array) => {
      const groupHeader = group.groupTitle ? `# ${group.groupTitle}\n` : "";
      const groupItems = group.items.map((item) => item.title).join("\n");

      const addGroupSeparator =
        group.groupTitle && index < array.length - 1 && !array[index + 1].groupTitle;

      return groupHeader + groupItems + (addGroupSeparator ? "\n-- group" : "");
    })
    .join("\n");

  schedule.value = scheduleText;
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

onMounted(() => {
  resetSchedule();
});
</script>

<style lang="scss" scoped>
ul {
  color: white;
  max-width: 400px;
  padding: var(--spacer);
  margin: 0px;
}
.session-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}
textarea {
  min-height: 150px;
  flex-shrink: 0;
}
.hero {
  display: flex;
  align-items: center;
  gap: var(--spacer);
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

.error {
  padding: var(--spacer);
  background: red;
  color: white;
}
.you-are-moderating {
  padding: var(--spacer);
  background: var(--brand-color-2);
}

p {
  margin: 0px;
}

h2 {
  text-align: left;
  color: white;
}
</style>
