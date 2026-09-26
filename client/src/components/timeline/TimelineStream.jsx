import { useMemo, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import TimelineEventCard from './TimelineEventCard.jsx';
import TimelineSkeleton from './TimelineSkeleton.jsx';
import TimelineEmptyState from './TimelineEmptyState.jsx';
import ErrorMessage from '@/components/common/ErrorMessage.jsx';
import styles from './TimelineStream.module.css';

/**
 * TimelineStream
 * Renders the chronological event ledger stream with state indicators,
 * connecting tracks, sorting, and filter status with anime.js cascade entrances.
 */
export default function TimelineStream({
  events = [],
  filteredEvents = null,
  isLoading = false,
  error = null,
  sortOrder = 'asc',
  viewDensity = 'detailed',
  selectedVersion = null,
  onSelectVersion,
  onInspect,
  onRetry,
  onResetFilters,
}) {
  const streamRef = useRef(null);
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

  // Anime.js cascade entrance animation on events / filter change
  useEffect(() => {
    if (streamRef.current && sortedEvents.length > 0) {
      const cards = streamRef.current.querySelectorAll('[id^="event-node-v"]');
      if (cards.length > 0) {
        anime({
          targets: cards,
          opacity: [0, 1],
          translateX: [-18, 0],
          delay: anime.stagger(35, { start: 50 }),
          duration: 450,
          easing: 'easeOutQuad',
        });
      }
    }
  }, [sortedEvents, viewDensity]);

  // Highlight animation on selected version change
  useEffect(() => {
    if (selectedVersion != null && streamRef.current) {
      const activeCard = streamRef.current.querySelector(`#event-node-v${selectedVersion}`);
      if (activeCard) {
        anime({
          targets: activeCard,
          scale: [0.98, 1],
          duration: 350,
          easing: 'easeOutElastic(1, .6)',
        });
      }
    }
  }, [selectedVersion]);

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
    <div
      ref={streamRef}
      className={`${styles.streamContainer} ${viewDensity === 'compact' ? styles.compactMode : ''}`}
    >
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
          const isSelected = selectedVersion != null && event.version === selectedVersion;

          return (
            <TimelineEventCard
              key={event.eventId || `${event.aggregateId}-${event.version}`}
              event={event}
              isFirst={isFirstInStream}
              isLast={isLastInRender}
              isSelected={isSelected}
              onInspect={onInspect}
              onSelect={onSelectVersion}
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
