import { createTransport } from "nodemailer";
import { ActionType, RoomStateManager, RoomStateFragment } from "../data/roomStateManager";
import { ScratchboardState } from "../data/scratchboardmanager";
import { JiraItemResult } from "../jira/postEstimates";

interface ScheduleItem {
  title: string;
  code: string;
  description?: string;
  groupTitle?: string;
  locked?: boolean;
}

function isDefaultSchedule(
  schedule: ScheduleItem[],
  defaultCodes: string[],
): boolean {
  if (schedule.length !== defaultCodes.length) {
    return false;
  }
  return schedule.every((item, i) => item.code === defaultCodes[i]);
}

function formatEstimates(
  room: RoomStateFragment[] | undefined,
  actionType: ActionType,
): string {
  if (!room) {
    return "None";
  }

  const estimates = room
    .filter((v) => v.type === actionType && v.value !== undefined)
    .map((v) => v.value);

  const countMap = new Map<string, number>();
  estimates.forEach((value) => {
    const valueStr = String(value);
    countMap.set(valueStr, (countMap.get(valueStr) || 0) + 1);
  });

  return countMap.size === 0
    ? "None"
    : Array.from(countMap.entries())
        .map(([value, count]) => `${count}x ${value}sp`)
        .join(", ");
}

function formatJiraResult(result: JiraItemResult): string {
  if (result.error) {
    return `  JIRA: Failed (${result.error})`;
  }

  const lines: string[] = [];

  // Story point estimate (test SP)
  if (result.spEstimatePosted !== null) {
    lines.push(`SP Estimate: posted ${result.spEstimatePosted}sp`);
  } else if (result.skippedReasons.includes("sp_estimate_field_exists")) {
    lines.push("SP Estimate: skipped (already set)");
  } else if (result.skippedReasons.includes("tie_in_test")) {
    lines.push("SP Estimate: skipped (tie)");
  }

  // Story points (dev + test)
  if (result.spPosted !== null) {
    lines.push(`SP: posted ${result.spPosted}sp (${result.devSp} dev + ${result.testSp} test)`);
  } else if (result.skippedReasons.includes("sp_field_exists")) {
    lines.push("SP: skipped (already set)");
  } else if (result.skippedReasons.includes("tie_in_dev")) {
    lines.push("SP: skipped (tie in dev)");
  } else if (result.skippedReasons.includes("tie_in_test")) {
    lines.push("SP: skipped (tie in test)");
  }

  if (lines.length === 0) {
    if (result.skippedReasons.includes("no_estimates")) {
      return "  JIRA: skipped (no estimates)";
    }
    return "  JIRA: skipped";
  }

  return "  JIRA: " + lines.join(", ");
}

export function composeSessionSummary(
  schedule: ScheduleItem[],
  roomStateManager: RoomStateManager,
  scratchboard: Map<string, ScratchboardState>,
  roster: Map<string, string>,
  lockedRooms: Set<string>,
  lockedBy: Map<string, string>,
  jiraResults?: JiraItemResult[],
): string {
  const date = new Date().toISOString().slice(0, 10);
  const participants = Array.from(roster.values());

  const lines: string[] = [];
  lines.push(`Backlog Session Summary - ${date}`);
  lines.push("");
  lines.push(
    `Participants: ${participants.length > 0 ? participants.join(", ") : "None"}`,
  );
  lines.push("");
  lines.push("---");

  for (const item of schedule) {
    const locked = lockedRooms.has(item.code);
    lines.push("");
    const lockedByName = lockedBy.get(item.code);
    lines.push(`${item.title}${locked ? " [LOCKED]" : ""}`);

    if (locked) {
      if (lockedByName) {
        lines.push(`  Locked by: ${lockedByName}`);
      }
      const room = roomStateManager.getRoomState(item.code);
      lines.push(
        `  Dev estimates: ${formatEstimates(room, ActionType.POKER_DEV_ESTIMATE)}`,
      );
      lines.push(
        `  Test estimates: ${formatEstimates(room, ActionType.POKER_TEST_ESTIMATE)}`,
      );
    } else {
      lines.push("  (not locked - discussion incomplete)");
    }

    const scratch = scratchboard.get(item.code);
    if (scratch && scratch.text) {
      lines.push(`  Scratchboard: ${scratch.text}`);
    }

    if (item.code.startsWith("aer-")) {
      const jiraResult = jiraResults?.find((r) => r.jiraKey === item.title);
      if (jiraResult) {
        lines.push(formatJiraResult(jiraResult));
      }
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("Generated automatically before session reset.");
  lines.push("");

  return lines.join("\n");
}

export async function sendSessionSummary(
  schedule: ScheduleItem[],
  defaultCodes: string[],
  roomStateManager: RoomStateManager,
  scratchboard: Map<string, ScratchboardState>,
  roster: Map<string, string>,
  lockedRooms: Set<string>,
  lockedBy: Map<string, string>,
  jiraResults?: JiraItemResult[],
  moderatorEmail?: string,
): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpTo = process.env.SMTP_TO;

  if (!smtpUser || !smtpPass || !smtpTo) {
    console.warn(
      "SMTP env vars not configured (SMTP_USER, SMTP_PASS, SMTP_TO) - skipping session summary email",
    );
    return;
  }

  if (isDefaultSchedule(schedule, defaultCodes)) {
    console.log("Schedule is default - skipping session summary email");
    return;
  }

  try {
    const body = composeSessionSummary(
      schedule,
      roomStateManager,
      scratchboard,
      roster,
      lockedRooms,
      lockedBy,
      jiraResults,
    );

    const date = new Date().toISOString().slice(0, 10);

    const transport = createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const recipients = [smtpTo];
    if (moderatorEmail && !recipients.includes(moderatorEmail)) {
      recipients.push(moderatorEmail);
    }

    await transport.sendMail({
      from: smtpUser,
      to: recipients.join(", "),
      subject: `Backlog session summary - ${date}`,
      text: body,
    });

    console.log("Session summary email sent successfully");
  } catch (err) {
    console.error("Failed to send session summary email:", err);
  }
}
