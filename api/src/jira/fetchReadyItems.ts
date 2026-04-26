import { JIRA_BASE, findSprintIdByName, jiraAuth, jiraConfigured } from "./jiraClient";

const SOURCE_SPRINT_NAME = "Ready for AER Backlog meeting";

export interface ReadyItem {
  key: string;
  summary: string;
}

interface AgileIssue {
  key: string;
  fields: {
    summary?: string;
    status?: { statusCategory?: { key?: string } };
  };
}

export async function fetchReadyForBacklogItems(): Promise<ReadyItem[]> {
  if (!jiraConfigured()) {
    throw new Error("JIRA not configured");
  }

  const sprintId = await findSprintIdByName(SOURCE_SPRINT_NAME);
  if (sprintId === null) {
    throw new Error(`Sprint "${SOURCE_SPRINT_NAME}" not found`);
  }

  const collected: AgileIssue[] = [];
  let startAt = 0;
  while (true) {
    const url = `${JIRA_BASE}/rest/agile/1.0/sprint/${sprintId}/issue?fields=summary,status&maxResults=50&startAt=${startAt}`;
    const res = await fetch(url, {
      headers: { Authorization: jiraAuth(), Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`JIRA sprint issues fetch failed: ${res.status}`);
    }
    const data: { issues?: AgileIssue[]; total?: number } = await res.json();
    const issues = data.issues || [];
    collected.push(...issues);
    if (issues.length < 50 || (data.total !== undefined && collected.length >= data.total)) {
      break;
    }
    startAt += issues.length;
  }

  const items = collected
    .filter((issue) => issue.fields?.status?.statusCategory?.key !== "done")
    .map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary || "",
    }));

  items.sort((a, b) => {
    const aNum = parseInt(a.key.split("-")[1] || "0", 10);
    const bNum = parseInt(b.key.split("-")[1] || "0", 10);
    return aNum - bNum;
  });

  return items;
}
