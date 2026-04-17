import { ScratchboardState } from "../data/scratchboardmanager";

export interface JiraCommentResult {
  jiraKey: string;
  posted: boolean;
  error?: string;
}

interface ScheduleItem {
  title: string;
  code: string;
}

interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
  marks?: Array<{ type: string }>;
}

const JIRA_BASE = "https://aerius.atlassian.net";

function jiraAuth(): string {
  const user = process.env.JIRA_USER!;
  const token = process.env.JIRA_API_TOKEN!;
  return "Basic " + Buffer.from(`${user}:${token}`).toString("base64");
}

function buildCommentAdf(text: string): { version: number; type: string; content: AdfNode[] } {
  const lines = text.split("\n");
  const bodyContent: AdfNode[] = [];

  lines.forEach((line, i) => {
    if (i > 0) {
      bodyContent.push({ type: "hardBreak" });
    }
    if (line.length > 0) {
      bodyContent.push({ type: "text", text: line });
    }
  });

  return {
    version: 1,
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Scratchboard notes from backlog session:",
            marks: [{ type: "em" }],
          },
        ],
      },
      {
        type: "paragraph",
        content: bodyContent,
      },
    ],
  };
}

export async function postScratchboardComments(
  schedule: ScheduleItem[],
  scratchboard: Map<string, ScratchboardState>,
): Promise<JiraCommentResult[]> {
  const jiraUser = process.env.JIRA_USER;
  const jiraToken = process.env.JIRA_API_TOKEN;

  const results: JiraCommentResult[] = [];

  if (!jiraUser || !jiraToken) {
    console.warn(
      "JIRA env vars not configured (JIRA_USER, JIRA_API_TOKEN) - skipping scratchboard comment posting",
    );
    return results;
  }

  for (const item of schedule) {
    if (!item.code.startsWith("aer-")) {
      continue;
    }

    const scratch = scratchboard.get(item.code);
    const text = scratch?.text?.trim();
    if (!text) {
      continue;
    }

    const jiraKey = item.title;
    const result: JiraCommentResult = { jiraKey, posted: false };

    try {
      const res = await fetch(
        `${JIRA_BASE}/rest/api/3/issue/${encodeURIComponent(jiraKey)}/comment`,
        {
          method: "POST",
          headers: {
            Authorization: jiraAuth(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ body: buildCommentAdf(text) }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        result.error = `${res.status} ${body}`;
      } else {
        result.posted = true;
      }
    } catch (err) {
      result.error = String(err);
    }

    results.push(result);
  }

  return results;
}
