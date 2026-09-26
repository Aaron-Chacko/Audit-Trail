/**
 * Test Suite: Timeline Bookmarks Manager
 */
import assert from 'assert';
import {
  getBookmarkedEventIds,
  toggleEventBookmark,
  filterBookmarkedEvents,
  exportBookmarksJSON
} from '../client/src/utils/timeline-bookmarks.js';

console.log('====================================================');
console.log('       TIMELINE BOOKMARKS MANAGER TEST SUITE        ');
console.log('====================================================\n');

// Mock in-memory storage
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockStorage();
const shipmentId = 'SHP-BM-1001';

console.log('[1] Initial State:');
const initialBookmarks = getBookmarkedEventIds(shipmentId, mockStorage);
assert.strictEqual(initialBookmarks.size, 0);
console.log('    - Empty set returned for new shipment: PASS');

console.log('[2] Toggling Bookmarks:');
const state1 = toggleEventBookmark(shipmentId, 'evt-1', mockStorage);
assert.strictEqual(state1, true);
const state2 = toggleEventBookmark(shipmentId, 'evt-2', mockStorage);
assert.strictEqual(state2, true);

const activeSet = getBookmarkedEventIds(shipmentId, mockStorage);
assert.strictEqual(activeSet.size, 2);
assert.strictEqual(activeSet.has('evt-1'), true);
assert.strictEqual(activeSet.has('evt-2'), true);
console.log('    - Adding bookmarks persists in storage: PASS');

const state3 = toggleEventBookmark(shipmentId, 'evt-1', mockStorage);
assert.strictEqual(state3, false);
const updatedSet = getBookmarkedEventIds(shipmentId, mockStorage);
assert.strictEqual(updatedSet.size, 1);
assert.strictEqual(updatedSet.has('evt-1'), false);
console.log('    - Removing bookmark updates state: PASS');

console.log('[3] Filtering Event Stream:');
const mockEvents = [
  { _id: 'evt-1', eventType: 'SHIPMENT_CREATED', version: 1 },
  { _id: 'evt-2', eventType: 'LOCATION_UPDATED', version: 2 },
  { _id: 'evt-3', eventType: 'TEMPERATURE_RECORDED', version: 3 }
];
const filtered = filterBookmarkedEvents(mockEvents, updatedSet);
assert.strictEqual(filtered.length, 1);
assert.strictEqual(filtered[0]._id, 'evt-2');
console.log('    - Correctly filters stream to only pinned events: PASS');

console.log('[4] JSON Export:');
const exported = JSON.parse(exportBookmarksJSON(shipmentId, updatedSet));
assert.strictEqual(exported.shipmentId, shipmentId);
assert.strictEqual(exported.count, 1);
assert.deepStrictEqual(exported.bookmarks, ['evt-2']);
console.log('    - Bookmark metadata export verified: PASS');

console.log('\n====================================================');
console.log('      ALL BOOKMARK MANAGER TESTS PASSED! (4/4)      ');
console.log('====================================================\n');
