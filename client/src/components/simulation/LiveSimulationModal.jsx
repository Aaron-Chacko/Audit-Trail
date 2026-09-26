import { useState, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import styles from './LiveSimulationModal.module.css';

/**
 * LiveSimulationModal
 * Allows triggering instant scenario events and toggling real-time IoT telemetry streaming.
 */
export default function LiveSimulationModal({
  isOpen,
  onClose,
  activeShipmentId = 'SHIP-10042',
  onEventSimulated,
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState(4000);
  const [isInjecting, setIsInjecting] = useState(false);
  const [logs, setLogs] = useState([]);
  const timerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      anime({
        targets: modalRef.current,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 250,
        easing: 'easeOutQuad',
      });
    }
  }, [isOpen]);

  const addLog = (msg, isSuccess = true) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleTriggerScenario = async (scenario, label) => {
    setIsInjecting(true);
    try {
      const res = await fetch('/api/commands/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateId: activeShipmentId,
          scenario,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog(`✅ Appended: ${label} (v${data.data?.version})`, true);
        if (onEventSimulated) onEventSimulated(data.data);
      } else {
        addLog(`❌ Failed: ${data.error?.message || 'Server error'}`, false);
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, false);
    } finally {
      setIsInjecting(false);
    }
  };

  // Continuous auto-streaming simulation
  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        handleTriggerScenario('TEMPERATURE_TICK', 'Periodic IoT Telemetry Tick');
      }, streamIntervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, streamIntervalMs, activeShipmentId]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="simulation-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.pulseIcon} />
            <h3 id="simulation-title" className={styles.title}>
              Live Event Simulation Hub
            </h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Active Target Banner */}
          <div className={styles.targetCard}>
            <span style={{ color: 'var(--color-text-muted)' }}>Target Aggregate:</span>
            <span className={styles.targetId}>{activeShipmentId}</span>
          </div>

          {/* Auto-Streaming Telemetry */}
          <div>
            <div className={styles.sectionTitle}>Real-Time Telemetry Stream</div>
            <div className={styles.autoStreamBox}>
              <div className={styles.autoStreamLeft}>
                <span className={styles.autoStreamTitle}>IoT Sensor Heartbeat</span>
                <span className={styles.autoStreamSub}>
                  {isStreaming
                    ? `Streaming temperature & humidity every ${streamIntervalMs / 1000}s`
                    : 'Injects live sensor updates to the immutable event store'}
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${isStreaming ? styles.toggleBtnActive : ''}`}
                onClick={() => setIsStreaming(!isStreaming)}
              >
                {isStreaming ? '⏹ Stop Stream' : '▶ Start Stream'}
              </button>
            </div>
          </div>

          {/* Instant Scenario Triggers */}
          <div>
            <div className={styles.sectionTitle}>One-Click Scenarios & Incidents</div>
            <div className={styles.scenarioGrid}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                onClick={() => handleTriggerScenario('TEMPERATURE_SPIKE', 'Heatwave Spike (+14.8°C)')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>🔥</span>
                <span className={styles.actionLabel}>Temp Spike Alert</span>
                <span className={styles.actionSub}>Exceeds 8°C safety threshold</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                onClick={() => handleTriggerScenario('HUMIDITY_ALERT', 'Humidity Alert (92% RH)')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>💧</span>
                <span className={styles.actionLabel}>Humidity Spike</span>
                <span className={styles.actionSub}>Condensation warning</span>
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleTriggerScenario('PORT_DEPARTURE', 'Port Departure')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>🚢</span>
                <span className={styles.actionLabel}>Port Departure</span>
                <span className={styles.actionSub}>Vessel underway to sea</span>
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleTriggerScenario('PORT_ARRIVAL', 'Port Arrival')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>📍</span>
                <span className={styles.actionLabel}>Port Arrival</span>
                <span className={styles.actionSub}>Docked at container gate</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                onClick={() => handleTriggerScenario('CUSTOMS_HELD', 'Customs Inspection Hold')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>🛑</span>
                <span className={styles.actionLabel}>Customs Hold</span>
                <span className={styles.actionSub}>Phytosanitary inspection</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles.successBtn}`}
                onClick={() => handleTriggerScenario('CUSTOMS_CLEARED', 'Customs Clearance')}
                disabled={isInjecting}
              >
                <span className={styles.actionIcon}>✅</span>
                <span className={styles.actionLabel}>Customs Cleared</span>
                <span className={styles.actionSub}>Approved for release</span>
              </button>
            </div>
          </div>

          {/* Live Activity Log */}
          <div>
            <div className={styles.sectionTitle}>Simulation Activity Feed</div>
            <div className={styles.logBox}>
              {logs.length === 0 ? (
                <span style={{ color: 'var(--color-text-dim)' }}>
                  No events simulated yet. Click a scenario button above.
                </span>
              ) : (
                logs.map((log, idx) => (
                  <span
                    key={idx}
                    className={idx === 0 ? styles.logHighlight : styles.logEntry}
                  >
                    {log}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
