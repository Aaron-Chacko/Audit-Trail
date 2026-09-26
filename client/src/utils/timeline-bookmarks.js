/**
 * Timeline Bookmarks & Event Pinning Manager
 * Provides client-side and session bookmarking capabilities for audit trail events.
 */

const STORAGE_KEY_PREFIX = 'audit_trail_bookmarks_';

/**
 * Get all bookmarked event IDs for a specific shipment
 * @param {string} shipmentId
 * @param {Storage} [storage=localStorage]
 * @returns {Set<string>}
 */
export function getBookmarkedEventIds(shipmentId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage || !shipmentId) return new Set();
  try {
    const raw = storage.getItem(`${STORAGE_KEY_PREFIX}${shipmentId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.warn('[BookmarkManager] Failed to load bookmarks:', err);
    return new Set();
  }
}

/**
 * Toggle bookmark status for a specific event
 * @param {string} shipmentId
 * @param {string} eventId
 * @param {Storage} [storage=localStorage]
 * @returns {boolean} New bookmark state (true = bookmarked, false = unbookmarked)
 */
export function toggleEventBookmark(shipmentId, eventId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!shipmentId || !eventId) return false;
  const current = getBookmarkedEventIds(shipmentId, storage);
  let isBookmarked = false;

  if (current.has(eventId)) {
    current.delete(eventId);
    isBookmarked = false;
  } else {
    current.add(eventId);
    isBookmarked = true;
  }

  if (storage) {
    try {
      storage.setItem(
        `${STORAGE_KEY_PREFIX}${shipmentId}`,
        JSON.stringify(Array.from(current))
      );
    } catch (err) {
      console.warn('[BookmarkManager] Failed to persist bookmarks:', err);
    }
  }

  return isBookmarked;
}

/**
 * Filter an event stream by bookmarked IDs
 * @param {Array<Object>} events
 * @param {Set<string>} bookmarkedIds
 * @returns {Array<Object>}
 */
export function filterBookmarkedEvents(events, bookmarkedIds) {
  if (!Array.isArray(events) || !bookmarkedIds || bookmarkedIds.size === 0) {
    return [];
  }
  return events.filter(e => bookmarkedIds.has(e._id || e.id || e.eventId));
}

/**
 * Export bookmarks payload as JSON string
 * @param {string} shipmentId
 * @param {Set<string>} bookmarkedIds
 * @returns {string}
 */
export function exportBookmarksJSON(shipmentId, bookmarkedIds) {
  return JSON.stringify({
    shipmentId,
    exportedAt: new Date().toISOString(),
    count: bookmarkedIds.size,
    bookmarks: Array.from(bookmarkedIds)
  }, null, 2);
}
