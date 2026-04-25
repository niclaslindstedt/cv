#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cvPath = resolve(here, "..", "src", "data", "cv.json");
const defaultOut = resolve(here, "..", "src", "data", "project-stats.json");

const args = process.argv.slice(2);
let outPath = defaultOut;
let toStdout = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out" && args[i + 1]) {
    outPath = resolve(args[++i]);
  } else if (args[i].startsWith("--out=")) {
    outPath = resolve(args[i].slice("--out=".length));
  } else if (args[i] === "--stdout") {
    toStdout = true;
  } else {
    console.error(`Unknown argument: ${args[i]}`);
    process.exit(2);
  }
}

function emit(data) {
  const serialized = JSON.stringify(data, null, 2) + "\n";
  if (toStdout) {
    process.stdout.write(serialized);
  } else {
    writeFileSync(outPath, serialized);
  }
}

async function fetchGraphQL(token, query, variables) {
  const maxAttempts = 4;
  let delay = 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "niclaslindstedt-cv-build",
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    if (res.status >= 500 || res.status === 403 || res.status === 429) {
      if (attempt === maxAttempts) {
        throw new Error(`GitHub API ${res.status} after ${attempt} attempts`);
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }
    return json.data;
  }
  throw new Error("unreachable");
}

const COMMIT_HISTORY_QUERY = `
  query($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, after: $cursor) {
              totalCount
              pageInfo { hasNextPage endCursor }
              nodes {
                committedDate
                author {
                  name
                  email
                  user { login }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function authorKey(node) {
  const login = node.author?.user?.login ?? null;
  if (login) return `login:${login.toLowerCase()}`;
  const email = node.author?.email ?? "";
  if (email) return `email:${email.toLowerCase()}`;
  const name = node.author?.name ?? "Unknown";
  return `name:${name.toLowerCase()}`;
}

async function fetchProjectStats(token, owner, repo) {
  let cursor = null;
  let totalCommits = 0;
  let firstCommitDate = null;
  let lastCommitDate = null;
  const authors = new Map();

  while (true) {
    const data = await fetchGraphQL(token, COMMIT_HISTORY_QUERY, {
      owner,
      name: repo,
      cursor,
    });
    const ref = data?.repository?.defaultBranchRef;
    if (!ref) {
      throw new Error(`No default branch for ${owner}/${repo}`);
    }
    const history = ref.target?.history;
    if (!history) {
      throw new Error(`No commit history for ${owner}/${repo}`);
    }
    totalCommits = history.totalCount;
    for (const node of history.nodes ?? []) {
      const date = node.committedDate;
      if (date) {
        if (!lastCommitDate || date > lastCommitDate) lastCommitDate = date;
        if (!firstCommitDate || date < firstCommitDate) firstCommitDate = date;
      }
      const key = authorKey(node);
      const existing = authors.get(key);
      if (existing) {
        existing.commits += 1;
      } else {
        authors.set(key, {
          login: node.author?.user?.login ?? null,
          name: node.author?.name ?? node.author?.user?.login ?? "Unknown",
          commits: 1,
        });
      }
    }
    if (!history.pageInfo?.hasNextPage) break;
    cursor = history.pageInfo.endCursor;
  }

  const authorList = [...authors.values()].sort(
    (a, b) => b.commits - a.commits || a.name.localeCompare(b.name),
  );

  return {
    owner,
    repo,
    firstCommitDate: firstCommitDate ? firstCommitDate.slice(0, 10) : null,
    lastCommitDate: lastCommitDate ? lastCommitDate.slice(0, 10) : null,
    totalCommits,
    authors: authorList,
  };
}

function projectKey(owner, repo) {
  return `${owner}/${repo}`;
}

function collectProjectRefs(cv) {
  const refs = [];
  const seen = new Set();
  for (const project of cv.projects ?? []) {
    const gh = project.github;
    if (!gh?.owner || !gh?.repo) continue;
    const key = projectKey(gh.owner, gh.repo);
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ owner: gh.owner, repo: gh.repo });
  }
  return refs;
}

async function main() {
  const cv = JSON.parse(readFileSync(cvPath, "utf8"));
  const refs = collectProjectRefs(cv);
  if (refs.length === 0) {
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.log("No projects with github refs — wrote disabled stats file.");
    }
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    if (!toStdout && existsSync(outPath)) {
      console.warn(
        "GITHUB_TOKEN not set — keeping existing project-stats.json cache.",
      );
      return;
    }
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.warn(
        "GITHUB_TOKEN not set and no cache — wrote disabled project stats file.",
      );
    }
    return;
  }

  const projects = {};
  const failed = [];
  for (const ref of refs) {
    try {
      const stats = await fetchProjectStats(token, ref.owner, ref.repo);
      projects[projectKey(ref.owner, ref.repo)] = stats;
    } catch (err) {
      failed.push({ ref, message: err.message });
    }
  }

  if (failed.length === refs.length) {
    if (!toStdout && existsSync(outPath)) {
      console.warn(
        `All project fetches failed (${failed[0].message}) — keeping existing cache.`,
      );
      return;
    }
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.warn(
        `All project fetches failed (${failed[0].message}) — wrote disabled stats file.`,
      );
    }
    return;
  }

  if (failed.length > 0 && !toStdout && existsSync(outPath)) {
    try {
      const cached = JSON.parse(readFileSync(outPath, "utf8"));
      for (const { ref } of failed) {
        const key = projectKey(ref.owner, ref.repo);
        if (cached?.projects?.[key]) {
          projects[key] = cached.projects[key];
        }
      }
    } catch {
      // ignore unreadable cache; carry on with what we have
    }
  }

  emit({
    enabled: true,
    fetchedAt: new Date().toISOString(),
    projects,
  });
  if (!toStdout) {
    const total = Object.keys(projects).length;
    if (failed.length > 0) {
      console.warn(
        `Project stats written to ${outPath} (${total}/${refs.length} repos; ${failed.length} failed: ${failed
          .map((f) => `${f.ref.owner}/${f.ref.repo}`)
          .join(", ")}).`,
      );
    } else {
      console.log(`Project stats written to ${outPath} (${total} repos).`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
