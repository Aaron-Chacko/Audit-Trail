import { useMemo } from 'react';
import TimelineEventCard from './TimelineEventCard.jsx';
import TimelineSkeleton from './TimelineSkeleton.jsx';
import TimelineEmptyState from './TimelineEmptyState.jsx';
import ErrorMessage from '@/components/common/ErrorMessage.jsx';
import styles from './TimelineStream.module.css';

/**
 * TimelineStream
 * Renders the chronological event ledger stream with state indicators,
 * connecting tracks, sorting, and filter status.
 *
 * @param {object} props
 * @param {Array} props.events - Raw event objects from backend Event Store
 * @param {Array} [props.filteredEvents] - Events matching active search/filter
 * @param {boolean} props.isLoading - Whether event history is loading
 * @param {Error|null} props.error - API error if any
 * @param {'asc'|'desc'} [props.sortOrder='asc'] - 'asc' (oldest first) | 'desc' (newest first)
 * @param {'detailed'|'compact'} [props.viewDensity='detailed'] - Density layout mode
 * @param {Function} [props.onInspect] - Handler when an event card inspect is clicked
 * @param {Function} [props.onRetry] - Handler for retry action on error
 * @param {Function} [props.onResetFilters] - Handler to reset active filters
 */
export default function TimelineStream({
  events = [],
  filteredEvents = null,
  isLoading = false,
  error = null,
  sortOrder = 'asc',
  viewDensity = 'detailed',
  onInspect,
  onRetry,
  onResetFilters,
}) {
  const activeEventsList = filteredEvents !== null ? filteredEvents : events;

  const sortedEvents = useMemo(() => {
    if (!activeEventsList || activeEventsList.length === 0) return [];
    const cloned = [...activeEventsList];
    return cloned.sort((a, b) => {
      const vA = a.version ?? 0;
      const vB = b.version ?? 0;
      return sortOrder === 'asc' ? vA - vB : vB - vA;
    });
  }, [activeEventsList, sortOrder]);

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

  // Case 1: Entire stream is empty
  if (!events || events.length === 0) {
    return (
      <TimelineEmptyState
        title="No Events Found"
        description="No state transitions have been appended to this shipment's event stream yet."
      />
    );
  }

  // Case 2: Filter resulted in 0 matches
  if (sortedEvents.length === 0 && events.length > 0) {
    return (
      <TimelineEmptyState
        title="No Matching Events"
        description="No events match your active search query or category filters."
        actionLabel="Reset Filters"
        onAction={onResetFilters}
      />
    );
  }

  const genesisVersion = Math.min(...events.map((e) => e.version ?? 1));
  const latestVersion = Math.max(...events.map((e) => e.version ?? 1));

  return (
    <div className={`${styles.streamContainer} ${viewDensity === 'compact' ? styles.compactMode : ''}`}>
      {/* Stream Head Boundary Indicator */}
      <div className={styles.streamBoundary}>
        <div className={styles.boundaryDot} />
        <span className={styles.boundaryText}>
          {sortOrder === 'asc'
            ? `Genesis Origin (v${genesisVersion})`
            : `Head of Stream (Latest v${latestVersion})`}
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

      {/* Stream End Boundary Indicator */}
      <div className={styles.streamBoundary}>
        <div className={`${styles.boundaryDot} ${styles.boundaryDotEnd}`} />
        <span className={styles.boundaryText}>
          {sortOrder === 'asc'
            ? `Head of Stream (Latest v${latestVersion}) — Ledger Intact`
            : `Genesis Origin (v${genesisVersion}) — Initial Event Record`}
        </span>
      </div>
    </div>
  );
}
