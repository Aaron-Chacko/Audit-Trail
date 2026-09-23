import { useState } from 'react';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import styles from './TimelineHeader.module.css';

/**
 * TimelineHeader
 * Top banner on the timeline page with shipment selector, metadata summary,
 * sort order toggle, and live refetch trigger.
 */
export default function TimelineHeader({
  selectedId,
  onSelectShipment,
  shipment,
  eventsCount = 0,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  sortOrder = 'asc',
  onToggleSort,
  onExportCsv,
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanId = searchInput.trim().toUpperCase();
    if (cleanId) {
      onSelectShipment(cleanId);
    }
  };

  const sampleShipments = ['SHIP-10042', 'SHIP-10043', 'SHIP-10044'];

  return (
    <div className={styles.container}>
      {/* Top Search & Quick Selector Row */}
      <div className={styles.topRow}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div className={styles.inputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Enter Shipment ID (e.g. SHIP-10042)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Shipment ID"
            />
          </div>
          <button
            type="submit"
            className={styles.searchBtn}
            disabled={!searchInput.trim() || isLoading}
          >
            Load Timeline
          </button>
        </form>

        {/* Quick Sample Selector Pills */}
        <div className={styles.quickPills}>
          <span className={styles.quickLabel}>Select Shipment:</span>
          {sampleShipments.map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.pillBtn} ${selectedId === id ? styles.pillActive : ''}`}
              onClick={() => onSelectShipment(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Card */}
      {selectedId && (
        <div className={styles.overviewCard}>
          <div className={styles.primaryInfo}>
            <div className={styles.idGroup}>
              <span className={styles.entityType}>SHIPMENT</span>
              <h2 className={styles.aggregateTitle}>{selectedId}</h2>
              {shipment?.status && <StatusBadge status={shipment.status} />}
            </div>

            {shipment && (
              <div className={styles.routeGroup}>
                <span className={styles.routePort}>
                  {shipment.origin?.port || 'Origin Port'}
                </span>
                <span className={styles.routeArrow}>➔</span>
                <span className={styles.routePort}>
                  {shipment.destination?.port || 'Destination Port'}
                </span>
              </div>
            )}
          </div>

          <div className={styles.controlsGroup}>
            {/* Stream Stats */}
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Total Updates</span>
              <span className={styles.statValue}>{eventsCount}</span>
            </div>

            {shipment?.version != null && (
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Current Step</span>
                <span className={styles.statValue}>v{shipment.version}</span>
              </div>
            )}

            {/* Sort Order Toggle */}
            <button
              type="button"
              className={styles.sortToggleBtn}
              onClick={onToggleSort}
              title={sortOrder === 'asc' ? 'Showing Oldest First' : 'Showing Newest First'}
            >
              <span className={styles.sortIcon}>⇅</span>
              <span>{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
            </button>

            {/* Export Actions */}
            {eventsCount > 0 && onExportCsv && (
              <button
                type="button"
                className={styles.exportBtn}
                onClick={onExportCsv}
                title="Download spreadsheet report"
              >
                📥 Export CSV
              </button>
            )}

            {/* Refresh Action */}
            {onRefresh && (
              <button
                type="button"
                className={`${styles.refreshBtn} ${isRefreshing ? styles.refreshing : ''}`}
                onClick={onRefresh}
                disabled={isLoading || isRefreshing}
                title="Refetch event stream"
              >
                <span className={styles.refreshIcon}>↻</span>
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
