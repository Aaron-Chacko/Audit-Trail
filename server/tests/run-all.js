import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');

const testSuites = [
  'test-event-store.js',
  'test-event-store-validation.js',
  'test-concurrency-engine.js',
  'test-store-integrity.js',
  'test-stream-queries.js',
  'test-metadata-pipeline.js',
  'test-snapshot-pipeline.js',
  'test-event-store-metrics.js',
  'test-event-upcaster.js',
  'test-hash-chain-verification.js',
  'test-stream-archiver.js',
  'test-stream-compaction.js',
  'test-payload-encryption.js',
  'test-event-subscription-bus.js',
  'test-command-barrel.js',
];

console.log('====================================================');
console.log('       EVENT STORE COMPREHENSIVE TEST SUITE         ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;
const results = [];

for (const file of testSuites) {
  const filePath = path.join(serverDir, file);
  try {
    execSync(`node "${filePath}"`, {
      cwd: serverDir,
      stdio: 'pipe',
      timeout: 10000,
    });
    console.log(`  ✓ ${file.padEnd(35)} PASS`);
    passed += 1;
    results.push({ file, status: 'PASS' });
  } catch (err) {
    console.log(`  ✗ ${file.padEnd(35)} FAIL`);
    failed += 1;
    results.push({ file, status: 'FAIL', error: err.message });
  }
}

console.log('\n====================================================');
console.log(`  TOTAL: ${testSuites.length} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
