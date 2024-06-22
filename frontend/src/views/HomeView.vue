<template>
  <div class="home-container">
    <h1 style="margin-bottom: 0">AERIUS, for AERIUS</h1>
    <p style="font-weight: bold; margin: 0">
      Assistant for Efficiently Relaying Information Using Signals
    </p>

    <section class="expandable" @click="gripRevealed = !gripRevealed">
      <h2>
        Introducing the <b>GRIP</b> update
        <span class="reveal">({{ gripRevealed ? "-" : "+" }})</span>
      </h2>
      <template v-if="gripRevealed">
        <p style="font-weight: bold; margin: 0">Generalized Real-time Interaction Panel</p>
        <p>
          The AERIUS tool now includes the GRIP update, an enhancement designed to further
          streamline and elevate team coordination and communication.
        </p>

        <ul>
          <li>
            <p>
              <b>Enhanced User Controls</b>: The GRIP update introduces advanced capabilities that
              empower all team members to actively participate and manage discussions. The panel is
              now accessible to everyone, allowing users to set their own names or randomly
              generated pseudonyms for better identification. Moderation can be easily transferred,
              enabling seamless transitions between different moderators. These enhancements ensure
              smoother discussions and more effective task management during backlog meetings,
              fostering a more organized and productive workflow.
            </p>
          </li>
          <li>
            <p>
              <b>Dynamic Scratchboard</b>: GRIP introduces a versatile scratchboard feature,
              available both for general use and for specific backlog items. This interactive space
              allows team members to jot down notes, ideas, and comments in real-time, promoting
              spontaneous collaboration and idea-sharing. Whether capturing fleeting thoughts or
              detailing complex strategies, the scratchboard is a valuable tool for maintaining a
              continuous flow of information.
            </p>
          </li>
        </ul>
        <p>
          The GRIP update reaffirms AERIUS's commitment to innovation and user-centric design. By
          integrating these new features, AERIUS enhances its role as a comprehensive coordination
          system, tailored to meet the evolving needs of agile teams.
        </p>

        <p>
          With GRIP, AERIUS continues to offer a robust platform for efficient backlog management
          and scrum poker estimations, now with greater control and collaborative capabilities.
          Experience a new level of team synergy and productivity with the AERIUS tool's latest
          update.
        </p>
      </template>
    </section>

    <section class="expandable" @click="aboutRevealed = !aboutRevealed">
      <h2>
        About
        <span class="reveal">({{ aboutRevealed ? "-" : "+" }})</span>
      </h2>
      <template v-if="aboutRevealed">
        <p>Welcome to the AERIUS tool, a tool to help the AERIUS team coordinate.</p>
        <p>
          The AERIUS tool is an innovative solution designed to streamline the backlog meeting
          process and enhance team communication. At its core, AERIUS offers a dynamic scheduling
          system for managing backlog items, ensuring that every task is addressed efficiently and
          on time.
        </p>

        <p>
          One of the standout features of AERIUS is its unique signaling system. Team members can
          send specific "signals" related to each backlog item. These signals include but are not
          limited to "question" for seeking clarification, "estimate" for providing time or resource
          assessments, "thinking" to indicate contemplation or ongoing analysis, and "coffee break"
          for suggesting a pause in the meeting. This system facilitates a seamless flow of
          communication, ensuring that all team members are constantly in sync and aware of each
          other's thoughts and queries.
        </p>

        <p>
          Moreover, AERIUS significantly enhances the scrum poker estimation process. It provides an
          intuitive and interactive platform for team members to cast their votes on task
          complexities and time requirements. The tool's real-time response capability allows for
          immediate feedback and discussion, fostering a collaborative environment for accurate and
          consensus-based estimation.
        </p>

        <p>
          Overall, AERIUS is more than just a communication tool; it's a comprehensive system
          designed to bring efficiency, transparency, and harmony to the team's workflow. With its
          user-friendly interface and powerful features, AERIUS is set to revolutionize the way
          backlog meetings and scrum poker estimations are conducted.
        </p>
      </template>
    </section>

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

const aboutRevealed = ref(false);
const gripRevealed = ref(true);
const changelogRevealed = ref(false);

const changelog = ref<ChangelogEntry[]>([
  {
    version: "v0.1",
    date: new Date("2023-12-03"),
    changes: [
      { type: "Added", description: "Signal mechanism" },
      { type: "Added", description: "Poker mechanism" },
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
      { type: "Updated", description: "Poker split into test/dev" },
      { type: "Added", description: "Drumroll" },
    ],
  },
  {
    version: "v1.1",
    date: new Date("2023-12-10"),
    changes: [{ type: "Updated", description: "Poker reveal is now a moderator responsibility" }],
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
        description: "Added ? to the poker options",
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
        description:
          "Change the way that user and moderation controls work - users can now always claim moderation",
      },
      {
        type: "Updated",
        description: "Remove double colons from aer-* items",
      },
    ],
  },
]);

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat("en-CA", options).format(date);
};

fetch("/api/ping");
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
</style>
