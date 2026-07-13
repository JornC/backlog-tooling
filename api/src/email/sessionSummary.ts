import { createTransport } from "nodemailer";
import { ActionType, RoomStateManager, RoomStateFragment } from "../data/roomStateManager";
import { ScratchboardState } from "../data/scratchboardmanager";
import { JiraItemResult } from "../jira/postEstimates";
import { JiraCommentResult } from "../jira/postComments";

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
  } else if (result.skippedReasons.includes("no_test_votes")) {
    lines.push("SP Estimate: skipped (no test votes)");
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

  if (result.sprintMoved) {
    lines.push("Sprint: moved to Sprint planning meeting");
  } else if (result.sprintMoveError) {
    lines.push(`Sprint: move failed (${result.sprintMoveError})`);
  }

  if (lines.length === 0) {
    if (result.skippedReasons.includes("no_dev_estimates")) {
      return "  JIRA: skipped (no dev estimates)";
    }
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
  commentResults?: JiraCommentResult[],
): string {
  const date = new Date().toISOString().slice(0, 10);
  const participants = [...new Set(roster.values())];

  const lines: string[] = [];
  lines.push(`Backlog Session Summary - ${date}`);
  lines.push("");
  lines.push(
    `Participants (${participants.length}): ${participants.length > 0 ? participants.join(", ") : "None"}`,
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
    } else {
      lines.push("  (not locked - discussion incomplete)");
    }

    const room = roomStateManager.getRoomState(item.code);
    const devEstimates = formatEstimates(room, ActionType.POKER_DEV_ESTIMATE);
    const testEstimates = formatEstimates(room, ActionType.POKER_TEST_ESTIMATE);
    if (locked || devEstimates !== "None" || testEstimates !== "None") {
      lines.push(`  Dev estimates: ${devEstimates}`);
      lines.push(`  Test estimates: ${testEstimates}`);
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
      const commentResult = commentResults?.find((r) => r.jiraKey === item.title);
      if (commentResult) {
        if (commentResult.posted) {
          lines.push("  JIRA comment: posted scratchboard");
        } else if (commentResult.error) {
          lines.push(`  JIRA comment: failed (${commentResult.error})`);
        }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type WarningLevel = "error" | "warn" | "info" | "ok";

interface ItemNote {
  level: WarningLevel;
  text: string;
}

const LEVEL_STYLES: Record<WarningLevel, { bg: string; border: string; text: string; label: string }> = {
  error: { bg: "#fdecea", border: "#e53935", text: "#8f1d18", label: "FAILED" },
  warn: { bg: "#fff8e1", border: "#f5a623", text: "#7a5300", label: "NEEDS CHECK" },
  info: { bg: "#eef2f7", border: "#9aa7b5", text: "#41505f", label: "INFO" },
  ok: { bg: "#e9f6ec", border: "#43a047", text: "#1f6b2c", label: "OK" },
};

// Collect per-item notes, ordering the ones that need manual attention first.
function collectItemNotes(
  locked: boolean,
  jiraResult: JiraItemResult | undefined,
  commentResult: JiraCommentResult | undefined,
): ItemNote[] {
  const notes: ItemNote[] = [];

  if (!locked) {
    notes.push({ level: "warn", text: "Not locked - discussion incomplete" });
  }

  if (jiraResult) {
    if (jiraResult.error) {
      notes.push({ level: "error", text: `JIRA update failed: ${jiraResult.error}` });
    }
    if (jiraResult.skippedReasons.includes("no_dev_estimates")) {
      notes.push({ level: "warn", text: "No dev estimate consensus - nothing posted, estimate manually" });
    }
    if (jiraResult.skippedReasons.includes("tie_in_dev")) {
      notes.push({ level: "warn", text: "Tie in dev votes - story points not posted, estimate manually" });
    }
    if (jiraResult.skippedReasons.includes("tie_in_test")) {
      notes.push({ level: "warn", text: "Tie in test votes - test estimate not posted, check manually" });
    }
    if (jiraResult.sprintMoveError) {
      notes.push({ level: "error", text: `Sprint move failed: ${jiraResult.sprintMoveError}` });
    }
    if (jiraResult.skippedReasons.includes("sp_field_exists")) {
      notes.push({ level: "info", text: "Story Points already set - left unchanged" });
    }
    if (jiraResult.skippedReasons.includes("sp_estimate_field_exists")) {
      notes.push({ level: "info", text: "Story point estimate already set - left unchanged" });
    }
    if (jiraResult.spPosted !== null) {
      notes.push({
        level: "ok",
        text: `Story Points posted: ${jiraResult.spPosted}sp (${jiraResult.devSp} dev + ${jiraResult.testSp} test)`,
      });
    }
    if (jiraResult.spEstimatePosted !== null) {
      notes.push({ level: "ok", text: `Story point estimate posted: ${jiraResult.spEstimatePosted}sp` });
    }
    if (jiraResult.sprintMoved) {
      notes.push({ level: "ok", text: "Moved to Sprint planning meeting" });
    }
  }

  if (commentResult) {
    if (commentResult.error) {
      notes.push({ level: "error", text: `JIRA comment failed: ${commentResult.error}` });
    } else if (commentResult.posted) {
      notes.push({ level: "ok", text: "Scratchboard posted as JIRA comment" });
    }
  }

  return notes;
}

function renderBadge(level: WarningLevel): string {
  const s = LEVEL_STYLES[level];
  return (
    `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;` +
    `font-weight:700;letter-spacing:0.4px;color:${s.text};background:${s.bg};` +
    `border:1px solid ${s.border};white-space:nowrap;">${s.label}</span>`
  );
}

function renderNote(note: ItemNote): string {
  const s = LEVEL_STYLES[note.level];
  return (
    `<tr><td style="padding:6px 12px;border-left:4px solid ${s.border};background:${s.bg};` +
    `border-radius:2px;">` +
    `<span style="font-size:13px;color:${s.text};">` +
    `${renderBadge(note.level)}&nbsp;&nbsp;${escapeHtml(note.text)}</span>` +
    `</td></tr>`
  );
}

export function composeSessionSummaryHtml(
  schedule: ScheduleItem[],
  roomStateManager: RoomStateManager,
  scratchboard: Map<string, ScratchboardState>,
  roster: Map<string, string>,
  lockedRooms: Set<string>,
  lockedBy: Map<string, string>,
  jiraResults?: JiraItemResult[],
  commentResults?: JiraCommentResult[],
): string {
  const date = new Date().toISOString().slice(0, 10);
  const participants = [...new Set(roster.values())];

  // First pass: gather notes per item so we can build an "attention" banner.
  const itemsWithNotes = schedule.map((item) => {
    const locked = lockedRooms.has(item.code);
    const jiraResult = item.code.startsWith("aer-")
      ? jiraResults?.find((r) => r.jiraKey === item.title)
      : undefined;
    const commentResult = item.code.startsWith("aer-")
      ? commentResults?.find((r) => r.jiraKey === item.title)
      : undefined;
    const notes = collectItemNotes(locked, jiraResult, commentResult);
    return { item, locked, jiraResult, commentResult, notes };
  });

  const attentionItems = itemsWithNotes.filter((e) =>
    e.notes.some((n) => n.level === "error" || n.level === "warn"),
  );

  const cardStyle =
    "border:1px solid #e2e6ea;border-radius:8px;padding:16px 18px;margin:0 0 14px;background:#ffffff;";
  const labelStyle = "font-size:12px;color:#8a97a3;text-transform:uppercase;letter-spacing:0.5px;";

  const parts: string[] = [];

  parts.push(
    `<div style="background:#f4f6f8;padding:24px 0;margin:0;font-family:-apple-system,BlinkMacSystemFont,` +
      `'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b333b;">`,
  );
  parts.push(`<div style="max-width:640px;margin:0 auto;padding:0 16px;">`);

  // Header
  parts.push(
    `<div style="margin:0 0 20px;">` +
      `<div style="font-size:22px;font-weight:700;color:#1c2530;">Backlog Session Summary</div>` +
      `<div style="font-size:14px;color:#8a97a3;margin-top:2px;">${escapeHtml(date)}</div>` +
      `</div>`,
  );

  // Participants
  parts.push(
    `<div style="${cardStyle}">` +
      `<div style="${labelStyle}">Participants (${participants.length})</div>` +
      `<div style="font-size:14px;margin-top:6px;">` +
      (participants.length > 0 ? escapeHtml(participants.join(", ")) : "None") +
      `</div></div>`,
  );

  // Attention banner
  if (attentionItems.length > 0) {
    const s = LEVEL_STYLES.warn;
    parts.push(
      `<div style="border:1px solid ${s.border};background:${s.bg};border-radius:8px;` +
        `padding:16px 18px;margin:0 0 18px;">` +
        `<div style="font-size:15px;font-weight:700;color:${s.text};">` +
        `${attentionItems.length} item${attentionItems.length === 1 ? "" : "s"} need manual attention</div>` +
        `<ul style="margin:10px 0 0;padding-left:20px;font-size:13px;color:${s.text};">` +
        attentionItems
          .map((e) => {
            const worst = e.notes.some((n) => n.level === "error") ? "error" : "warn";
            const reasons = e.notes
              .filter((n) => n.level === "error" || n.level === "warn")
              .map((n) => escapeHtml(n.text))
              .join("; ");
            const color = LEVEL_STYLES[worst as WarningLevel].text;
            return `<li style="margin-bottom:4px;color:${color};"><strong>${escapeHtml(e.item.title)}</strong>: ${reasons}</li>`;
          })
          .join("") +
        `</ul></div>`,
    );
  } else if (schedule.length > 0) {
    const s = LEVEL_STYLES.ok;
    parts.push(
      `<div style="border:1px solid ${s.border};background:${s.bg};border-radius:8px;` +
        `padding:14px 18px;margin:0 0 18px;font-size:14px;font-weight:600;color:${s.text};">` +
        `All items processed cleanly - no manual checks needed</div>`,
    );
  }

  // Per-item cards
  for (const entry of itemsWithNotes) {
    const { item, locked, notes } = entry;
    const room = roomStateManager.getRoomState(item.code);
    const devEstimates = formatEstimates(room, ActionType.POKER_DEV_ESTIMATE);
    const testEstimates = formatEstimates(room, ActionType.POKER_TEST_ESTIMATE);
    const scratch = scratchboard.get(item.code);
    const lockedByName = lockedBy.get(item.code);

    parts.push(`<div style="${cardStyle}">`);

    // Title row with lock badge
    parts.push(
      `<div style="display:flex;justify-content:space-between;align-items:baseline;">` +
        `<span style="font-size:16px;font-weight:700;color:#1c2530;">${escapeHtml(item.title)}</span>` +
        (locked
          ? renderBadge("ok").replace(">OK<", ">LOCKED<")
          : renderBadge("warn").replace(">NEEDS CHECK<", ">NOT LOCKED<")) +
        `</div>`,
    );

    if (locked && lockedByName) {
      parts.push(
        `<div style="font-size:12px;color:#8a97a3;margin-top:4px;">Locked by ${escapeHtml(lockedByName)}</div>`,
      );
    }

    // Estimates
    if (locked || devEstimates !== "None" || testEstimates !== "None") {
      parts.push(
        `<table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">` +
          `<tr>` +
          `<td style="width:50%;padding:0 8px 0 0;vertical-align:top;">` +
          `<div style="${labelStyle}">Dev estimates</div>` +
          `<div style="font-size:14px;margin-top:2px;">${escapeHtml(devEstimates)}</div></td>` +
          `<td style="width:50%;padding:0 0 0 8px;vertical-align:top;">` +
          `<div style="${labelStyle}">Test estimates</div>` +
          `<div style="font-size:14px;margin-top:2px;">${escapeHtml(testEstimates)}</div></td>` +
          `</tr></table>`,
      );
    }

    // Scratchboard
    if (scratch && scratch.text) {
      parts.push(
        `<div style="margin-top:12px;">` +
          `<div style="${labelStyle}">Scratchboard</div>` +
          `<div style="font-size:13px;margin-top:4px;padding:10px 12px;background:#f7f9fb;` +
          `border-radius:6px;white-space:pre-wrap;color:#3a444e;">${escapeHtml(scratch.text)}</div></div>`,
      );
    }

    // Notes (warnings / statuses)
    if (notes.length > 0) {
      parts.push(
        `<table role="presentation" style="width:100%;margin-top:12px;border-collapse:separate;border-spacing:0 4px;">` +
          notes.map(renderNote).join("") +
          `</table>`,
      );
    }

    parts.push(`</div>`);
  }

  // Footer
  parts.push(
    `<div style="font-size:12px;color:#a3adb7;text-align:center;margin-top:8px;">` +
      `Generated automatically before session reset.</div>`,
  );

  parts.push(`</div></div>`);

  return parts.join("");
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
  sessionEmails?: Set<string>,
  commentResults?: JiraCommentResult[],
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
      commentResults,
    );

    const html = composeSessionSummaryHtml(
      schedule,
      roomStateManager,
      scratchboard,
      roster,
      lockedRooms,
      lockedBy,
      jiraResults,
      commentResults,
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

    const bccList = smtpTo.split(",").map((e) => e.trim());
    const toList = sessionEmails ? Array.from(sessionEmails) : [];

    console.log("Sending session summary email to:", toList.join(", "), "bcc:", bccList.join(", "));

    await transport.sendMail({
      from: smtpUser,
      to: toList.length > 0 ? toList.join(", ") : smtpUser,
      bcc: bccList.join(", "),
      subject: `Backlog session summary - ${date}`,
      text: body,
      html,
    });

    console.log("Session summary email sent successfully");
  } catch (err) {
    console.error("Failed to send session summary email:", err);
  }
}
