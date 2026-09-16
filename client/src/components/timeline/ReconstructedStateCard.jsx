import StatusBadge from '@/components/common/StatusBadge.jsx';
import EventBadge from '@/components/common/EventBadge.jsx';
import { formatTemperature, formatHumidity, formatWeight } from '@/utils/formatters.js';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import styles from './ReconstructedStateCard.module.css';

/**
 * ReconstructedStateCard
 * Visualizes the point-in-time state of the aggregate as reconstructed by replaying
 * immutable events up to the selected scrubber version.
 *
 * @param {object} props
 * @param {object|null} props.state - Reconstructed aggregate state
 * @param {number} props.maxVersion - Latest aggregate head version
 * @param {boolean} props.isHead - Whether currently at the latest live version
 * @param {Function} [props.onResetToHead] - Callback to return to latest version
 */
export default function ReconstructedStateCard({
  state,
  maxVersion,
  isHead = false,
  onResetToHead,
}) {
  if (!state) return null;

  const lastEvent = state.lastEvent;

  return (
    <div className={`${styles.card} ${!isHead ? styles.historicalCard : ''}`}>
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.reconstructedPill}>
            {isHead ? '● LIVE STATE (HEAD)' : '⏳ HISTORICAL STATE RECONSTRUCTION'}
          </span>
          <div className={styles.versionBadge}>
            Version #{state.version} <span className={styles.versionOf}>of {maxVersion}</span>
          </div>
          <StatusBadge status={state.status} />
        </div>

        {!isHead && onResetToHead && (
          <button
            type="button"
            className={styles.resetHeadBtn}
            onClick={onResetToHead}
            title="Jump to live aggregate head"
          >
            ⚡ Return to Live (v{maxVersion})
          </button>
        )}
      </div>

      {/* Replay Notice */}
      {!isHead && (
        <div className={styles.replayNotice}>
          <span>Reconstructed by replaying <strong>{state.eventsReplayed}</strong> historical {state.eventsReplayed === 1 ? 'event' : 'events'} up to version <strong>{state.version}</strong>.</span>
        </div>
      )}

      {/* Transition Trigger Banner */}
      {lastEvent && (
        <div className={styles.triggerBanner}>
          <span className={styles.triggerLabel}>Triggered by Event:</span>
          <EventBadge eventType={lastEvent.eventType} size="sm" />
          <span className={styles.triggerTimestamp}>
            ({formatEventTimestamp(lastEvent.timestamp)} — {formatRelativeTime(lastEvent.timestamp)})
          </span>
        </div>
      )}

      {/* State Properties Grid */}
      <div className={styles.grid}>
        {/* Route / Location */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Current Location</span>
          <span className={styles.fieldValuePrimary}>
            {state.currentLocation?.port || state.currentLocation || 'In Transit'}
            {state.currentLocation?.country ? `, ${state.currentLocation.country}` : ''}
          </span>
          <span className={styles.fieldSub}>
            Route: {state.origin?.port || 'Origin'} ➔ {state.destination?.port || 'Destination'}
          </span>
        </div>

        {/* Vessel & Logistics */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Vessel / Transport</span>
          <span className={styles.fieldValue}>
            {state.vessel?.name || 'Not assigned'}
          </span>
          {state.vessel?.imo && (
            <span className={styles.fieldSub}>IMO: {state.vessel.imo}</span>
          )}
        </div>

        {/* Cargo */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Cargo</span>
          <span className={styles.fieldValue}>
            {state.cargo?.description || 'General Cargo'}
          </span>
          {state.cargo?.weightKg != null && (
            <span className={styles.fieldSub}>{formatWeight(state.cargo.weightKg)}</span>
          )}
        </div>

        {/* Sensor State Snapshot */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Reconstructed Sensors</span>
          <div className={styles.sensorRow}>
            <span
              className={`
                ${styles.sensorItem}
                ${state.flags?.hasTemperatureSpike ? styles.sensorAlert : ''}
              `}
            >
              🌡️ {formatTemperature(state.sensorState?.temperature)}
            </span>
            <span
              className={`
                ${styles.sensorItem}
                ${state.flags?.hasHumidityAlert ? styles.sensorAlert : ''}
              `}
            >
              💧 {formatHumidity(state.sensorState?.humidity)}
            </span>
          </div>
          {state.flags?.customsHeld && (
            <span className={styles.customsAlert}>🛑 Customs Hold Active</span>
          )}
        </div>
      </div>
    </div>
  );
}
