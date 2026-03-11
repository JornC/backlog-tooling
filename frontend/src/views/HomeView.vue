<template>
  <div class="home-container">
    <section class="expandable" @click="changelogRevealed = !changelogRevealed">
      <h2>
        Changelog <span class="reveal">({{ changelogRevealed ? "-" : "+" }})</span>
      </h2>
      <template v-if="changelogRevealed">
        <article v-for="entry in changelog.slice().reverse()" :key="entry.version">
          <h3>
            {{ entry.version }} -
            <time :datetime="entry.date.toISOString()">{{ formatDate(entry.date) }}</time>
          </h3>
          <ul>
            <li v-for="change in entry.changes" :key="change.description">
              <strong>{{ change.type }}:</strong> {{ change.description }}
            </li>
          </ul>
        </article>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Change {
  type: string;
  description: string;
}

interface ChangelogEntry {
  version: string;
  date: Date;
  changes: Change[];
}

const changelogRevealed = ref(false);

const changelog = ref<ChangelogEntry[]>([
  {
    version: "v0.1",
    date: new Date("2023-12-03"),
    changes: [
      { type: "Added", description: "Signal mechanism" },
      { type: "Added", description: "Estimation mechanism" },
    ],
  },
  {
    version: "v0.2",
    date: new Date("2023-12-04"),
    changes: [
      { type: "Added", description: "Schedule" },
      { type: "Added", description: "Moderator panel" },
    ],
  },
  {
    version: "v1.0",
    date: new Date("2023-12-05"),
    changes: [
      { type: "Updated", description: "Estimates split into test/dev" },
      { type: "Added", description: "Drumroll" },
    ],
  },
  {
    version: "v1.1",
    date: new Date("2023-12-10"),
    changes: [{ type: "Updated", description: "Estimate reveal is now a moderator responsibility" }],
  },
  {
    version: "v1.2",
    date: new Date("2023-12-11"),
    changes: [
      { type: "Updated", description: "More organised moderator panel" },
      { type: "Added", description: "Summary page" },
    ],
  },
  {
    version: "v1.3",
    date: new Date("2023-12-12"),
    changes: [{ type: "Updated", description: "Schedule items can now be organised into groups" }],
  },
  {
    version: "v1.4",
    date: new Date("2023-12-16"),
    changes: [
      { type: "Updated", description: "Usability changes and mobile compatibility/accessibility" },
    ],
  },
  {
    version: "v1.5",
    date: new Date("2024-01-18"),
    changes: [
      { type: "Added", description: "Changelog" },
      { type: "Added", description: "Optional item descriptions" },
    ],
  },
  {
    version: "v1.6",
    date: new Date("2024-01-23"),
    changes: [{ type: "Added", description: "User counts per item" }],
  },
  {
    version: "v1.7",
    date: new Date("2024-01-29"),
    changes: [
      {
        type: "Updated",
        description: "Locked item states are no longer modified when users disconnect",
      },
    ],
  },
  {
    version: "v1.7",
    date: new Date("2024-02-13"),
    changes: [
      {
        type: "Updated",
        description: "Drumroll sound is now random by default",
      },
      {
        type: "Updated",
        description: "Item descriptions can now be added more compactly",
      },
    ],
  },
  {
    version: "v1.8",
    date: new Date("2024-02-20"),
    changes: [
      {
        type: "Updated",
        description: "Jira links now work on mobile",
      },
    ],
  },
  {
    version: "v1.9",
    date: new Date("2024-03-01"),
    changes: [
      {
        type: "Added",
        description: "Added ? to the estimate options",
      },
    ],
  },
  {
    version: "v1.10",
    date: new Date("2024-03-01"),
    changes: [
      {
        type: "Updated",
        description: "Don't play sounds when entering a room",
      },
      {
        type: "Added",
        description: "Added 'tap out' signal",
      },
    ],
  },
  {
    version: "v1.11",
    date: new Date("2024-06-22"),
    changes: [
      {
        type: "Updated",
        description: "Changed the way that locked rooms are visualised and moved to/from etc.",
      },
      {
        type: "Added",
        description:
          "A scratchboard which users can use when they have registered a name to create a common text for each item",
      },
      {
        type: "Updated",
        description: "Made the design slightly more compact",
      },
      {
        type: "Updated",
        description:
          "Change the way that user and moderation controls work - users can now always claim moderation",
      },
      {
        type: "Updated",
        description: "Remove double colons from aer-* items",
      },
    ],
  },
  {
    version: "v2.0",
    date: new Date("2026-03-11"),
    changes: [
      { type: "Added", description: "Theme system: modern, fun, and funner (clown) themes" },
      { type: "Added", description: "Shy mode: your signals don't make sound for others" },
      { type: "Added", description: "Collapsible settings panel with persisted preferences" },
      { type: "Added", description: "Toggle visibility of signals and scratchboard sections" },
      { type: "Added", description: "Mobile-friendly two-tab layout (Agenda / Item)" },
      { type: "Updated", description: "Smooth CSS transitions when switching themes" },
      { type: "Updated", description: "All user preferences persisted to local storage" },
      { type: "Updated", description: "Renamed poker to estimates" },
      { type: "Updated", description: "Modernised dependency stack (Vite 6, Vue 3.5, ESLint 9)" },
      { type: "Updated", description: "Combined API and frontend into a single service" },
    ],
  },
]);

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat("en-CA", options).format(date);
};
</script>

<style lang="scss" scoped>
.expandable {
  cursor: pointer;
  transition: all var(--anim);

  &:hover {
    background: var(--brand-color-4);
    padding: 0px var(--spacer);
  }
}
.home-container {
  padding: 0px var(--spacer);
  display: flex;
  flex-direction: column;
}
h2 {
  text-align: left;
}
p {
  max-width: 75ch;
  font-size: 0.8em;
}

@media (max-width: 1024px) {
  .home-container {
    display: none;
  }
}
</style>
