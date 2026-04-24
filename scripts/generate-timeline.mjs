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
    items.push({
      id: `exp-${i}`,
      kind: "experience",
      title: exp.role,
      subtitle: company.name,
      description: company.description,
      startDate: exp.startDate,
      endDate: exp.endDate,
      skills: mergeTags(exp.stack, exp.skills),
    });
    const grouped = new Map();
    (exp.assignments ?? []).forEach((a, j) => {
      const client = lookup(a.clientId);
      const existing = grouped.get(a.clientId);
      if (!existing) {
        grouped.set(a.clientId, {
          firstIndex: j,
          roles: [{ role: a.role, startDate: a.startDate }],
          client,
          startDate: a.startDate,
          endDate: a.endDate,
          skills: mergeTags(a.stack, a.skills),
        });
      } else {
        existing.roles.push({ role: a.role, startDate: a.startDate });
        if (a.startDate < existing.startDate) existing.startDate = a.startDate;
        if (existing.endDate !== null) {
          if (a.endDate === null) existing.endDate = null;
          else if (a.endDate > existing.endDate) existing.endDate = a.endDate;
        }
        for (const tag of [...(a.stack ?? []), ...(a.skills ?? [])]) {
          if (!existing.skills.includes(tag)) existing.skills.push(tag);
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
        subtitle: `${group.client.name} · via ${company.name}`,
        description: group.client.description,
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

function buildLayout(cv) {
  const nowMonth = nowMonthIndex();
  const items = buildItems(cv);

  const trackDefs = [
    { key: "experience", label: "Jobs" },
    { key: "assignment", label: "Assignments" },
    { key: "education", label: "Education" },
  ];

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

  const intervals = [];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const startMonth = breakpoints[i];
    const endMonth = breakpoints[i + 1];
    const trackActiveCounts = [];
    for (let t = 0; t < trackDefs.length; t++) {
      const active = byTrack[t]
        .filter(
          (p) => p.barStart <= startMonth && p.barEndExclusive >= endMonth,
        )
        .sort((a, b) => {
          if (a.barStart !== b.barStart) return a.barStart - b.barStart;
          return a.id.localeCompare(b.id);
        });
      active.forEach((p, idx) => {
        p.segments.push({ startMonth, endMonth, activeLane: idx });
      });
      trackActiveCounts.push(active.length);
    }
    intervals.push({ startMonth, endMonth, trackActiveCounts });
  }

  const tracks = trackDefs.map((def, t) => ({
    key: def.key,
    label: def.label,
    bars: byTrack[t].map((p) => ({
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
    })),
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

const cv = JSON.parse(readFileSync(cvPath, "utf8"));
const data = buildLayout(cv);
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
