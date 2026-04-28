const JIRA_BASE = "https://aerius.atlassian.net";

function jiraAuth(): string {
  const user = process.env.JIRA_USER!;
  const token = process.env.JIRA_API_TOKEN!;
  return "Basic " + Buffer.from(`${user}:${token}`).toString("base64");
}

export async function findEpicKeys(jiraKeys: string[]): Promise<Set<string>> {
  const epics = new Set<string>();

  if (jiraKeys.length === 0) {
    return epics;
  }

  if (!process.env.JIRA_USER || !process.env.JIRA_API_TOKEN) {
    console.warn(
      "JIRA env vars not configured (JIRA_USER, JIRA_API_TOKEN) - skipping epic filtering",
    );
    return epics;
  }

  const checks = await Promise.all(
    jiraKeys.map(async (key) => {
      try {
        const res = await fetch(
          `${JIRA_BASE}/rest/api/3/issue/${encodeURIComponent(key)}?fields=issuetype`,
          { headers: { Authorization: jiraAuth(), Accept: "application/json" } },
        );
        if (!res.ok) {
          return null;
        }
        const data: { fields?: { issuetype?: { name?: string } } } = await res.json();
        const typeName = data.fields?.issuetype?.name;
        return typeName === "Epic" ? key : null;
      } catch (err) {
        console.warn(`Epic check failed for ${key}:`, err);
        return null;
      }
    }),
  );

  for (const key of checks) {
    if (key) {
      epics.add(key);
    }
  }
  return epics;
}
