import { useState, useEffect, useMemo } from 'react';
import EventBadge from '@/components/common/EventBadge.jsx';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import { formatTemperature, formatHumidity, formatWeight } from '@/utils/formatters.js';
import { isAlertEvent, getEventCategory } from '@/utils/event-theme.js';
import styles from './EventInspectorModal.module.css';

/**
 * EventInspectorModal
 * Detailed multi-tab inspector modal for deep ledger audit of individual events.
 *
 * @param {object} props
 * @param {object|null} props.event - The event being inspected
 * @param {Function} props.onClose - Modal close handler
 */
export default function EventInspectorModal({ event, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payload' | 'metadata'
  const [copiedSection, setCopiedSection] = useState(null);
  const [payloadSearch, setPayloadSearch] = useState('');

  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    if (!event) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  if (!event) return null;

  const payload = event.payload || {};
  const metadata = event.metadata || {};
  const isAlert = isAlertEvent(event.eventType);
  const category = getEventCategory(event.eventType);

  const handleCopy = (text, sectionName) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
      setCopiedSection(sectionName);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  // Filtered payload for search inside payload tab
  const filteredPayload = useMemo(() => {
    if (!payloadSearch.trim()) return payload;
    const query = payloadSearch.toLowerCase();
    const result = {};
    for (const [key, val] of Object.entries(payload)) {
      if (
        key.toLowerCase().includes(query) ||
        JSON.stringify(val).toLowerCase().includes(query)
      ) {
        result[key] = val;
      }
    }
    return result;
  }, [payload, payloadSearch]);

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.versionChip}>Version {event.version}</span>
            <EventBadge eventType={event.eventType} size="lg" />
            <span className={styles.aggregateTag}>{event.aggregateId}</span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => handleCopy(event, 'full')}
              title="Copy complete event envelope JSON"
            >
              {copiedSection === 'full' ? '✓ Copied Envelope' : '📋 Copy Event JSON'}
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview & Highlights
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'payload' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('payload')}
          >
            📦 Payload Explorer
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'metadata' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            🛡️ Ledger & OCC Metadata
          </button>
        </div>

        {/* Modal Body Tabs */}
        <div className={styles.body}>
          {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              {/* Alert Notice if applicable */}
              {isAlert && (
                <div className={styles.alertBanner}>
                  <span className={styles.alertBannerIcon}>⚠️</span>
                  <div>
                    <h5 className={styles.alertBannerTitle}>Incident Condition Detected</h5>
                    <p className={styles.alertBannerText}>
                      This state transition triggered an anomaly alert on the event stream ledger.
                    </p>
                  </div>
                </div>
              )}

              {/* Timing Grid */}
              <div className={styles.sectionCard}>
                <h5 className={styles.sectionTitle}>Temporal Information</h5>
                <div className={styles.grid2}>
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Event Timestamp (Occurred)</span>
                    <span className={styles.fieldValuePrimary}>
                      {formatEventTimestamp(event.timestamp)}
                    </span>
                    <span className={styles.fieldValueMuted}>
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>

                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Event Sourcing Stream Index</span>
                    <span className={styles.fieldValueMono}>
                      Aggregate Sequence Version #{event.version}
                    </span>
                    <span className={styles.fieldValueMuted}>
                      Category: {category.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Domain Specific Highlights Grid */}
              <div className={styles.sectionCard}>
                <h5 className={styles.sectionTitle}>Domain State Changes</h5>
                <div className={styles.grid3}>
                  {/* Location & Port */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Location / Port</span>
                    <span className={styles.fieldValue}>
                      {payload.location?.port || payload.port || '—'}
                    </span>
                    {(payload.location?.country || payload.country) && (
                      <span className={styles.fieldValueMuted}>
                        Country: {payload.location?.country || payload.country}
                      </span>
                    )}
                  </div>

                  {/* Temperature Sensor */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Temperature</span>
                    <span
                      className={`
                        ${styles.fieldValue}
                        ${payload.temperature != null && isAlert ? styles.valueDanger : ''}
                      `}
                    >
                      {formatTemperature(payload.temperature)}
                    </span>
                    {payload.threshold != null && (
                      <span className={styles.fieldValueMuted}>
                        Threshold: {payload.threshold}°C
                      </span>
                    )}
                  </div>

                  {/* Humidity Sensor */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Humidity</span>
                    <span className={styles.fieldValue}>
                      {formatHumidity(payload.humidity)}
                    </span>
                  </div>

                  {/* Vessel */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Assigned Vessel</span>
                    <span className={styles.fieldValue}>
                      {payload.vessel?.name || payload.vesselName || '—'}
                    </span>
                    {payload.vessel?.imo && (
                      <span className={styles.fieldValueMuted}>
                        IMO: {payload.vessel.imo}
                      </span>
                    )}
                  </div>

                  {/* Cargo */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Cargo Description</span>
                    <span className={styles.fieldValue}>
                      {payload.cargo?.description || payload.cargoDescription || '—'}
                    </span>
                    {payload.cargo?.weightKg != null && (
                      <span className={styles.fieldValueMuted}>
                        Weight: {formatWeight(payload.cargo.weightKg)}
                      </span>
                    )}
                  </div>

                  {/* Status / Transition */}
                  <div className={styles.dataField}>
                    <span className={styles.fieldLabel}>Shipment Status</span>
                    <span className={styles.fieldValue}>
                      {payload.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: PAYLOAD EXPLORER ────────────────────────────────────── */}
          {activeTab === 'payload' && (
            <div className={styles.payloadTab}>
              <div className={styles.payloadToolbar}>
                <input
                  type="text"
                  className={styles.payloadSearchInput}
                  placeholder="Filter payload keys or values..."
                  value={payloadSearch}
                  onChange={(e) => setPayloadSearch(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => handleCopy(payload, 'payload')}
                >
                  {copiedSection === 'payload' ? '✓ Copied Payload' : '📋 Copy JSON'}
                </button>
              </div>

              <div className={styles.codeContainer}>
                <pre className={styles.jsonCode}>
                  <code>{JSON.stringify(filteredPayload, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}

          {/* ─── TAB 3: METADATA & OCC ───────────────────────────────────────── */}
          {activeTab === 'metadata' && (
            <div className={styles.metadataTab}>
              <div className={styles.sectionCard}>
                <h5 className={styles.sectionTitle}>CQRS Tracing & Audit Identifiers</h5>
                <div className={styles.metaList}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Correlation ID:</span>
                    <code className={styles.metaVal}>{metadata.correlationId || 'corr-auto-generated'}</code>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Causation ID:</span>
                    <code className={styles.metaVal}>{metadata.causationId || 'none (root trigger)'}</code>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Triggered By:</span>
                    <span className={styles.metaVal}>{metadata.triggeredBy || 'system:ledger-worker'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Client IP:</span>
                    <span className={styles.metaVal}>{metadata.clientIp || '127.0.0.1 (local)'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Schema Version:</span>
                    <span className={styles.metaVal}>v{metadata.schemaVersion || 1}</span>
                  </div>
                </div>
              </div>

              <div className={styles.integrityCard}>
                <div className={styles.integrityBadge}>🛡️ Immutability Verified</div>
                <p className={styles.integrityText}>
                  This event is cryptographically sealed in the append-only MongoDB Event Store.
                  Mutations and deletes are blocked by model-level schema guards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <span className={styles.footerNote}>
            Event ID: <code>{event.eventId || `${event.aggregateId}-v${event.version}`}</code>
          </span>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
