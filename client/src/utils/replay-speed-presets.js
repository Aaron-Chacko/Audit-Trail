/**
 * Replay Speed Multipliers & Dynamic Interval Calculator
 * Controls timeline automated event playback pacing and step delays.
 */

export const REPLAY_SPEED_PRESETS = [
  { label: '0.5x (Slow)', value: 0.5, delayMs: 2400 },
  { label: '1.0x (Normal)', value: 1.0, delayMs: 1200 },
  { label: '2.0x (Fast)', value: 2.0, delayMs: 600 },
  { label: '5.0x (Sprint)', value: 5.0, delayMs: 240 },
  { label: '10.0x (Instant)', value: 10.0, delayMs: 100 }
];

export const DEFAULT_SPEED = REPLAY_SPEED_PRESETS[1]; // 1.0x

/**
 * Get preset configuration by speed multiplier value
 * @param {number} speedValue
 * @returns {Object}
 */
export function getSpeedPreset(speedValue) {
  const preset = REPLAY_SPEED_PRESETS.find(p => p.value === speedValue);
  return preset || DEFAULT_SPEED;
}

/**
 * Calculate dynamic playback delay between two events based on timestamp delta or uniform pace
 * @param {Object} currentEvent
 * @param {Object} nextEvent
 * @param {number} [speedMultiplier=1.0]
 * @param {boolean} [useTimestampProportions=false]
 * @returns {number} Delay in milliseconds
 */
export function calculatePlaybackDelay(
  currentEvent,
  nextEvent,
  speedMultiplier = 1.0,
  useTimestampProportions = false
) {
  const speed = speedMultiplier > 0 ? speedMultiplier : 1.0;
  const baseDelay = 1200 / speed;

  if (!useTimestampProportions || !currentEvent?.timestamp || !nextEvent?.timestamp) {
    return Math.max(50, Math.round(baseDelay));
  }

  const t1 = new Date(currentEvent.timestamp).getTime();
  const t2 = new Date(nextEvent.timestamp).getTime();
  const realDeltaMs = Math.max(0, t2 - t1);

  // Scale real time down logarithmically/proportionally into a pleasant 200ms - 3000ms range
  const scaledDelay = (Math.log10(realDeltaMs + 1) * 300) / speed;
  return Math.min(3000, Math.max(100, Math.round(scaledDelay)));
}
