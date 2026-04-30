#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { loadCv } from "../src/data/load-cv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
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

function extractUsername(cv) {
  const links = Array.isArray(cv.links) ? cv.links : [];
  for (const link of links) {
    const url = typeof link?.url === "string" ? link.url : "";
    const match = url.match(/github\.com\/([^/?#]+)/i);
    if (match && match[1]) return match[1];
  }
  return null;
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
              pageInfo { hasNextPage endCursor }
              nodes {
                committedDate
                author { user { login } }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchProjectStats(token, owner, repo, username, openSource) {
  const lowerUser = username.toLowerCase();
  let cursor = null;
  let totalCommits = 0;
  let firstCommitDate = null;
  let lastCommitDate = null;
  const commitsByYear = {};

  while (true) {
    const data = await fetchGraphQL(token, COMMIT_HISTORY_QUERY, {
      owner,
      name: repo,
      cursor,
    });
    if (!data?.repository) {
      throw new Error(
        `Repository ${owner}/${repo} not visible to token (private repo without access?)`,
      );
    }
    const ref = data.repository.defaultBranchRef;
    if (!ref) {
      throw new Error(`No default branch for ${owner}/${repo}`);
    }
    const history = ref.target?.history;
    if (!history) {
      throw new Error(`No commit history for ${owner}/${repo}`);
    }
    for (const node of history.nodes ?? []) {
      if (openSource) {
        const login = node.author?.user?.login?.toLowerCase() ?? null;
        if (login !== lowerUser) continue;
      }
      totalCommits += 1;
      const date = node.committedDate;
      if (date) {
        if (!lastCommitDate || date > lastCommitDate) lastCommitDate = date;
        if (!firstCommitDate || date < firstCommitDate) firstCommitDate = date;
        const year = date.slice(0, 4);
        commitsByYear[year] = (commitsByYear[year] ?? 0) + 1;
      }
    }
    if (!history.pageInfo?.hasNextPage) break;
    cursor = history.pageInfo.endCursor;
  }

  return {
    owner,
    repo,
    username,
    firstCommitDate: firstCommitDate ? firstCommitDate.slice(0, 10) : null,
    lastCommitDate: lastCommitDate ? lastCommitDate.slice(0, 10) : null,
    totalCommits,
    commitsByYear,
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
    refs.push({
      owner: gh.owner,
      repo: gh.repo,
      openSource: project.openSource === true,
    });
  }
  return refs;
}

async function main() {
  const cv = loadCv();
  const refs = collectProjectRefs(cv);
  if (refs.length === 0) {
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.log("No projects with github refs — wrote disabled stats file.");
    }
    return;
  }

  const username = extractUsername(cv);
  if (!username) {
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.warn(
        "No GitHub profile in cv.json — wrote disabled project stats file.",
      );
    }
    return;
  }

  const tokenSource = process.env.PROJECT_STATS_TOKEN
    ? "PROJECT_STATS_TOKEN"
    : process.env.GITHUB_TOKEN
      ? "GITHUB_TOKEN"
      : null;
  const token = process.env.PROJECT_STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    if (!toStdout && existsSync(outPath)) {
      console.warn(
        "PROJECT_STATS_TOKEN/GITHUB_TOKEN not set — keeping existing project-stats.json cache.",
      );
      return;
    }
    emit({ enabled: false, projects: {} });
    if (!toStdout) {
      console.warn(
        "PROJECT_STATS_TOKEN/GITHUB_TOKEN not set and no cache — wrote disabled project stats file.",
      );
    }
    return;
  }

  if (!toStdout) {
    let viewerLogin = null;
    try {
      const data = await fetchGraphQL(token, `query { viewer { login } }`, {});
      viewerLogin = data?.viewer?.login ?? null;
    } catch (err) {
      console.warn(
        `Project stats: ${tokenSource} viewer probe failed — ${err.message}`,
      );
    }
    if (viewerLogin) {
      console.log(
        `Project stats: using ${tokenSource} (authenticated as @${viewerLogin}); ${refs.length} repo(s) to fetch.`,
      );
    } else {
      console.log(
        `Project stats: using ${tokenSource} (viewer login unknown); ${refs.length} repo(s) to fetch.`,
      );
    }
  }

  const projects = {};
  const failed = [];
  for (const ref of refs) {
    try {
      const stats = await fetchProjectStats(
        token,
        ref.owner,
        ref.repo,
        username,
        ref.openSource,
      );
      projects[projectKey(ref.owner, ref.repo)] = stats;
    } catch (err) {
      failed.push({ ref, message: err.message });
      if (!toStdout) {
        console.warn(
          `Project stats: ${ref.owner}/${ref.repo} failed — ${err.message}`,
        );
      }
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
    username,
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
