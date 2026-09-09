class EventStoreMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalEventsAppended = 0;
    this.totalBatchesAppended = 0;
    this.totalBytesPersisted = 0;
    this.concurrencyConflicts = 0;
    this.retryAttempts = 0;
    this.immutabilityViolations = 0;
    this.eventTypeCounts = {};
    this.latenciesMs = [];
    this.startedAt = new Date();
  }

  recordAppend({ eventType, payloadSize = 0, latencyMs = 0 }) {
    this.totalEventsAppended += 1;
    this.totalBytesPersisted += payloadSize;

    if (eventType) {
      this.eventTypeCounts[eventType] = (this.eventTypeCounts[eventType] || 0) + 1;
    }

    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      this.latenciesMs.push(latencyMs);
      if (this.latenciesMs.length > 500) {
        this.latenciesMs.shift();
      }
    }
  }

  recordBatchAppend({ count = 0, totalSize = 0, latencyMs = 0 }) {
    this.totalBatchesAppended += 1;
    this.totalEventsAppended += count;
    this.totalBytesPersisted += totalSize;

    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      this.latenciesMs.push(latencyMs);
      if (this.latenciesMs.length > 500) {
        this.latenciesMs.shift();
      }
    }
  }

  recordConflict() {
    this.concurrencyConflicts += 1;
  }

  recordRetry() {
    this.retryAttempts += 1;
  }

  recordImmutabilityViolation() {
    this.immutabilityViolations += 1;
  }

  getSummary() {
    const avgLatency = this.latenciesMs.length > 0
      ? Number((this.latenciesMs.reduce((a, b) => a + b, 0) / this.latenciesMs.length).toFixed(2))
      : 0;

    const uptimeSeconds = Math.max(1, Math.floor((Date.now() - this.startedAt.getTime()) / 1000));
    const throughputPerSec = Number((this.totalEventsAppended / uptimeSeconds).toFixed(2));

    return {
      uptimeSeconds,
      totalEventsAppended: this.totalEventsAppended,
      totalBatchesAppended: this.totalBatchesAppended,
      totalBytesPersisted: this.totalBytesPersisted,
      throughputEventsPerSec: throughputPerSec,
      avgLatencyMs: avgLatency,
      concurrencyConflicts: this.concurrencyConflicts,
      retryAttempts: this.retryAttempts,
      immutabilityViolations: this.immutabilityViolations,
      eventTypeDistribution: { ...this.eventTypeCounts },
      lastUpdated: new Date(),
    };
  }
}

export const eventStoreMetrics = new EventStoreMetrics();

export default eventStoreMetrics;
