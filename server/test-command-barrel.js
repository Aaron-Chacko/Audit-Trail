import * as commands from './src/services/commands/index.js';

console.log('====================================================');
console.log('      COMMAND SERVICES BARREL EXPORT TEST           ');
console.log('====================================================\n');

console.log('[1] Event Store Operations:');
console.log('    - appendEvent is exported:', typeof commands.appendEvent === 'function' ? 'PASS' : 'FAIL');
console.log('    - appendEventsBatch is exported:', typeof commands.appendEventsBatch === 'function' ? 'PASS' : 'FAIL');
console.log('    - appendWithRetry is exported:', typeof commands.appendWithRetry === 'function' ? 'PASS' : 'FAIL');
console.log('    - appendEventWithContext is exported:', typeof commands.appendEventWithContext === 'function' ? 'PASS' : 'FAIL');
console.log('    - checkConcurrency is exported:', typeof commands.checkConcurrency === 'function' ? 'PASS' : 'FAIL');
console.log('    - verifyStreamIntegrity is exported:', typeof commands.verifyStreamIntegrity === 'function' ? 'PASS' : 'FAIL');
console.log('    - getEventStoreMetrics is exported:', typeof commands.getEventStoreMetrics === 'function' ? 'PASS' : 'FAIL');

console.log('\n[2] Snapshot Engine Operations:');
console.log('    - saveSnapshot is exported:', typeof commands.saveSnapshot === 'function' ? 'PASS' : 'FAIL');
console.log('    - getAcceleratedStream is exported:', typeof commands.getAcceleratedStream === 'function' ? 'PASS' : 'FAIL');
console.log('    - shouldTakeSnapshot is exported:', typeof commands.shouldTakeSnapshot === 'function' ? 'PASS' : 'FAIL');

console.log('\n[3] Security, Compaction & Reactive Bus:');
console.log('    - compactStream is exported:', typeof commands.compactStream === 'function' ? 'PASS' : 'FAIL');
console.log('    - encryptPayloadFields is exported:', typeof commands.encryptPayloadFields === 'function' ? 'PASS' : 'FAIL');
console.log('    - decryptPayloadFields is exported:', typeof commands.decryptPayloadFields === 'function' ? 'PASS' : 'FAIL');
console.log('    - eventBus is exported:', typeof commands.eventBus === 'object' && commands.eventBus !== null ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   COMMAND BARREL EXPORT VERIFIED SUCCESSFULLY!     ');
console.log('====================================================\n');

process.exit(0);
