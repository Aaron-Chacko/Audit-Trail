import { useState, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import EventBadge from '@/components/common/EventBadge.jsx';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import { formatTemperature, formatHumidity, formatWeight } from '@/utils/formatters.js';
import { isAlertEvent, getEventCategory } from '@/utils/event-theme.js';
import styles from './EventInspectorModal.module.css';

/**
 * EventInspectorModal
 * Simple inspector modal for reviewing details of an individual event with smooth anime.js transitions.
 */
export default function EventInspectorModal({ event, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit'
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  // Smooth entrance animation
  useEffect(() => {
    if (backdropRef.current && modalRef.current) {
      anime({
        targets: backdropRef.current,
        opacity: [0, 1],
        duration: 250,
        easing: 'easeOutQuad',
      });
      anime({
        targets: modalRef.current,
        scale: [0.92, 1],
        opacity: [0, 1],
        duration: 350,
        easing: 'easeOutExpo',
      });
    }
  }, [event]);

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

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.versionChip}>Step {event.version}</span>
            <EventBadge eventType={event.eventType} size="lg" />
            <span className={styles.aggregateTag}>{event.aggregateId}</span>
          </div>

          <div className={styles.headerActions}>
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
            📋 Event Details
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            🔒 Audit & System Info
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

          {/* ─── TAB 2: AUDIT INFO ───────────────────────────────────────── */}
          {activeTab === 'audit' && (
            <div className={styles.metadataTab}>
              <div className={styles.sectionCard}>
                <h5 className={styles.sectionTitle}>System & Audit Info</h5>
                <div className={styles.metaList}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Shipment ID:</span>
                    <span className={styles.metaVal}>{event.aggregateId}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Event Type:</span>
                    <span className={styles.metaVal}>{event.eventType}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Triggered By:</span>
                    <span className={styles.metaVal}>{metadata.triggeredBy || 'System'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Reference ID:</span>
                    <span className={styles.metaVal}>{metadata.correlationId || 'Auto-generated'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.integrityCard}>
                <div className={styles.integrityBadge}>🛡️ Record Verified & Protected</div>
                <p className={styles.integrityText}>
                  This record is permanently saved in the database audit log. It cannot be altered or deleted.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
