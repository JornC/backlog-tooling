import { ActionType, RoomStateManager, RoomStateFragment } from "../data/roomStateManager";

export interface JiraItemResult {
  jiraKey: string;
  devSp: number | null;
  testSp: number | null;
  spPosted: number | null;
  spEstimatePosted: number | null;
  skippedReasons: string[];
  error?: string;
}

interface FieldIds {
  sp: string;
  spEstimate: string;
}

const JIRA_BASE = "https://aerius.atlassian.net";

let cachedFieldIds: FieldIds | null | undefined = undefined;

function jiraAuth(): string {
  const user = process.env.JIRA_USER!;
  const token = process.env.JIRA_API_TOKEN!;
  return "Basic " + Buffer.from(`${user}:${token}`).toString("base64");
}

export function getWinningEstimate(
  room: RoomStateFragment[] | undefined,
  actionType: ActionType,
): number | null {
  if (!room) {
    return null;
  }

  const estimates = room
    .filter((v) => v.type === actionType && v.value !== undefined)
    .map((v) => Number(v.value));

  if (estimates.length === 0) {
    return null;
  }

  const countMap = new Map<number, number>();
  for (const value of estimates) {
    countMap.set(value, (countMap.get(value) || 0) + 1);
  }

  let maxCount = 0;
  let winners: number[] = [];
  for (const [value, count] of countMap) {
    if (count > maxCount) {
      maxCount = count;
      winners = [value];
    } else if (count === maxCount) {
      winners.push(value);
    }
  }

  if (winners.length !== 1) {
    return null;
  }

  return winners[0];
}

async function discoverFieldIds(): Promise<FieldIds | null> {
  if (cachedFieldIds !== undefined) {
    return cachedFieldIds;
  }

  try {
    const res = await fetch(`${JIRA_BASE}/rest/api/3/field`, {
      headers: { Authorization: jiraAuth(), Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`JIRA field discovery failed: ${res.status} ${res.statusText}`);
      cachedFieldIds = null;
      return null;
    }

    const fields: Array<{ id: string; name: string }> = await res.json();
    const spField = fields.find((f) => f.name === "Story Points");
    const spEstField = fields.find((f) => f.name === "Story point estimate");

    if (!spField || !spEstField) {
      console.warn(
        `JIRA field discovery: missing fields. Story Points=${spField?.id}, Story Point Estimate=${spEstField?.id}`,
      );
      cachedFieldIds = null;
      return null;
    }

    cachedFieldIds = { sp: spField.id, spEstimate: spEstField.id };
    return cachedFieldIds;
  } catch (err) {
    console.warn("JIRA field discovery error:", err);
    cachedFieldIds = null;
    return null;
  }
}

interface ScheduleItem {
  title: string;
  code: string;
}

export async function postEstimatesToJira(
  schedule: ScheduleItem[],
  roomStateManager: RoomStateManager,
): Promise<JiraItemResult[]> {
  const aerItems = schedule.filter((item) => item.code.startsWith("aer-"));

  if (aerItems.length === 0) {
    return [];
  }

  const jiraUser = process.env.JIRA_USER;
  const jiraToken = process.env.JIRA_API_TOKEN;

  if (!jiraUser || !jiraToken) {
    console.warn("JIRA env vars not configured (JIRA_USER, JIRA_API_TOKEN) - skipping JIRA posting");
    return aerItems.map((item) => ({
      jiraKey: item.title,
      devSp: null,
      testSp: null,
      spPosted: null,
      spEstimatePosted: null,
      skippedReasons: [],
      error: "JIRA not configured",
    }));
  }

  const fieldIds = await discoverFieldIds();
  if (!fieldIds) {
    return aerItems.map((item) => ({
      jiraKey: item.title,
      devSp: null,
      testSp: null,
      spPosted: null,
      spEstimatePosted: null,
      skippedReasons: [],
      error: "JIRA field discovery failed",
    }));
  }

  const results: JiraItemResult[] = [];

  for (const item of aerItems) {
    const jiraKey = item.title;
    const room = roomStateManager.getRoomState(item.code);
    const devSp = getWinningEstimate(room, ActionType.POKER_DEV_ESTIMATE);
    const testSp = getWinningEstimate(room, ActionType.POKER_TEST_ESTIMATE);

    const result: JiraItemResult = {
      jiraKey,
      devSp,
      testSp,
      spPosted: null,
      spEstimatePosted: null,
      skippedReasons: [],
    };

    if (devSp === null && testSp === null) {
      result.skippedReasons.push("no_estimates");
      results.push(result);
      continue;
    }

    try {
      const issueRes = await fetch(
        `${JIRA_BASE}/rest/api/3/issue/${jiraKey}?fields=${fieldIds.sp},${fieldIds.spEstimate}`,
        {
          headers: { Authorization: jiraAuth(), Accept: "application/json" },
        },
      );

      if (!issueRes.ok) {
        result.error = `Failed to fetch issue: ${issueRes.status} ${issueRes.statusText}`;
        results.push(result);
        continue;
      }

      const issue: { fields: Record<string, number | null> } = await issueRes.json();
      const existingSp = issue.fields[fieldIds.sp];
      const existingSpEstimate = issue.fields[fieldIds.spEstimate];

      const fieldsToUpdate: Record<string, number> = {};

      // Story Point Estimate = test SP
      if (testSp !== null) {
        if (existingSpEstimate !== null && existingSpEstimate !== undefined) {
          result.skippedReasons.push("sp_estimate_field_exists");
        } else {
          fieldsToUpdate[fieldIds.spEstimate] = testSp;
          result.spEstimatePosted = testSp;
        }
      } else {
        result.skippedReasons.push("tie_in_test");
      }

      // Story Points = dev SP + test SP (needs both)
      if (devSp !== null && testSp !== null) {
        if (existingSp !== null && existingSp !== undefined) {
          result.skippedReasons.push("sp_field_exists");
        } else {
          fieldsToUpdate[fieldIds.sp] = devSp + testSp;
          result.spPosted = devSp + testSp;
        }
      } else if (devSp === null) {
        result.skippedReasons.push("tie_in_dev");
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        const putRes = await fetch(`${JIRA_BASE}/rest/api/3/issue/${jiraKey}`, {
          method: "PUT",
          headers: {
            Authorization: jiraAuth(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ fields: fieldsToUpdate }),
        });

        if (!putRes.ok) {
          const body = await putRes.text();
          result.error = `Failed to update: ${putRes.status} ${body}`;
          result.spPosted = null;
          result.spEstimatePosted = null;
        }
      }

      results.push(result);
    } catch (err) {
      result.error = String(err);
      results.push(result);
    }
  }

  return results;
}
