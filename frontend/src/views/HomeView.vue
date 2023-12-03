<template>
  <h1>AERIUS, for AERIUS</h1>
  <p style="font-weight: bold">Assistant for Efficiently Relaying Information Using Signals</p>
  <p>Welcome to the AERIUS tool, a tool to help the AERIUS team coordinate.</p>
  <p>
    The AERIUS tool is an innovative solution designed to streamline the backlog meeting process and
    enhance team communication. At its core, AERIUS offers a dynamic scheduling system for managing
    backlog items, ensuring that every task is addressed efficiently and on time.
  </p>

  <p>
    One of the standout features of AERIUS is its unique signaling system. Team members can send
    specific "signals" related to each backlog item. These signals include but are not limited to
    "question" for seeking clarification, "estimate" for providing time or resource assessments,
    "thinking" to indicate contemplation or ongoing analysis, and "coffee break" for suggesting a
    pause in the meeting. This system facilitates a seamless flow of communication, ensuring that
    all team members are constantly in sync and aware of each other's thoughts and queries.
  </p>

  <p>
    Moreover, AERIUS significantly enhances the scrum poker estimation process. It provides an
    intuitive and interactive platform for team members to cast their votes on task complexities and
    time requirements. The tool's real-time response capability allows for immediate feedback and
    discussion, fostering a collaborative environment for accurate and consensus-based estimation.
  </p>

  <p>
    Overall, AERIUS is more than just a communication tool; it's a comprehensive system designed to
    bring efficiency, transparency, and harmony to the team's workflow. With its user-friendly
    interface and powerful features, AERIUS is set to revolutionize the way backlog meetings and
    scrum poker estimations are conducted.
  </p>
</template>

<script setup lang="ts">
fetch("/api/ping");
</script>

<style lang="scss" scoped>
p {
  width: clamp(45ch, 50%, 75ch);
}
</style>
