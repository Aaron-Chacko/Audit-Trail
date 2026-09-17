import { ConcurrencyError } from './src/utils/app-errors.js';
import Event from './src/models/Event.js';
import {
  checkConcurrency,
  appendWithRetry,
  appendEvent,
} from './src/services/commands/event-store-service.js';

console.log('Testing Concurrency Engine and OCC Components:');

const error = new ConcurrencyError('SHIP-10042', 3, 5);
console.log('1. ConcurrencyError status:', error.status === 409 ? 'PASS' : 'FAIL');
console.log('2. ConcurrencyError name:', error.name === 'ConcurrencyError' ? 'PASS' : 'FAIL');

console.log('3. Event.findByCausationId is defined:', typeof Event.findByCausationId === 'function' ? 'PASS' : 'FAIL');
console.log('4. checkConcurrency is defined:', typeof checkConcurrency === 'function' ? 'PASS' : 'FAIL');
console.log('5. appendWithRetry is defined:', typeof appendWithRetry === 'function' ? 'PASS' : 'FAIL');
console.log('6. appendEvent is defined:', typeof appendEvent === 'function' ? 'PASS' : 'FAIL');

process.exit(0);
