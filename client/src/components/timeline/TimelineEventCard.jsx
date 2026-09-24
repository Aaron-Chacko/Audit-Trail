import { useState, memo } from 'react';
import anime from '@/utils/anime.js';
import EventBadge from '@/components/common/EventBadge.jsx';
import { formatTemperature, formatHumidity, formatWeight } from '@/utils/formatters.js';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import { isAlertEvent } from '@/utils/event-theme.js';
import styles from './TimelineEventCard.module.css';

/**
 * TimelineEventCard
 * Renders an individual event node in the chronological stream with rich badges & inspection.
 */
function TimelineEventCard({
  event,
  isFirst = false,
  isLast = false,
  isSelected = false,
  onInspect,
  onSelect,
}) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!event) return null;

  const isAlert = isAlertEvent(event.eventType);
  const relativeTime = formatRelativeTime(event.timestamp);
  const absoluteTime = formatEventTimestamp(event.timestamp);

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

    if (payload.cargo?.weightKg != null) {
      badges.push({
        key: 'weight',
        label: `⚖️ ${formatWeight(payload.cargo.weightKg)}`,
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

  const handleInspectClick = (e) => {
    if (e?.currentTarget) {
      anime({
        targets: e.currentTarget,
        scale: [0.92, 1],
        duration: 250,
        easing: 'easeOutElastic(1, .5)',
      });
    }
    if (onInspect) onInspect(event);
  };

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(event.version);
  };

  return (
    <div
      className={`
        ${styles.container}
        ${isAlert ? styles.alertContainer : ''}
        ${isSelected ? styles.selectedContainer : ''}
      `}
      id={`event-node-v${event.version}`}
      onClick={() => onSelect && onSelect(event.version)}
      style={{ cursor: 'pointer' }}
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
          title={`Step ${event.version} - Click to time-travel`}
          onClick={handleNodeClick}
        >
          {isAlert ? '⚠️' : event.version}
        </div>
        {!isLast && <div className={`${styles.trackLine} ${isAlert ? styles.alertTrackLine : ''}`} />}
      </div>

      {/* Main Event Card Body */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <span className={styles.versionTag}>Step {event.version}</span>
            <EventBadge eventType={event.eventType} size="md" pulse={isAlert} />
            {isFirst && <span className={styles.tagGenesis}>Start</span>}
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
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            aria-expanded={isDetailsExpanded}
          >
            <span className={styles.chevron}>{isDetailsExpanded ? '▾' : '▸'}</span>
            {isDetailsExpanded ? 'Hide Details' : 'View Quick Details'}
          </button>

          <div className={styles.footerActions}>
            {onInspect && (
              <button
                type="button"
                className={styles.inspectBtn}
                onClick={handleInspectClick}
                title="Open detailed event inspector modal"
              >
                🔍 Inspect Details
              </button>
            )}
          </div>
        </div>

        {/* Expandable Quick Details Summary Drawer */}
        {isDetailsExpanded && (
          <div className={styles.payloadDrawer}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.82rem', padding: '0.5rem 0' }}>
              {Object.entries(event.payload || {}).map(([key, val]) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize', display: 'block', fontSize: '0.72rem' }}>{key}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>
                    {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TimelineEventCard);
