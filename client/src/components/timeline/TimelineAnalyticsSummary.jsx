import { useMemo } from 'react';
import { isAlertEvent, getEventCategory, EVENT_CATEGORIES } from '@/utils/event-theme.js';
import styles from './TimelineAnalyticsSummary.module.css';

/**
 * TimelineAnalyticsSummary
 * Visual analytics metrics bar summarizing event stream composition, duration,
 * and anomaly alerts for the active shipment.
 *
 * @param {object} props
 * @param {Array} props.events - Complete raw events array
 * @param {Array} props.filteredEvents - Events matching active filters
 * @param {Function} [props.onJumpToGenesis] - Callback to scroll to genesis node
 * @param {Function} [props.onJumpToHead] - Callback to scroll to head node
 */
export default function TimelineAnalyticsSummary({
  events = [],
  filteredEvents = [],
  onJumpToGenesis,
  onJumpToHead,
}) {
  const stats = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        total: 0,
        alerts: 0,
        categories: {},
        durationText: '0m',
        distinctTypes: 0,
      };
    }

    let alertCount = 0;
    const catCounts = {
      [EVENT_CATEGORIES.LIFECYCLE]: 0,
      [EVENT_CATEGORIES.CONTAINER]: 0,
      [EVENT_CATEGORIES.SENSOR]: 0,
      [EVENT_CATEGORIES.PORT]: 0,
      [EVENT_CATEGORIES.CUSTOMS]: 0,
      [EVENT_CATEGORIES.ALERT]: 0,
    };
    const distinctSet = new Set();

    events.forEach((evt) => {
      distinctSet.add(evt.eventType);
      if (isAlertEvent(evt.eventType)) {
        alertCount++;
      }
      const cat = getEventCategory(evt.eventType);
      if (catCounts[cat] !== undefined) {
        catCounts[cat]++;
      }
    });

    // Duration between genesis and latest event
    let durationText = '—';
    if (events.length > 1) {
      const timestamps = events
        .map((e) => new Date(e.timestamp).getTime())
        .filter((t) => !isNaN(t));

      if (timestamps.length > 1) {
        const minT = Math.min(...timestamps);
        const maxT = Math.max(...timestamps);
        const diffHours = (maxT - minT) / (1000 * 60 * 60);

        if (diffHours < 1) {
          const diffMins = Math.round((maxT - minT) / (1000 * 60));
          durationText = `${diffMins} min`;
        } else if (diffHours < 48) {
          durationText = `${diffHours.toFixed(1)} hrs`;
        } else {
          const diffDays = Math.round(diffHours / 24);
          durationText = `${diffDays} days`;
        }
      }
    }

    return {
      total: events.length,
      alerts: alertCount,
      categories: catCounts,
      durationText,
      distinctTypes: distinctSet.size,
    };
  }, [events]);

  if (!events || events.length === 0) return null;

  const isFiltered = filteredEvents.length !== events.length;

  return (
    <div className={styles.container}>
      {/* Metric 1: Total Stream Events */}
      <div className={styles.metricCard}>
        <div className={styles.metricIcon}>📜</div>
        <div className={styles.metricContent}>
          <span className={styles.metricLabel}>Total Updates</span>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{stats.total}</span>
            {isFiltered && (
              <span className={styles.filteredBadge}>
                Showing {filteredEvents.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metric 2: Anomalies & Alerts */}
      <div
        className={`
          ${styles.metricCard}
          ${stats.alerts > 0 ? styles.metricAlertCard : ''}
        `}
      >
        <div className={styles.metricIcon}>{stats.alerts > 0 ? '⚠️' : '✅'}</div>
        <div className={styles.metricContent}>
          <span className={styles.metricLabel}>Alerts & Warnings</span>
          <span className={`${styles.metricValue} ${stats.alerts > 0 ? styles.alertValue : ''}`}>
            {stats.alerts} {stats.alerts === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>
      </div>

      {/* Metric 3: Stream Lifespan Duration */}
      <div className={styles.metricCard}>
        <div className={styles.metricIcon}>⏱️</div>
        <div className={styles.metricContent}>
          <span className={styles.metricLabel}>Time Elapsed</span>
          <span className={styles.metricValue}>{stats.durationText}</span>
        </div>
      </div>

      {/* Metric 4: Distinct Event Types */}
      <div className={styles.metricCard}>
        <div className={styles.metricIcon}>🏷️</div>
        <div className={styles.metricContent}>
          <span className={styles.metricLabel}>Event Types</span>
          <span className={styles.metricValue}>{stats.distinctTypes} Types</span>
        </div>
      </div>

      {/* Quick Jump Anchors */}
      <div className={styles.jumpActions}>
        {onJumpToGenesis && (
          <button
            type="button"
            className={styles.jumpBtn}
            onClick={onJumpToGenesis}
            title="Scroll to Step 1"
          >
            ⬆ Start (Step 1)
          </button>
        )}
        {onJumpToHead && (
          <button
            type="button"
            className={styles.jumpBtn}
            onClick={onJumpToHead}
            title="Scroll to Latest Step"
          >
            ⬇ Latest (Step {stats.total})
          </button>
        )}
      </div>
    </div>
  );
}
