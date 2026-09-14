import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShipment } from '@/hooks/useShipment.js';
import { useEventHistory } from '@/hooks/useEventHistory.js';
import { TimelineHeader, TimelineStream, EventInspectorModal } from '@/components/timeline/index.js';
import styles from './Timeline.module.css';

/**
 * pages/Timeline.jsx
 *
 * Chronological Event Timeline & Historical Scrubber Page (Phase 1 & Phase 2).
 * Displays the immutable event stream for a selected shipment with
 * rich category badges, sort controls, and deep ledger inspection modal.
 */
export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || 'SHIP-10042';

  const [selectedId, setSelectedId] = useState(initialId);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (oldest first) | 'desc' (newest first)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectingEvent, setInspectingEvent] = useState(null);

  // Read Model Current State
  const { shipment, isLoading: isShipmentLoading, refetch: refetchShipment } = useShipment(selectedId);

  // Event Store Event History
  const {
    events,
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchHistory,
  } = useEventHistory(selectedId);

  const handleSelectShipment = (id) => {
    setSelectedId(id);
    setSearchParams({ id });
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([refetchShipment(), refetchHistory()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInspectEvent = (event) => {
    setInspectingEvent(event);
  };

  const handleCloseModal = () => {
    setInspectingEvent(null);
  };

  const isLoading = isShipmentLoading || isEventsLoading;

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Chronological Event Timeline</h1>
        <p className={styles.pageSubtitle}>
          Audit Trail immutable event ledger. Inspect state transitions, event versions, and chronological lifecycle milestones.
        </p>
      </div>

      {/* Top Filter & Shipment Selector Header */}
      <TimelineHeader
        selectedId={selectedId}
        onSelectShipment={handleSelectShipment}
        shipment={shipment}
        eventsCount={events?.length ?? 0}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        sortOrder={sortOrder}
        onToggleSort={handleToggleSort}
      />

      {/* Main Timeline Stream Layout */}
      <div className={styles.mainLayout}>
        <div className={styles.streamCard}>
          <div className={styles.streamHeader}>
            <div className={styles.streamTitleGroup}>
              <h3 className={styles.streamTitle}>Event Stream</h3>
              <span className={styles.streamBadge}>
                {events?.length ?? 0} {events?.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            <div className={styles.metaNotice}>
              <div className={styles.metaDot} />
              <span>Immutable Ledger Source of Truth (Event Sourcing)</span>
            </div>
          </div>

          {/* Chronological Stream Track */}
          <TimelineStream
            events={events}
            isLoading={isEventsLoading}
            error={eventsError}
            sortOrder={sortOrder}
            onInspect={handleInspectEvent}
            onRetry={handleRefresh}
          />
        </div>
      </div>

      {/* Deep-Dive Event Inspector Modal (Phase 2) */}
      {inspectingEvent && (
        <EventInspectorModal
          event={inspectingEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
