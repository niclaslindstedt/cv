#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { loadCv } from "../src/data/load-cv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const githubPath = resolve(here, "..", "src", "data", "github-activity.json");
const projectStatsPath = resolve(
  here,
  "..",
  "src",
  "data",
  "project-stats.json",
);
const defaultOut = resolve(here, "..", "src", "data", "timeline.json");

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

const LANGUAGES = ["en", "sv"];

function localize(value) {
  if (value && typeof value === "object" && "en" in value && "sv" in value) {
    return { en: value.en, sv: value.sv };
  }
  const str = value ?? "";
  return { en: str, sv: str };
}

function localizedJoin(pieces, separator) {
  const out = {};
  for (const lang of LANGUAGES) {
    out[lang] = pieces.map((p) => localize(p)[lang]).join(separator);
  }
  return out;
}

function monthIndex(iso) {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function isoFromMonthIndex(idx) {
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// 60 ECTS at full-time engagement = 1 academic year ≈ 10 months of study, so
// 6 ECTS/month at 100%. Scale by engagement to convert to calendar months.
const ECTS_PER_MONTH_FULL_TIME = 6;

function parseCredits(credits) {
  const match = String(credits).match(/[-+]?\d*\.?\d+/);
  return match ? Number(match[0]) : NaN;
}

function deriveCourseEnd(course) {
  if (course.completedDate) return course.completedDate;
  const momentDates = (course.moments ?? [])
    .map((m) => m.completedDate)
    .filter(Boolean);
  if (momentDates.length === 0) {
    throw new Error(
      `Course ${course.code}: cannot derive end date — needs completedDate or at least one moment with completedDate.`,
    );
  }
  return momentDates.reduce((latest, d) => (d > latest ? d : latest));
}

function deriveCourseStart(course) {
  if (course.startDate) return course.startDate;
  const ects = parseCredits(course.credits);
  if (!Number.isFinite(ects) || ects <= 0) {
    throw new Error(
      `Course ${course.code}: cannot derive start date — credits "${course.credits}" is not parseable as ECTS.`,
    );
  }
  const engagement = course.engagement ?? 1;
  const months = Math.max(
    1,
    Math.ceil(ects / (ECTS_PER_MONTH_FULL_TIME * engagement)),
  );
  return isoFromMonthIndex(monthIndex(deriveCourseEnd(course)) - (months - 1));
}

function nowMonthIndex() {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
}

function roleEntries(sortedRoles) {
  if (!sortedRoles || sortedRoles.length < 2) return undefined;
  return sortedRoles.map((role) => ({
    startDate: role.startDate,
    title: localize(role.title),
  }));
}

function mergeTags(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      if (!seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
  }
  return out;
}

function buildItems(cv) {
  const companies = new Map(cv.companies.map((c) => [c.id, c]));
  const lookup = (id) => {
    const company = companies.get(id);
    if (!company) throw new Error(`Unknown company id: ${id}`);
    return company;
  };

  const items = [];
  cv.experience.forEach((exp, i) => {
    const company = lookup(exp.companyId);
    const sortedExpRoles = [...exp.roles].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
    items.push({
      id: `exp-${i}`,
      kind: "experience",
      title: localizedJoin(
        sortedExpRoles.map((r) => r.title),
        " → ",
      ),
      subtitle: localize(company.name),
      description: localize(company.description),
      startDate: exp.startDate,
      endDate: exp.endDate,
      skills: mergeTags(exp.stack, exp.skills),
      notes: exp.notes ? localize(exp.notes) : undefined,
      roles: roleEntries(sortedExpRoles),
    });
    (exp.assignments ?? []).forEach((a, j) => {
      const client = lookup(a.clientId);
      const sortedRoles = [...a.roles].sort((x, y) =>
        x.startDate.localeCompare(y.startDate),
      );
      const title = localizedJoin(
        sortedRoles.map((r) => r.title),
        " → ",
      );
      const subtitle = localizedJoin(
        [client.name, ` · via ${company.name}`],
        "",
      );
      items.push({
        id: `exp-${i}-asg-${j}`,
        kind: "assignment",
        title,
        subtitle,
        description: localize(client.description),
        startDate: a.startDate,
        endDate: a.endDate,
        skills: mergeTags(a.stack, a.skills),
        notes: a.notes ? localize(a.notes) : undefined,
        roles: roleEntries(sortedRoles),
      });
    });
  });
  (cv.education ?? []).forEach((ed, i) => {
    const institution = localize(ed.institution);
    const level = localize(ed.level);
    const subtitle = {};
    for (const lang of LANGUAGES) {
      subtitle[lang] = `${institution[lang]} · ${level[lang]}`;
    }
    items.push({
      id: `edu-${i}`,
      kind: "education",
      title: localize(ed.field),
      subtitle,
      description: localize(""),
      credits: ed.credits,
      startDate: ed.startDate,
      endDate: ed.endDate,
      skills: ed.skills ?? [],
      notes: ed.notes ? localize(ed.notes) : undefined,
    });
  });
  (cv.courses ?? []).forEach((course, i) => {
    const institution = localize(course.institution);
    const subtitle = {};
    for (const lang of LANGUAGES) {
      subtitle[lang] = `${institution[lang]} · ${course.code}`;
    }
    items.push({
      id: `course-${i}`,
      kind: "course",
      title: localize(course.name),
      subtitle,
      description: localize(""),
      credits: course.credits,
      remote: course.remote === true ? true : undefined,
      startDate: deriveCourseStart(course),
      endDate: deriveCourseEnd(course),
      skills: course.skills ?? [],
    });
  });
  return items;
}

function buildSideProjectItems(cv, projectStats) {
  if (!projectStats?.enabled) return [];
  const projects = projectStats.projects ?? {};
  const items = [];
  for (const project of cv.projects ?? []) {
    const gh = project.github;
    if (!gh?.owner || !gh?.repo) continue;
    const stats = projects[`${gh.owner}/${gh.repo}`];
    if (!stats?.firstCommitDate || !stats?.lastCommitDate) continue;
    const firstCommitDate = stats.firstCommitDate.slice(0, 10);
    const lastCommitDate = stats.lastCommitDate.slice(0, 10);
    const startDate = firstCommitDate.slice(0, 7);
    const endDate = lastCommitDate.slice(0, 7);
    items.push({
      id: `proj-${gh.owner}-${gh.repo}`,
      kind: "sideProject",
      title: localize(project.name),
      subtitle: localize(project.tagline),
      description: localize(project.description),
      startDate,
      endDate,
      skills: mergeTags(project.stack, project.skills),
      sideProject: {
        totalCommits: stats.totalCommits ?? 0,
        openSource: project.openSource === true,
        repoUrl: `https://github.com/${gh.owner}/${gh.repo}`,
        firstCommitDate,
        lastCommitDate,
      },
    });
  }
  return items;
}

function findBusiestRepoForYear(year, cv, projectStats) {
  if (!projectStats?.enabled) return null;
  const yearKey = String(year);
  let winner = null;
  for (const project of cv.projects ?? []) {
    const gh = project.github;
    if (!gh?.owner || !gh?.repo) continue;
    const stats = projectStats.projects?.[`${gh.owner}/${gh.repo}`];
    const commits = stats?.commitsByYear?.[yearKey] ?? 0;
    if (commits <= 0) continue;
    if (!winner || commits > winner.commits) {
      winner = {
        owner: gh.owner,
        repo: gh.repo,
        name: project.name,
        commits,
        repoUrl: `https://github.com/${gh.owner}/${gh.repo}`,
      };
    }
  }
  return winner;
}

function buildGithubItems(activity, cv, projectStats) {
  if (!activity?.enabled || !Array.isArray(activity.years)) return [];
  const items = [];
  for (const year of activity.years) {
    if (!year || typeof year.year !== "number") continue;
    const github = {
      totalCommits: year.totalCommits,
      dailyCommits: year.dailyCommits,
      busiestMonth: year.busiestMonth,
      busiestMonthCount: year.busiestMonthCount ?? 0,
      busiestWeekStart: year.busiestWeekStart,
      busiestWeekCount: year.busiestWeekCount ?? 0,
      busiestDay: year.busiestDay ?? `${year.year}-01-01`,
      busiestDayCount: year.busiestDayCount ?? 0,
      profileUrl: activity.profileUrl,
      username: activity.username,
      maxDailyCommits: activity.maxDailyCommits ?? 0,
    };
    const busiestRepo = findBusiestRepoForYear(year.year, cv, projectStats);
    if (busiestRepo) github.busiestRepo = busiestRepo;
    items.push({
      id: `gh-${year.year}`,
      kind: "github",
      title: localize(String(year.year)),
      subtitle: localize(`${year.totalCommits} commits`),
      description: localize(""),
      startDate: `${year.year}-01`,
      endDate: `${year.year}-12`,
      skills: [],
      github,
    });
  }
  return items;
}

function buildLayout(cv, activity, projectStats) {
  const nowMonth = nowMonthIndex();
  const items = buildItems(cv);
  const sideProjectItems = buildSideProjectItems(cv, projectStats);
  items.push(...sideProjectItems);
  const githubItems = buildGithubItems(activity, cv, projectStats);
  items.push(...githubItems);

  const trackDefs = [
    { key: "experience", label: { en: "Jobs", sv: "Anställningar" } },
    { key: "assignment", label: { en: "Assignments", sv: "Uppdrag" } },
    { key: "education", label: { en: "Education", sv: "Utbildning" } },
    { key: "course", label: { en: "Courses", sv: "Kurser" } },
  ];
  if (sideProjectItems.length > 0) {
    trackDefs.push({
      key: "sideProject",
      label: { en: "Side projects", sv: "Sidoprojekt" },
    });
  }
  if (githubItems.length > 0) {
    trackDefs.push({ key: "github", label: { en: "GitHub", sv: "GitHub" } });
  }

  const prepared = items.map((item) => {
    const barStart = monthIndex(item.startDate);
    const endMonthAtBuild = item.endDate ? monthIndex(item.endDate) : nowMonth;
    return {
      ...item,
      barStart,
      endMonthAtBuild,
      barEndExclusive: endMonthAtBuild + 1,
      segments: [],
    };
  });

  // Same-month handoffs on the same track (A.endDate === B.startDate) are real
  // sequential transitions, not overlaps. Split the shared month so the lane
  // packer can slot them on one row and they render edge-to-edge instead of
  // stacking into parallel lanes. Side projects are parallel work, not
  // sequential, so skip them — splitting both ends of a single-month project
  // bar would collapse it to zero width.
  for (const a of prepared) {
    if (!a.endDate) continue;
    if (a.kind === "sideProject") continue;
    for (const b of prepared) {
      if (a === b || a.kind !== b.kind) continue;
      if (b.startDate === a.endDate) {
        a.barEndExclusive = monthIndex(a.endDate) + 0.5;
        b.barStart = monthIndex(b.startDate) + 0.5;
      }
    }
  }

  let dataMin = Number.POSITIVE_INFINITY;
  let dataMax = Number.NEGATIVE_INFINITY;
  for (const p of prepared) {
    if (p.barStart < dataMin) dataMin = p.barStart;
    if (p.endMonthAtBuild > dataMax) dataMax = p.endMonthAtBuild;
  }
  if (!Number.isFinite(dataMin)) dataMin = nowMonth;
  if (!Number.isFinite(dataMax)) dataMax = nowMonth;

  const minMonth = dataMin - 6;
  const maxMonth = Math.max(dataMax, nowMonth) + 6;

  const breakSet = new Set([minMonth, maxMonth]);
  for (const p of prepared) {
    if (p.barStart > minMonth && p.barStart < maxMonth) {
      breakSet.add(p.barStart);
    }
    if (p.barEndExclusive > minMonth && p.barEndExclusive < maxMonth) {
      breakSet.add(p.barEndExclusive);
    }
  }
  const breakpoints = [...breakSet].sort((a, b) => a - b);

  const byTrack = trackDefs.map((def) =>
    prepared.filter((p) => p.kind === def.key),
  );

  for (const bars of byTrack) {
    const sorted = [...bars].sort((a, b) => {
      if (a.barStart !== b.barStart) return a.barStart - b.barStart;
      return a.id.localeCompare(b.id);
    });
    const laneEnds = [];
    for (const bar of sorted) {
      let laneIdx = laneEnds.findIndex((end) => end <= bar.barStart);
      if (laneIdx === -1) {
        laneIdx = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[laneIdx] = bar.barEndExclusive;
      bar.lane = laneIdx;
    }
  }

  const intervals = [];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const startMonth = breakpoints[i];
    const endMonth = breakpoints[i + 1];
    const trackActiveCounts = [];
    for (let t = 0; t < trackDefs.length; t++) {
      const active = byTrack[t].filter(
        (p) => p.barStart <= startMonth && p.barEndExclusive >= endMonth,
      );
      active.forEach((p) => {
        p.segments.push({ startMonth, endMonth, activeLane: p.lane });
      });
      trackActiveCounts.push(active.length);
    }
    intervals.push({ startMonth, endMonth, trackActiveCounts });
  }

  const tracks = trackDefs.map((def, t) => ({
    key: def.key,
    label: def.label,
    bars: byTrack[t].map((p) => {
      const bar = {
        id: p.id,
        kind: p.kind,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        skills: p.skills,
        startDate: p.startDate,
        endDate: p.endDate,
        isOngoing: p.endDate === null,
        endMonthAtBuild: p.endMonthAtBuild,
        segments: p.segments,
      };
      if (p.notes) bar.notes = p.notes;
      if (p.credits) bar.credits = p.credits;
      if (p.remote) bar.remote = p.remote;
      if (p.github) bar.github = p.github;
      if (p.sideProject) bar.sideProject = p.sideProject;
      if (p.roles) bar.roles = p.roles;
      return bar;
    }),
  }));

  for (const interval of intervals) {
    if (interval.trackActiveCounts.length !== tracks.length) {
      throw new Error(
        `trackActiveCounts length ${interval.trackActiveCounts.length} !== tracks.length ${tracks.length}`,
      );
    }
  }
  for (const track of tracks) {
    for (const bar of track.bars) {
      if (bar.segments.length === 0) {
        throw new Error(`Bar ${bar.id} produced no segments`);
      }
      for (let i = 1; i < bar.segments.length; i++) {
        if (bar.segments[i].startMonth !== bar.segments[i - 1].endMonth) {
          throw new Error(
            `Bar ${bar.id} segments are not contiguous at index ${i}`,
          );
        }
      }
    }
  }

  return { minMonth, maxMonth, intervals, tracks };
}

const cv = loadCv();
let activity = { enabled: false, years: [] };
if (existsSync(githubPath)) {
  try {
    activity = JSON.parse(readFileSync(githubPath, "utf8"));
  } catch (err) {
    console.warn(`Could not parse github-activity.json (${err.message}).`);
  }
}
let projectStats = { enabled: false, projects: {} };
if (existsSync(projectStatsPath)) {
  try {
    projectStats = JSON.parse(readFileSync(projectStatsPath, "utf8"));
  } catch (err) {
    console.warn(`Could not parse project-stats.json (${err.message}).`);
  }
}
const data = buildLayout(cv, activity, projectStats);
const serialized = JSON.stringify(data, null, 2) + "\n";

if (toStdout) {
  process.stdout.write(serialized);
} else {
  writeFileSync(outPath, serialized);
  const barCount = data.tracks.reduce((n, t) => n + t.bars.length, 0);
  const segCount = data.tracks.reduce(
    (n, t) => n + t.bars.reduce((m, b) => m + b.segments.length, 0),
    0,
  );
  console.log(
    `Timeline layout written to ${outPath} (${data.tracks.length} tracks, ${barCount} bars, ${segCount} segments, ${data.intervals.length} intervals).`,
  );
}
