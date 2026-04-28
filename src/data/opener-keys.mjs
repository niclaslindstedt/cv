// Stable opener keys for search-index records that point at experience and
// assignment items. The keys are produced at build time (see
// scripts/generate-search-index.mjs) and consumed by the runtime to look
// the matching item back up (see App.tsx). Keep both ends in sync.
//
// Format:
//   experience: `${companyId}:${exp.startDate}`
//   assignment: `${exp.companyId}:${exp.startDate}::${asg.clientId}:${asg.startDate}`

export function experienceOpenerKey(exp) {
  return `${exp.companyId}:${exp.startDate}`;
}

export function assignmentOpenerKey(exp, asg) {
  return `${exp.companyId}:${exp.startDate}::${asg.clientId}:${asg.startDate}`;
}
