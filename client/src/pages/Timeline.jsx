import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShipment } from '@/hooks/useShipment.js';
import { useEventHistory } from '@/hooks/useEventHistory.js';
import {
  TimelineHeader,
  TimelineAnalyticsSummary,
  TimelineFilterToolbar,
  TimelineStateScrubber,
  ReconstructedStateCard,
  SensorTimelineCorrelationChart,
  TimelineStream,
  EventInspectorModal,
  TimelineShortcutsModal,
} from '@/components/timeline/index.js';
import { getEventCategory, isAlertEvent } from '@/utils/event-theme.js';
import { formatEventType } from '@/utils/formatters.js';
import { reconstructStateAtVersion } from '@/utils/shipment-state-reconstructor.js';
import { exportTimelineCsv, exportTimelineJson } from '@/utils/timeline-export.js';
import styles from './Timeline.module.css';

/**
 * pages/Timeline.jsx
 *
 * Chronological Event Timeline & Historical Scrubber Page (Complete 5-Phase Suite).
 * Features:
 *  - Full Event Stream visualization (Phase 1)
 *  - Rich Category Badges & Deep Inspector Modal (Phase 2)
 *  - Real-Time Search, Category Filtering, Alerts Toggle, and Stream Analytics (Phase 3)
 *  - Interactive State Scrubber, Reconstructed State, & Time-Travel Player (Phase 4)
 *  - State Mutation Diff Visualizer & Sensor Telemetry Correlation Chart (Phase 5)
 */
export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || 'SHIP-10042';

  const [selectedId, setSelectedId] = useState(initialId);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (oldest first) | 'desc' (newest first)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectingEvent, setInspectingEvent] = useState(null);
  const [showSensorChart, setShowSensorChart] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Filter States (Phase 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [viewDensity, setViewDensity] = useState('detailed'); // 'detailed' | 'compact'

  // Time-Travel Scrubber States (Phase 4 & 5)
  const [scrubberVersion, setScrubberVersion] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  // Read Model Current State
  const { shipment, isLoading: isShipmentLoading, refetch: refetchShipment } = useShipment(selectedId);

  // Event Store Event History
  const {
    events,
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchHistory,
  } = useEventHistory(selectedId);

  // Calculate max version in stream
  const maxVersion = useMemo(() => {
    if (!events || events.length === 0) return 1;
    return Math.max(...events.map((e) => e.version ?? 1));
  }, [events]);

  // Synchronize initial scrubber position to the latest head version
  useEffect(() => {
    if (events && events.length > 0) {
      setScrubberVersion((prev) => {
        if (prev === null || prev > maxVersion) {
          return maxVersion;
        }
        return prev;
      });
    }
  }, [events, maxVersion]);

  // Point-in-time state reconstruction for current scrubber version & previous version
  const activeVersion = scrubberVersion !== null ? scrubberVersion : maxVersion;

  const reconstructedState = useMemo(() => {
    if (!events || events.length === 0) return shipment;
    return reconstructStateAtVersion(events, activeVersion);
  }, [events, activeVersion, shipment]);

  const prevState = useMemo(() => {
    if (!events || events.length === 0 || activeVersion <= 1) return null;
    return reconstructStateAtVersion(events, activeVersion - 1);
  }, [events, activeVersion]);

  // Automated Replay Player Simulation Engine
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(300, Math.round(1500 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setScrubberVersion((current) => {
          const next = (current || 1) + 1;
          if (next >= maxVersion) {
            setIsPlaying(false);
            return maxVersion;
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, maxVersion]);

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        setScrubberVersion((v) => Math.max(1, (v || 1) - 1));
        setIsPlaying(false);
      } else if (e.key === 'ArrowRight') {
        setScrubberVersion((v) => Math.min(maxVersion, (v || 1) + 1));
        setIsPlaying(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === '?') {
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxVersion, activeVersion]);

  const handleSelectShipment = (id) => {
    setSelectedId(id);
    setSearchParams({ id });
    handleResetFilters();
    setScrubberVersion(null);
    setIsPlaying(false);
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

  // Auto-refresh when an event is simulated via the Simulation Hub
  useEffect(() => {
    const handleSimulated = (e) => {
      if (e.detail?.aggregateId === selectedId) {
        Promise.allSettled([refetchShipment(), refetchHistory()]);
      }
    };
    window.addEventListener('audit_trail_event_simulated', handleSimulated);
    return () => window.removeEventListener('audit_trail_event_simulated', handleSimulated);
  }, [selectedId, refetchShipment, refetchHistory]);

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

  const handleTogglePlay = () => {
    if (activeVersion >= maxVersion) {
      setScrubberVersion(1);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleResetToHead = () => {
    setScrubberVersion(maxVersion);
    setIsPlaying(false);
  };

  const handleJumpToGenesis = () => {
    const genesisNode = document.getElementById('event-node-v1');
    if (genesisNode) {
      genesisNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleJumpToHead = () => {
    if (!events || events.length === 0) return;
    const headNode = document.getElementById(`event-node-v${maxVersion}`);
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

  const [inspectorTab, setInspectorTab] = useState('state'); // 'state' | 'chart' | 'stats'

  const isLoading = isShipmentLoading || isEventsLoading;

  return (
    <div className={styles.pageContainer}>
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
        onExportCsv={() => exportTimelineCsv(selectedId, events)}
      />

      {/* State Scrubber & Time-Travel Player Dock */}
      {events && events.length > 0 && (
        <TimelineStateScrubber
          currentVersion={activeVersion}
          maxVersion={maxVersion}
          onChangeVersion={(v) => {
            setScrubberVersion(v);
            setIsPlaying(false);
          }}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          events={events}
        />
      )}

      {/* Master 2-Column Split Workspace */}
      <div className={styles.workspaceGrid}>
        {/* Left Column: Chronological Event Stream with Filter Toolbar */}
        <div className={styles.leftColumn}>
          <div className={styles.streamCard}>
            <div className={styles.streamHeader}>
              <div className={styles.streamTitleGroup}>
                <h3 className={styles.streamTitle}>Audit Event Stream</h3>
                <span className={styles.streamBadge}>
                  {filteredEvents.length} of {events?.length ?? 0}{' '}
                  {events?.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Click any step to inspect
              </div>
            </div>

            {/* Filter & Search Toolbar */}
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

            {/* Event List Stream */}
            <TimelineStream
              events={events}
              filteredEvents={filteredEvents}
              isLoading={isEventsLoading}
              error={eventsError}
              sortOrder={sortOrder}
              viewDensity={viewDensity}
              selectedVersion={activeVersion}
              onSelectVersion={(v) => {
                setScrubberVersion(v);
                setIsPlaying(false);
              }}
              onInspect={handleInspectEvent}
              onRetry={handleRefresh}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>

        {/* Right Column: Sticky Point-in-time Inspector & Visual Analytics */}
        <div className={styles.rightColumn}>
          {/* Inspector Tab Switcher */}
          <div className={styles.tabToggleRow}>
            <button
              type="button"
              className={`${styles.toggleTabBtn} ${inspectorTab === 'state' ? styles.toggleTabActive : ''}`}
              onClick={() => setInspectorTab('state')}
            >
              🔍 State & Diff (v{activeVersion})
            </button>
            <button
              type="button"
              className={`${styles.toggleTabBtn} ${inspectorTab === 'chart' ? styles.toggleTabActive : ''}`}
              onClick={() => setInspectorTab('chart')}
            >
              📈 Sensor Chart
            </button>
            <button
              type="button"
              className={`${styles.toggleTabBtn} ${inspectorTab === 'stats' ? styles.toggleTabActive : ''}`}
              onClick={() => setInspectorTab('stats')}
            >
              📊 Stream Stats
            </button>
          </div>

          {/* Tab 1: Point-in-time Reconstructed State Snapshot & Mutation Diff */}
          {inspectorTab === 'state' && reconstructedState && (
            <ReconstructedStateCard
              state={reconstructedState}
              prevState={prevState}
              maxVersion={maxVersion}
              isHead={activeVersion === maxVersion}
              onResetToHead={handleResetToHead}
            />
          )}

          {/* Tab 2: Sensor Telemetry & Anomaly Correlation Chart */}
          {inspectorTab === 'chart' && events && events.length > 0 && (
            <SensorTimelineCorrelationChart
              events={events}
              currentVersion={activeVersion}
              onSelectVersion={(v) => {
                setScrubberVersion(v);
                setIsPlaying(false);
              }}
            />
          )}

          {/* Tab 3: Stream Analytics Summary */}
          {inspectorTab === 'stats' && (
            <TimelineAnalyticsSummary
              events={events}
              filteredEvents={filteredEvents}
              onJumpToGenesis={handleJumpToGenesis}
              onJumpToHead={handleJumpToHead}
            />
          )}
        </div>
      </div>

      {/* Deep-Dive Event Inspector Modal */}
      {inspectingEvent && (
        <EventInspectorModal
          event={inspectingEvent}
          onClose={handleCloseModal}
        />
      )}

      {/* Keyboard Shortcuts Reference Modal */}
      <TimelineShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
