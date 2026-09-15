import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShipment } from '@/hooks/useShipment.js';
import { useEventHistory } from '@/hooks/useEventHistory.js';
import {
  TimelineHeader,
  TimelineAnalyticsSummary,
  TimelineFilterToolbar,
  TimelineStream,
  EventInspectorModal,
} from '@/components/timeline/index.js';
import { getEventCategory, isAlertEvent } from '@/utils/event-theme.js';
import { formatEventType } from '@/utils/formatters.js';
import styles from './Timeline.module.css';

/**
 * pages/Timeline.jsx
 *
 * Chronological Event Timeline & Historical Scrubber Page.
 * Features:
 *  - Full Event Stream visualization (Phase 1)
 *  - Rich Category Badges & Inspector Modal (Phase 2)
 *  - Real-Time Search, Category Filtering, Alerts Toggle, and Stream Analytics (Phase 3)
 */
export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || 'SHIP-10042';

  const [selectedId, setSelectedId] = useState(initialId);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (oldest first) | 'desc' (newest first)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectingEvent, setInspectingEvent] = useState(null);

  // Filter States (Phase 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [viewDensity, setViewDensity] = useState('detailed'); // 'detailed' | 'compact'

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
    handleResetFilters();
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setAlertsOnly(false);
  };

  const handleToggleAlertsOnly = () => {
    setAlertsOnly((prev) => !prev);
    if (!alertsOnly) {
      setSelectedCategory('ALL');
    }
  };

  const handleToggleDensity = () => {
    setViewDensity((prev) => (prev === 'detailed' ? 'compact' : 'detailed'));
  };

  const handleJumpToGenesis = () => {
    const genesisNode = document.getElementById('event-node-v1');
    if (genesisNode) {
      genesisNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleJumpToHead = () => {
    if (!events || events.length === 0) return;
    const maxV = Math.max(...events.map((e) => e.version ?? 1));
    const headNode = document.getElementById(`event-node-v${maxV}`);
    if (headNode) {
      headNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Phase 3 Filter Engine
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    return events.filter((evt) => {
      // 1. Alerts only filter
      if (alertsOnly && !isAlertEvent(evt.eventType)) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL') {
        const cat = getEventCategory(evt.eventType);
        if (cat !== selectedCategory) {
          return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const eventLabel = formatEventType(evt.eventType).toLowerCase();
        const typeStr = evt.eventType.toLowerCase();
        const versionStr = `v${evt.version}`;
        const payloadStr = JSON.stringify(evt.payload || {}).toLowerCase();
        const metaStr = JSON.stringify(evt.metadata || {}).toLowerCase();

        const matches =
          eventLabel.includes(query) ||
          typeStr.includes(query) ||
          versionStr.includes(query) ||
          payloadStr.includes(query) ||
          metaStr.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [events, alertsOnly, selectedCategory, searchQuery]);

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

      {/* Stream Analytics Bar (Phase 3) */}
      <TimelineAnalyticsSummary
        events={events}
        filteredEvents={filteredEvents}
        onJumpToGenesis={handleJumpToGenesis}
        onJumpToHead={handleJumpToHead}
      />

      {/* Main Timeline Stream Layout */}
      <div className={styles.mainLayout}>
        <div className={styles.streamCard}>
          <div className={styles.streamHeader}>
            <div className={styles.streamTitleGroup}>
              <h3 className={styles.streamTitle}>Event Stream</h3>
              <span className={styles.streamBadge}>
                {filteredEvents.length} of {events?.length ?? 0}{' '}
                {events?.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            <div className={styles.metaNotice}>
              <div className={styles.metaDot} />
              <span>Immutable Ledger Source of Truth (Event Sourcing)</span>
            </div>
          </div>

          {/* Interactive Filter & Search Toolbar (Phase 3) */}
          {events && events.length > 0 && (
            <TimelineFilterToolbar
              events={events}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setAlertsOnly(false);
              }}
              alertsOnly={alertsOnly}
              onToggleAlertsOnly={handleToggleAlertsOnly}
              viewDensity={viewDensity}
              onToggleDensity={handleToggleDensity}
              onResetFilters={handleResetFilters}
            />
          )}

          {/* Chronological Stream Track */}
          <TimelineStream
            events={events}
            filteredEvents={filteredEvents}
            isLoading={isEventsLoading}
            error={eventsError}
            sortOrder={sortOrder}
            viewDensity={viewDensity}
            onInspect={handleInspectEvent}
            onRetry={handleRefresh}
            onResetFilters={handleResetFilters}
          />
        </div>
      </div>

      {/* Deep-Dive Event Inspector Modal */}
      {inspectingEvent && (
        <EventInspectorModal
          event={inspectingEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
