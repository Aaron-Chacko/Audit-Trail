import assert from 'node:assert';
import { queryAuditAssistant } from './src/services/ai/audit-assistant-service.js';
import { simulateShipmentScenario } from './src/services/commands/simulation-service.js';
import { connectDB, disconnectDB } from './src/config/db.js';

async function runTests() {
  console.log('🧪 Starting AI Assistant & Simulation Tests...');

  try {
    await connectDB();

    console.log('[1] Testing Simulation Service:');
    const simEvent = await simulateShipmentScenario({
      aggregateId: 'SHIP-10042',
      scenario: 'TEMPERATURE_TICK',
      customPayload: { sensorId: 'TEST-SIM-01' },
    });

    assert.ok(simEvent, 'Simulated event should be created');
    assert.strictEqual(simEvent.aggregateId, 'SHIP-10042');
    console.log(`    - Temperature Tick appended: Version #${simEvent.version} (PASS)`);

    console.log('[2] Testing AI Assistant Domain Query:');
    const aiResponse = await queryAuditAssistant({
      aggregateId: 'SHIP-10042',
      query: 'Check Cold-Chain Compliance',
    });

    assert.ok(aiResponse, 'AI response should exist');
    assert.ok(aiResponse.answer.includes('Cold-Chain'), 'Answer should contain Cold-Chain analysis');
    console.log(`    - AI Assistant Answer Generated (Risk: ${aiResponse.riskLevel}) (PASS)`);

    console.log('\n✅ All Simulation & AI Unit Tests Passed Successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runTests();
