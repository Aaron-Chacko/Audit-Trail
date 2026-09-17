import { useMemo } from 'react';
import { EVENT_CATEGORIES, getEventCategory, isAlertEvent } from '@/utils/event-theme.js';
import styles from './TimelineFilterToolbar.module.css';

/**
 * TimelineFilterToolbar
 * Interactive filter controls for filtering event streams by category, search query,
 * anomaly status, and view density.
 *
 * @param {object} props
 * @param {Array} props.events - Complete raw events array
 * @param {string} props.searchQuery - Current search query text
 * @param {Function} props.onSearchChange - Search input change handler
 * @param {string} props.selectedCategory - Active category filter ('ALL' | category key)
 * @param {Function} props.onCategoryChange - Category change handler
 * @param {boolean} props.alertsOnly - Whether filtering strictly for alerts
 * @param {Function} props.onToggleAlertsOnly - Toggle handler for alerts only
 * @param {'detailed'|'compact'} props.viewDensity - View density mode
 * @param {Function} props.onToggleDensity - Toggle handler for density mode
 * @param {Function} props.onResetFilters - Handler to clear all filters
 */
export default function TimelineFilterToolbar({
  events = [],
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'ALL',
  onCategoryChange,
  alertsOnly = false,
  onToggleAlertsOnly,
  viewDensity = 'detailed',
  onToggleDensity,
  onResetFilters,
}) {
  // Compute count of events in each category for badges
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: events.length,
      [EVENT_CATEGORIES.LIFECYCLE]: 0,
      [EVENT_CATEGORIES.CONTAINER]: 0,
      [EVENT_CATEGORIES.SENSOR]: 0,
      [EVENT_CATEGORIES.PORT]: 0,
      [EVENT_CATEGORIES.CUSTOMS]: 0,
      ALERTS: 0,
    };

    events.forEach((evt) => {
      if (isAlertEvent(evt.eventType)) {
        counts.ALERTS++;
      }
      const cat = getEventCategory(evt.eventType);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });

    return counts;
  }, [events]);

  const filterCategories = [
    { key: 'ALL', label: 'All Events', icon: '📋' },
    { key: EVENT_CATEGORIES.LIFECYCLE, label: 'Lifecycle', icon: '✨' },
    { key: EVENT_CATEGORIES.CONTAINER, label: 'Container', icon: '📦' },
    { key: EVENT_CATEGORIES.SENSOR, label: 'Sensors', icon: '📊' },
    { key: EVENT_CATEGORIES.PORT, label: 'Port', icon: '⚓' },
    { key: EVENT_CATEGORIES.CUSTOMS, label: 'Customs', icon: '🛡️' },
  ];

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'ALL' ||
    alertsOnly;

  return (
    <div className={styles.toolbar}>
      {/* Row 1: Search + Alerts Toggle + Density Toggle */}
      <div className={styles.topRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔎</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search events, ports, temperatures, vessels, cargo..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Filter events by text"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchChange('')}
              title="Clear search query"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.controlsGroup}>
          {/* Alerts Only Toggle Pill */}
          <button
            type="button"
            className={`
              ${styles.alertToggleBtn}
              ${alertsOnly ? styles.alertToggleActive : ''}
            `}
            onClick={onToggleAlertsOnly}
          >
            <span>⚠️ Alerts Only</span>
            <span className={styles.pillCount}>{categoryCounts.ALERTS}</span>
          </button>

          {/* View Density Mode Toggle */}
          <button
            type="button"
            className={styles.densityBtn}
            onClick={onToggleDensity}
            title={`Switch to ${viewDensity === 'detailed' ? 'Compact' : 'Detailed'} view`}
          >
            <span>{viewDensity === 'detailed' ? '📑 Detailed' : '📄 Compact'}</span>
          </button>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={onResetFilters}
              title="Reset all active search and category filters"
            >
              ✕ Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Category Filter Pills */}
      <div className={styles.categoryRow}>
        <span className={styles.categoryLabel}>Filter Category:</span>
        <div className={styles.categoryPills}>
          {filterCategories.map((cat) => {
            const isActive = selectedCategory === cat.key && !alertsOnly;
            const count = categoryCounts[cat.key] ?? 0;

            return (
              <button
                key={cat.key}
                type="button"
                className={`${styles.catPill} ${isActive ? styles.catPillActive : ''}`}
                onClick={() => onCategoryChange(cat.key)}
              >
                <span className={styles.pillIcon}>{cat.icon}</span>
                <span className={styles.pillLabel}>{cat.label}</span>
                <span className={styles.pillBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
