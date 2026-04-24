#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cvPath = resolve(here, "..", "src", "data", "cv.json");
const defaultOut = resolve(here, "..", "src", "data", "github-activity.json");

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
    if (match && match[1]) {
      return { username: match[1], profileUrl: url };
    }
  }
  return null;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

function dayOfYear(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const daysBefore = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let doy = daysBefore[m - 1] + (d - 1);
  if (m > 2 && isLeapYear(y)) doy += 1;
  return doy;
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

async function fetchCreationYear(token, username) {
  const data = await fetchGraphQL(
    token,
    `query($login: String!) { user(login: $login) { createdAt } }`,
    { login: username },
  );
  if (!data?.user?.createdAt) {
    throw new Error(`User not found: ${username}`);
  }
  return Number(data.user.createdAt.slice(0, 4));
}

async function fetchYear(token, username, year) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const data = await fetchGraphQL(
    token,
    `query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`,
    { login: username, from, to },
  );
  const cal = data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`No calendar for ${username} ${year}`);

  const dailyCommits = new Array(daysInYear(year)).fill(0);
  let totalCommits = 0;
  const monthTotals = new Array(12).fill(0);
  const weekBuckets = new Map();

  for (const week of cal.weeks ?? []) {
    for (const day of week.contributionDays ?? []) {
      const [yStr, mStr] = day.date.split("-");
      if (Number(yStr) !== year) continue;
      const doy = dayOfYear(day.date);
      const count = day.contributionCount ?? 0;
      if (doy >= 0 && doy < dailyCommits.length) {
        dailyCommits[doy] = count;
      }
      totalCommits += count;
      monthTotals[Number(mStr) - 1] += count;
      const weekStart = weekStartDate(day.date);
      weekBuckets.set(weekStart, (weekBuckets.get(weekStart) ?? 0) + count);
    }
  }

  let busiestMonth = 1;
  let busiestMonthCount = -1;
  for (let i = 0; i < 12; i++) {
    if (monthTotals[i] > busiestMonthCount) {
      busiestMonthCount = monthTotals[i];
      busiestMonth = i + 1;
    }
  }

  let busiestWeekStart = `${year}-01-01`;
  let busiestWeekCount = -1;
  for (const [start, count] of weekBuckets) {
    if (count > busiestWeekCount) {
      busiestWeekCount = count;
      busiestWeekStart = start;
    }
  }

  return {
    year,
    totalCommits,
    busiestMonth,
    busiestWeekStart,
    dailyCommits,
  };
}

function weekStartDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const cv = JSON.parse(readFileSync(cvPath, "utf8"));
  const profile = extractUsername(cv);
  if (!profile) {
    emit({ enabled: false, years: [] });
    if (!toStdout) {
      console.log(
        "No GitHub profile in cv.json — wrote disabled activity file.",
      );
    }
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    if (!toStdout && existsSync(outPath)) {
      console.warn(
        "GITHUB_TOKEN not set — keeping existing github-activity.json cache.",
      );
      return;
    }
    emit({ enabled: false, years: [] });
    if (!toStdout) {
      console.warn(
        "GITHUB_TOKEN not set and no cache — wrote disabled activity file.",
      );
    }
    return;
  }

  try {
    const startYear = await fetchCreationYear(token, profile.username);
    const endYear = new Date().getUTCFullYear();
    const years = [];
    let maxDailyCommits = 0;
    for (let y = startYear; y <= endYear; y++) {
      const year = await fetchYear(token, profile.username, y);
      years.push(year);
      for (const count of year.dailyCommits) {
        if (count > maxDailyCommits) maxDailyCommits = count;
      }
    }
    emit({
      enabled: true,
      username: profile.username,
      profileUrl: profile.profileUrl,
      fetchedAt: new Date().toISOString(),
      maxDailyCommits,
      years,
    });
    if (!toStdout) {
      const totalCommits = years.reduce((n, y) => n + y.totalCommits, 0);
      console.log(
        `GitHub activity written to ${outPath} (${years.length} years, ${totalCommits} commits).`,
      );
    }
  } catch (err) {
    if (!toStdout && existsSync(outPath)) {
      console.warn(
        `GitHub fetch failed (${err.message}) — keeping existing cache.`,
      );
      return;
    }
    emit({ enabled: false, years: [] });
    if (!toStdout) {
      console.warn(
        `GitHub fetch failed (${err.message}) — wrote disabled activity file.`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
