/**
 * Event Density Heatmap & Activity Transformer
 * Aggregates event stream timestamps into time-slice buckets for activity heatmaps,
 * peak velocity detection, and event burst analysis.
 */

/**
 * Group events into time buckets (hourly or daily)
 * @param {Array<Object>} events
 * @param {'hour'|'day'} [interval='hour']
 * @returns {Array<Object>} Array of bucket objects { bucketKey, timestamp, count, eventTypes }
 */
export function buildEventDensityBuckets(events, interval = 'hour') {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const buckets = {};

  for (const event of events) {
    const date = new Date(event.timestamp || Date.now());
    let key;

    if (interval === 'day') {
      key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    } else {
      key = date.toISOString().slice(0, 13) + ':00'; // YYYY-MM-DDTHH:00
    }

    if (!buckets[key]) {
      buckets[key] = {
        bucketKey: key,
        timestamp: key,
        count: 0,
        eventTypes: {},
        hasAlert: false
      };
    }

    buckets[key].count += 1;
    const type = event.eventType || 'UNKNOWN';
    buckets[key].eventTypes[type] = (buckets[key].eventTypes[type] || 0) + 1;

    if (
      type.includes('TEMPERATURE_ALERT') ||
      type.includes('TAMPER') ||
      type.includes('FAIL')
    ) {
      buckets[key].hasAlert = true;
    }
  }

  return Object.values(buckets).sort((a, b) => a.bucketKey.localeCompare(b.bucketKey));
}

/**
 * Detect burst activity windows where event rate exceeds threshold
 * @param {Array<Object>} buckets
 * @param {number} [thresholdCount=3]
 * @returns {Array<Object>}
 */
export function detectBurstWindows(buckets, thresholdCount = 3) {
  if (!Array.isArray(buckets)) return [];
  return buckets.filter(b => b.count >= thresholdCount);
}

/**
 * Calculate peak and average activity metrics
 * @param {Array<Object>} buckets
 * @returns {Object}
 */
export function getDensityMetrics(buckets) {
  if (!Array.isArray(buckets) || buckets.length === 0) {
    return { peakBucket: null, peakCount: 0, averagePerBucket: 0, totalBuckets: 0 };
  }

  let peakBucket = buckets[0];
  let totalEvents = 0;

  for (const bucket of buckets) {
    totalEvents += bucket.count;
    if (bucket.count > peakBucket.count) {
      peakBucket = bucket;
    }
  }

  return {
    peakBucket,
    peakCount: peakBucket.count,
    averagePerBucket: Number((totalEvents / buckets.length).toFixed(2)),
    totalBuckets: buckets.length
  };
}
