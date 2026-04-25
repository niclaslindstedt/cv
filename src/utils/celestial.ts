export type CelestialPosition = {
  x: number;
  y: number;
  altitude: number;
  hours: number;
};

export function getSunPosition(date: Date = new Date()): CelestialPosition {
  const hours = date.getHours() + date.getMinutes() / 60;
  const t = ((hours - 6) / 12) * Math.PI;
  const x = 0.5 - 0.5 * Math.cos(t);
  const altitude = Math.sin(t);
  const y = 0.5 - 0.42 * altitude;
  return { x, y, altitude, hours };
}

export function getMoonPosition(date: Date = new Date()): CelestialPosition {
  const offset = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  return getSunPosition(offset);
}
