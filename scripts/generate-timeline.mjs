#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cvPath = resolve(here, "..", "src", "data", "cv.json");
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

function monthIndex(iso) {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function nowMonthIndex() {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
}

function buildItems(cv) {
  const items = [];
  cv.experience.forEach((exp, i) => {
    items.push({
      id: `exp-${i}`,
      kind: "experience",
      title: exp.role,
      subtitle: exp.company,
      description: exp.companyDescription,
      startDate: exp.startDate,
      endDate: exp.endDate,
      skills: exp.skills ?? [],
    });
    const grouped = new Map();
    (exp.assignments ?? []).forEach((a, j) => {
      const existing = grouped.get(a.client);
      if (!existing) {
        grouped.set(a.client, {
          firstIndex: j,
          roles: [{ role: a.role, startDate: a.startDate }],
          client: a.client,
          description: a.clientDescription,
          startDate: a.startDate,
          endDate: a.endDate,
          skills: [...(a.skills ?? [])],
        });
      } else {
        existing.roles.push({ role: a.role, startDate: a.startDate });
        if (a.startDate < existing.startDate) existing.startDate = a.startDate;
        if (existing.endDate !== null) {
          if (a.endDate === null) existing.endDate = null;
          else if (a.endDate > existing.endDate) existing.endDate = a.endDate;
        }
        for (const skill of a.skills ?? []) {
          if (!existing.skills.includes(skill)) existing.skills.push(skill);
        }
      }
    });
    for (const group of grouped.values()) {
      const sortedRoles = [...group.roles].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      );
      const title = sortedRoles.map((r) => r.role).join(" → ");
      items.push({
        id: `exp-${i}-asg-${group.firstIndex}`,
        kind: "assignment",
        title,
        subtitle: `${group.client} · via ${exp.company}`,
        description: group.description,
        startDate: group.startDate,
        endDate: group.endDate,
        skills: group.skills,
      });
    }
  });
  (cv.education ?? []).forEach((ed, i) => {
    items.push({
      id: `edu-${i}`,
      kind: "education",
      title: ed.field,
      subtitle: `${ed.institution} · ${ed.level}`,
      description: `${ed.credits}`,
      startDate: ed.startDate,
      endDate: ed.endDate,
      skills: ed.skills ?? [],
    });
  });
  return items;
}

function assignLanes(items, nowMonth) {
  const sorted = [...items].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const lanes = [];
  const placed = [];
  for (const item of sorted) {
    const start = monthIndex(item.startDate);
    const end = item.endDate ? monthIndex(item.endDate) : nowMonth;
    let lane = lanes.findIndex((occupiedUntil) => occupiedUntil <= start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(end);
    } else {
      lanes[lane] = end;
    }
    placed.push({ ...item, lane, endMonthAtBuild: end });
  }
  return placed;
}

function toBar(placed) {
  return {
    id: placed.id,
    kind: placed.kind,
    lane: placed.lane,
    title: placed.title,
    subtitle: placed.subtitle,
    description: placed.description,
    skills: placed.skills,
    startDate: placed.startDate,
    endDate: placed.endDate,
    isOngoing: placed.endDate === null,
    endMonthAtBuild: placed.endMonthAtBuild,
  };
}

function buildTimeline(cv) {
  const nowMonth = nowMonthIndex();
  const items = buildItems(cv);

  const trackDefs = [
    { key: "experience", label: "Jobs" },
    { key: "assignment", label: "Assignments" },
    { key: "education", label: "Education" },
  ];

  const tracks = trackDefs.map((def) => {
    const placed = assignLanes(
      items.filter((it) => it.kind === def.key),
      nowMonth,
    );
    const lanes = placed.length
      ? Math.max(...placed.map((p) => p.lane)) + 1
      : 1;
    return {
      key: def.key,
      label: def.label,
      lanes: Math.max(1, lanes),
      bars: placed.map(toBar),
    };
  });

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const t of tracks) {
    for (const bar of t.bars) {
      min = Math.min(min, monthIndex(bar.startDate));
      max = Math.max(max, bar.endMonthAtBuild);
    }
  }
  if (!Number.isFinite(min)) min = nowMonth;
  if (!Number.isFinite(max)) max = nowMonth;

  return {
    minMonth: min - 6,
    maxMonth: Math.max(max, nowMonth) + 6,
    tracks,
  };
}

const cv = JSON.parse(readFileSync(cvPath, "utf8"));
const data = buildTimeline(cv);
const serialized = JSON.stringify(data, null, 2) + "\n";

if (toStdout) {
  process.stdout.write(serialized);
} else {
  writeFileSync(outPath, serialized);
  const barCount = data.tracks.reduce((n, t) => n + t.bars.length, 0);
  console.log(
    `Timeline layout written to ${outPath} (${data.tracks.length} tracks, ${barCount} bars).`,
  );
}
