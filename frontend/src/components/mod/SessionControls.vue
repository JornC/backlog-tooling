<template>
  <section class="session-panel">
    <textarea
      rows="10"
      v-model="schedule"
      placeholder="Put items/topics here, one per line"></textarea>
    <button @click="updateSchedule">
      <span class="material-symbols-rounded button-icon">event_note</span>
      Update schedule
    </button>
    <ul>
      <li>
        <strong>Group Titles</strong>: Lines starting with "# " mark the beginning of a new group.
      </li>
      <li><strong>End of a Group</strong>: The line "-- group" indicates the end of a group.</li>
      <li>
        <strong>AER-* Handling</strong>: Items with titles starting with "aer-" (case insensitive)
        provide the "poker" feature.
      </li>
      <li>
        <strong>Item description 1</strong>: For AER-* items, the text following the AER-* word is a
        description.
      </li>
      <li>
        <strong>Item description 2</strong>: Lines surrounded by "quotation marks" indicate a
        paragraph of description text for the previous item. Links will be hyperlink-ified.
      </li>
      <li>
        <strong>Normal Items</strong>: Other lines are treated as individual items within the
        current group, or as standalone items if not within a group.
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import { useScheduleStore } from "@/stores/scheduleStore";
import { useSocketStore } from "@/ws/socketManager";

const socketStore = useSocketStore();
const scheduleStore = useScheduleStore();

const schedule = ref("");

function updateSchedule() {
  const scheduleArr = parseSchedule(schedule.value);
  socketStore.updateSchedule(scheduleArr);
}

function parseSchedule(
  scheduleText: string,
): Array<{ title: string; code: string; description?: string; groupTitle?: string }> {
  const lines = scheduleText.split("\n");
  let previousItem: {
    title: string;
    code: string;
    description?: string;
    groupTitle: string | undefined;
  } | null;
  let currentGroupTitle: string | undefined;
  let currentGroupDescription: Array<String> = new Array();

  const items = lines
    .map((line) => {
      if (line.startsWith("# ")) {
        currentGroupTitle = line.substring(2).trim();
        return null;
      }

      if (line.startsWith('"') && line.endsWith('"')) {
        currentGroupDescription.push(line.substring(1, line.length - 1));
        if (previousItem) {
          previousItem.description =
            (previousItem.description ? previousItem.description + "\n" : "") +
            currentGroupDescription.join("\n");
        }
        return null;
      }

      let description =
        line.startsWith("AER-") && line.indexOf(" ") > -1
          ? line.substring(line.indexOf(" ") + 1)
          : undefined;

      if (line.trim() === "-- group") {
        currentGroupTitle = undefined;
        return null;
      }

      const title = line.startsWith("AER-") ? line.split(" ", 2)[0] : line.trim();
      const normalizedCode = title.toLowerCase().replace(/\s+/g, "-");

      const item =
        title !== ""
          ? {
              title,
              description,
              code: normalizedCode,
              groupTitle: currentGroupTitle,
            }
          : null;

      previousItem = item;
      currentGroupDescription = new Array();
      return item;
    })
    .filter((item) => item !== null) as Array<{
    title: string;
    code: string;
    description?: string;
    groupTitle?: string;
  }>;
  console.log(items);
  return items;
}

function resetSchedule() {
  const groupedSchedule = scheduleStore.groupedSchedule;

  const scheduleText = groupedSchedule
    .map((group, index, array) => {
      const groupHeader = group.groupTitle ? `# ${group.groupTitle}\n` : "";
      const groupItems = group.items
        .map((item) =>
          [
            item.title +
              ((item.title.startsWith("AER-") && item.description?.length) || 0 > 0
                ? " " + item.description?.split("\n")[0]
                : ""),
            item.description
              ?.split("\n")
              .slice(item.title.startsWith("AER-") ? 1 : 0)
              .map((v) => '"' + v + '"')
              .join("\n"),
          ]
            .filter((v) => v !== "")
            .join("\n"),
        )
        .join("\n");

      const addGroupSeparator =
        group.groupTitle && index < array.length - 1 && !array[index + 1].groupTitle;

      return groupHeader + groupItems + (addGroupSeparator ? "\n-- group" : "");
    })
    .join("\n");

  schedule.value = scheduleText;
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
button {
  position: relative;
}
.button-icon {
  color: black;
  position: absolute;
  width: 24px;
  height: 24px;
  left: var(--spacer);
}

.error {
  padding: var(--spacer);
  background: red;
  color: white;
}

p {
  margin: 0px;
}

h2 {
  text-align: left;
  color: white;
}
</style>
