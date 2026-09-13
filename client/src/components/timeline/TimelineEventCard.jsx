import { useState } from 'react';
import { ALERT_EVENT_TYPES } from '@/constants/event-types.js';
import { formatEventType, formatTemperature, formatHumidity } from '@/utils/formatters.js';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import styles from './TimelineEventCard.module.css';

/**
 * TimelineEventCard
 * Renders an individual event node in the chronological stream.
 *
 * @param {object} props
 * @param {object} props.event - The event object from Event Store
 * @param {boolean} [props.isFirst] - Whether this is the genesis event (v1)
 * @param {boolean} [props.isLast] - Whether this is the latest event in the stream
 * @param {boolean} [props.isSelected] - Whether this event is currently focused
 * @param {Function} [props.onInspect] - Callback when user clicks Inspect
 */
export default function TimelineEventCard({
  event,
  isFirst = false,
  isLast = false,
  isSelected = false,
  onInspect,
}) {
  const [isPayloadExpanded, setIsPayloadExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const isAlert = ALERT_EVENT_TYPES.includes(event.eventType);
  const eventLabel = formatEventType(event.eventType);
  const relativeTime = formatRelativeTime(event.timestamp);
  const absoluteTime = formatEventTimestamp(event.timestamp);

  const handleCopyPayload = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to extract key summary highlights for quick badge rendering
  const renderSummaryBadges = () => {
    const payload = event.payload || {};
    const badges = [];

    if (payload.location?.port || payload.port) {
      badges.push({
        key: 'port',
        label: `📍 ${payload.location?.port || payload.port}${payload.location?.country ? `, ${payload.location.country}` : ''}`,
      });
    }

    if (payload.temperature != null) {
      badges.push({
        key: 'temp',
        label: `🌡️ ${formatTemperature(payload.temperature)}`,
        isAlert: isAlert || payload.temperature > (payload.threshold ?? 8),
      });
    }

    if (payload.humidity != null) {
      badges.push({
        key: 'humidity',
        label: `💧 ${formatHumidity(payload.humidity)}`,
      });
    }

    if (payload.vessel?.name || payload.vesselName) {
      badges.push({
        key: 'vessel',
        label: `🚢 ${payload.vessel?.name || payload.vesselName}`,
      });
    }

    if (payload.cargo?.description || payload.cargoDescription) {
      badges.push({
        key: 'cargo',
        label: `📦 ${payload.cargo?.description || payload.cargoDescription}`,
      });
    }

    if (payload.status) {
      badges.push({
        key: 'status',
        label: `Status: ${payload.status}`,
      });
    }

    return badges;
  };

  const summaryBadges = renderSummaryBadges();

  return (
    <div
      className={`
        ${styles.container}
        ${isAlert ? styles.alertContainer : ''}
        ${isSelected ? styles.selectedContainer : ''}
      `}
      id={`event-node-v${event.version}`}
    >
      {/* Node Track Column */}
      <div className={styles.trackColumn}>
        <div
          className={`
            ${styles.nodeMarker}
            ${isAlert ? styles.alertMarker : ''}
            ${isFirst ? styles.genesisMarker : ''}
            ${isLast ? styles.latestMarker : ''}
          `}
          title={`Version ${event.version}`}
        >
          {isAlert ? '⚠️' : event.version}
        </div>
        {!isLast && <div className={`${styles.trackLine} ${isAlert ? styles.alertTrackLine : ''}`} />}
      </div>

      {/* Main Event Card Body */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <span className={styles.versionTag}>v{event.version}</span>
            <h4 className={styles.eventTitle}>{eventLabel}</h4>
            {isFirst && <span className={styles.tagGenesis}>Genesis</span>}
            {isLast && <span className={styles.tagLatest}>Latest</span>}
          </div>

          <div className={styles.timeGroup} title={absoluteTime}>
            <span className={styles.relativeTime}>{relativeTime}</span>
            <span className={styles.absoluteTime}>{absoluteTime}</span>
          </div>
        </div>

        {/* Quick Summary Badges */}
        {summaryBadges.length > 0 && (
          <div className={styles.badgeRow}>
            {summaryBadges.map((b) => (
              <span
                key={b.key}
                className={`${styles.summaryBadge} ${b.isAlert ? styles.alertSummaryBadge : ''}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Action Toolbar */}
        <div className={styles.cardFooter}>
          <button
            type="button"
            className={styles.togglePayloadBtn}
            onClick={() => setIsPayloadExpanded(!isPayloadExpanded)}
            aria-expanded={isPayloadExpanded}
          >
            <span className={styles.chevron}>{isPayloadExpanded ? '▾' : '▸'}</span>
            {isPayloadExpanded ? 'Hide Payload' : 'View Payload Preview'}
          </button>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyPayload}
              title="Copy event payload JSON"
            >
              {copied ? '✓ Copied' : 'Copy JSON'}
            </button>

            {onInspect && (
              <button
                type="button"
                className={styles.inspectBtn}
                onClick={() => onInspect(event)}
              >
                Inspect
              </button>
            )}
          </div>
        </div>

        {/* Expandable JSON Payload Preview */}
        {isPayloadExpanded && (
          <div className={styles.payloadDrawer}>
            <pre className={styles.codeBlock}>
              <code>{JSON.stringify(event.payload ?? {}, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
