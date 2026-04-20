// Central output module — all user-facing console output routes through here.
// Keeps formatting consistent and makes it easy to swap underlying transport.

export function status(msg: string): void {
  console.log(`✓ ${msg}`);
}

export function warn(msg: string): void {
  console.warn(`⚠ ${msg}`);
}

export function info(msg: string): void {
  console.info(`ℹ ${msg}`);
}

export function header(msg: string): void {
  console.log(`\n▶ ${msg}`);
}

export function error(msg: string): void {
  console.error(`✗ ${msg}`);
}
