/**
 * Field-Level Change Tracker & Deep Property Diff Engine
 * Tracks granular field changes between any two arbitrary events or snapshots.
 */

/**
 * Compare two JSON objects and return deep field-level mutations
 * @param {Object} beforeObj
 * @param {Object} afterObj
 * @param {string} [prefix='']
 * @returns {Array<Object>} List of field changes with path, oldValue, newValue, changeType
 */
export function trackFieldChanges(beforeObj = {}, afterObj = {}, prefix = '') {
  const changes = [];
  const before = beforeObj || {};
  const after = afterObj || {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const valBefore = before[key];
    const valAfter = after[key];

    if (!(key in before)) {
      changes.push({
        field: fullPath,
        changeType: 'ADDED',
        oldValue: undefined,
        newValue: valAfter,
        isSensitive: isSensitiveField(fullPath)
      });
    } else if (!(key in after)) {
      changes.push({
        field: fullPath,
        changeType: 'REMOVED',
        oldValue: valBefore,
        newValue: undefined,
        isSensitive: isSensitiveField(fullPath)
      });
    } else if (
      typeof valBefore === 'object' && valBefore !== null &&
      typeof valAfter === 'object' && valAfter !== null &&
      !Array.isArray(valBefore) && !Array.isArray(valAfter)
    ) {
      // Recurse into nested objects
      const nestedChanges = trackFieldChanges(valBefore, valAfter, fullPath);
      changes.push(...nestedChanges);
    } else if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      changes.push({
        field: fullPath,
        changeType: 'MODIFIED',
        oldValue: valBefore,
        newValue: valAfter,
        isSensitive: isSensitiveField(fullPath)
      });
    }
  }

  return changes;
}

/**
 * Check if a field path is sensitive (e.g. security, location, temperature excursion)
 * @param {string} fieldPath
 * @returns {boolean}
 */
export function isSensitiveField(fieldPath) {
  const sensitivePatterns = [
    /status/i,
    /temperature/i,
    /tamper/i,
    /seal/i,
    /location/i,
    /destination/i,
    /assignedCarrier/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(fieldPath));
}

/**
 * Filter changes by sensitivity or change type
 * @param {Array<Object>} changes
 * @param {Object} filters
 * @returns {Array<Object>}
 */
export function filterFieldChanges(changes, { onlySensitive = false, changeType = null } = {}) {
  if (!Array.isArray(changes)) return [];
  return changes.filter(c => {
    if (onlySensitive && !c.isSensitive) return false;
    if (changeType && c.changeType !== changeType) return false;
    return true;
  });
}
