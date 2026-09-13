import { useMemo } from 'react';
import TimelineEventCard from './TimelineEventCard.jsx';
import TimelineSkeleton from './TimelineSkeleton.jsx';
import TimelineEmptyState from './TimelineEmptyState.jsx';
import ErrorMessage from '@/components/common/ErrorMessage.jsx';
import styles from './TimelineStream.module.css';

/**
 * TimelineStream
 * Renders the chronological event ledger stream with state indicators,
 * connecting tracks, and sorting.
 *
 * @param {object} props
 * @param {Array} props.events - Raw event objects from backend Event Store
 * @param {boolean} props.isLoading - Whether event history is loading
 * @param {Error|null} props.error - API error if any
 * @param {'asc'|'desc'} [props.sortOrder='asc'] - 'asc' (oldest first) | 'desc' (newest first)
 * @param {Function} [props.onInspect] - Handler when an event card inspect is clicked
 * @param {Function} [props.onRetry] - Handler for retry action on error
 */
export default function TimelineStream({
  events = [],
  isLoading = false,
  error = null,
  sortOrder = 'asc',
  onInspect,
  onRetry,
}) {
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const cloned = [...events];
    return cloned.sort((a, b) => {
      const vA = a.version ?? 0;
      const vB = b.version ?? 0;
      return sortOrder === 'asc' ? vA - vB : vB - vA;
    });
  }, [events, sortOrder]);

  if (isLoading && (!events || events.length === 0)) {
    return <TimelineSkeleton count={4} />;
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <ErrorMessage message={error.message || 'Failed to load event timeline.'} />
        {onRetry && (
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <TimelineEmptyState
        title="No Events Found"
        description="No state transitions have been appended to this shipment's event stream yet."
      />
    );
  }

  const genesisVersion = Math.min(...events.map((e) => e.version ?? 1));
  const latestVersion = Math.max(...events.map((e) => e.version ?? 1));

  return (
    <div className={styles.streamContainer}>
      {/* Stream Head Banner */}
      <div className={styles.streamBoundary}>
        <div className={styles.boundaryDot} />
        <span className={styles.boundaryText}>
          {sortOrder === 'asc'
            ? `Genesis Origin (Version ${genesisVersion})`
            : `Head of Stream (Latest Version ${latestVersion})`}
        </span>
      </div>

      {/* Rendered Event Nodes */}
      <div className={styles.eventList}>
        {sortedEvents.map((event, index) => {
          const isFirstInStream = event.version === genesisVersion;
          const isLastInStream = event.version === latestVersion;
          const isLastInRender = index === sortedEvents.length - 1;

          return (
            <TimelineEventCard
              key={event.eventId || `${event.aggregateId}-${event.version}`}
              event={event}
              isFirst={isFirstInStream}
              isLast={isLastInRender}
              onInspect={onInspect}
            />
          );
        })}
      </div>

      {/* Stream End Banner */}
      <div className={styles.streamBoundary}>
        <div className={`${styles.boundaryDot} ${styles.boundaryDotEnd}`} />
        <span className={styles.boundaryText}>
          {sortOrder === 'asc'
            ? `Head of Stream (Latest Version ${latestVersion}) — Immutable Ledger Closed`
            : `Genesis Origin (Version ${genesisVersion}) — Stream Initiated`}
        </span>
      </div>
    </div>
  );
}
