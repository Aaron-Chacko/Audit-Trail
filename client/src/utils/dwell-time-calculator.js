/**
 * Shipment Velocity & Dwell-Time Calculator
 * Analyzes event stream timestamps to compute stage durations,
 * transit velocity, port/warehouse dwell times, and bottleneck alerts.
 */

/**
 * Format milliseconds into human-readable duration (e.g. "2d 4h 15m")
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

/**
 * Calculate stage dwell times and transition durations from chronological events
 * @param {Array<Object>} events
 * @returns {Object}
 */
export function calculateDwellTimes(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      totalDurationMs: 0,
      totalDurationFormatted: '0m',
      stageDurations: [],
      averageStageDurationMs: 0,
      longestStage: null
    };
  }

  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const stageDurations = [];
  let totalDurationMs = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const startTime = new Date(current.timestamp).getTime();
    const endTime = new Date(next.timestamp).getTime();
    const durationMs = Math.max(0, endTime - startTime);
    totalDurationMs += durationMs;

    stageDurations.push({
      fromEvent: current.eventType,
      toEvent: next.eventType,
      fromVersion: current.version,
      toVersion: next.version,
      startTime: current.timestamp,
      endTime: next.timestamp,
      durationMs,
      durationFormatted: formatDuration(durationMs),
      location: current.payload?.location || current.payload?.destination || 'N/A'
    });
  }

  let longestStage = null;
  if (stageDurations.length > 0) {
    longestStage = stageDurations.reduce((prev, curr) => 
      curr.durationMs > prev.durationMs ? curr : prev, stageDurations[0]
    );
  }

  const averageStageDurationMs = stageDurations.length > 0 
    ? Math.round(totalDurationMs / stageDurations.length) 
    : 0;

  return {
    totalDurationMs,
    totalDurationFormatted: formatDuration(totalDurationMs),
    stageDurations,
    averageStageDurationMs,
    averageStageDurationFormatted: formatDuration(averageStageDurationMs),
    longestStage
  };
}

/**
 * Identify bottlenecks exceeding threshold duration
 * @param {Array<Object>} stageDurations
 * @param {number} thresholdMs - e.g. 24 hours in ms (86400000)
 * @returns {Array<Object>}
 */
export function detectDwellBottlenecks(stageDurations, thresholdMs = 86400000) {
  if (!Array.isArray(stageDurations)) return [];
  return stageDurations.filter(stage => stage.durationMs > thresholdMs);
}
