/**
 * Pure validation helpers for query-side inputs.
 * No DB calls — safe to unit test in isolation.
 */

export function isValidAggregateId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

export function isValidTimestamp(timestamp) {
  if (typeof timestamp !== 'string' || timestamp.trim().length === 0) return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

export function validateHistoricalStateQuery(aggregateId, timestamp) {
  const errors = [];

  if (!isValidAggregateId(aggregateId)) {
    errors.push('aggregateId is required and must be a non-empty string');
  }

  if (!isValidTimestamp(timestamp)) {
    errors.push('timestamp is required and must be a valid ISO date string');
  }

  return { valid: errors.length === 0, errors };
}