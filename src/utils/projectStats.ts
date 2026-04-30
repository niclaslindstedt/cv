import type {
  GithubRepoRef,
  ProjectStats,
  ProjectStatsFile,
} from "../data/cv.types";

export function statsKey(ref: GithubRepoRef): string {
  return `${ref.owner}/${ref.repo}`;
}

export function aggregateProjectStats(
  repos: GithubRepoRef[],
  file: ProjectStatsFile,
): ProjectStats | undefined {
  if (!file.enabled) return undefined;
  const matched: ProjectStats[] = [];
  for (const ref of repos) {
    const stats = file.projects?.[statsKey(ref)];
    if (stats) matched.push(stats);
  }
  if (matched.length === 0) return undefined;
  if (matched.length === 1) return matched[0];

  let firstCommitDate: string | null = null;
  let lastCommitDate: string | null = null;
  let totalCommits = 0;
  for (const s of matched) {
    if (
      s.firstCommitDate &&
      (!firstCommitDate || s.firstCommitDate < firstCommitDate)
    ) {
      firstCommitDate = s.firstCommitDate;
    }
    if (
      s.lastCommitDate &&
      (!lastCommitDate || s.lastCommitDate > lastCommitDate)
    ) {
      lastCommitDate = s.lastCommitDate;
    }
    totalCommits += s.totalCommits ?? 0;
  }
  return {
    owner: matched[0].owner,
    repo: matched[0].repo,
    username: matched[0].username,
    firstCommitDate,
    lastCommitDate,
    totalCommits,
  };
}
