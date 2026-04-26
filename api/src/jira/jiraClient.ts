export const JIRA_BASE = "https://aerius.atlassian.net";

export function jiraAuth(): string {
  const user = process.env.JIRA_USER!;
  const token = process.env.JIRA_API_TOKEN!;
  return "Basic " + Buffer.from(`${user}:${token}`).toString("base64");
}

export function jiraConfigured(): boolean {
  return !!process.env.JIRA_USER && !!process.env.JIRA_API_TOKEN;
}

interface SprintRef {
  id: number;
  name: string;
}

let cachedSprintIdsByName: Map<string, number> | undefined = undefined;

async function fetchAllSprints(): Promise<SprintRef[]> {
  const sprints: SprintRef[] = [];
  const headers = { Authorization: jiraAuth(), Accept: "application/json" };

  const boardsRes = await fetch(`${JIRA_BASE}/rest/agile/1.0/board?maxResults=50`, { headers });
  if (!boardsRes.ok) {
    throw new Error(`JIRA boards fetch failed: ${boardsRes.status}`);
  }
  const boardsData: { values?: Array<{ id: number }> } = await boardsRes.json();
  const boards = boardsData.values || [];

  for (const board of boards) {
    let startAt = 0;
    while (true) {
      const sprintsRes = await fetch(
        `${JIRA_BASE}/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=50&startAt=${startAt}`,
        { headers },
      );
      if (!sprintsRes.ok) {
        // Some boards (e.g., Kanban) don't support sprints - skip silently
        break;
      }
      const sprintsData: { values?: SprintRef[]; isLast?: boolean } = await sprintsRes.json();
      const values = sprintsData.values || [];
      sprints.push(...values);
      if (sprintsData.isLast || values.length === 0) {
        break;
      }
      startAt += values.length;
    }
  }

  return sprints;
}

export async function findSprintIdByName(name: string): Promise<number | null> {
  if (!cachedSprintIdsByName) {
    try {
      const sprints = await fetchAllSprints();
      cachedSprintIdsByName = new Map(
        sprints.map((s) => [s.name.toLowerCase().trim(), s.id]),
      );
    } catch (err) {
      console.warn("JIRA sprint discovery failed:", err);
      return null;
    }
  }
  const id = cachedSprintIdsByName.get(name.toLowerCase().trim());
  return id ?? null;
}

export async function moveIssueToSprint(issueKey: string, sprintId: number): Promise<void> {
  const res = await fetch(`${JIRA_BASE}/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: "POST",
    headers: {
      Authorization: jiraAuth(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ issues: [issueKey] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Move to sprint failed: ${res.status} ${body}`);
  }
}
