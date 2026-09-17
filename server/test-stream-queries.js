import Event from './src/models/Event.js';
import {
  getEventStreamSlice,
  getEventsInTimeRange,
  getEventsByTypes,
  getGlobalStream,
} from './src/services/queries/event-store-service.js';

console.log('Testing Event Stream Query & Replay Helpers:');

console.log('1. Event.getEventStreamSlice is function:', typeof Event.getEventStreamSlice === 'function' ? 'PASS' : 'FAIL');
console.log('2. Event.getEventsInTimeRange is function:', typeof Event.getEventsInTimeRange === 'function' ? 'PASS' : 'FAIL');
console.log('3. Event.getEventsByTypes is function:', typeof Event.getEventsByTypes === 'function' ? 'PASS' : 'FAIL');
console.log('4. Event.getGlobalStream is function:', typeof Event.getGlobalStream === 'function' ? 'PASS' : 'FAIL');

console.log('5. Query service getEventStreamSlice is function:', typeof getEventStreamSlice === 'function' ? 'PASS' : 'FAIL');
console.log('6. Query service getEventsInTimeRange is function:', typeof getEventsInTimeRange === 'function' ? 'PASS' : 'FAIL');
console.log('7. Query service getEventsByTypes is function:', typeof getEventsByTypes === 'function' ? 'PASS' : 'FAIL');
console.log('8. Query service getGlobalStream is function:', typeof getGlobalStream === 'function' ? 'PASS' : 'FAIL');

process.exit(0);
