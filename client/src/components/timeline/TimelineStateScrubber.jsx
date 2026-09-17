import { useMemo } from 'react';
import { isAlertEvent } from '@/utils/event-theme.js';
import styles from './TimelineStateScrubber.module.css';

/**
 * TimelineStateScrubber
 * Time-travel control dock allowing interactive version scrubbing,
 * step-by-step navigation, and automated event replay simulation.
 *
 * @param {object} props
 * @param {number} props.currentVersion - Current scrubbed version (1..maxVersion)
 * @param {number} props.maxVersion - Latest available version
 * @param {Function} props.onChangeVersion - Handler when scrub position changes
 * @param {boolean} props.isPlaying - Whether automated replay simulation is active
 * @param {Function} props.onTogglePlay - Toggle play/pause simulation
 * @param {number} props.playbackSpeed - Playback speed multiplier (0.5, 1, 2, 3)
 * @param {Function} props.onChangeSpeed - Handler to change playback speed
 * @param {Array} props.events - List of events for plotting incident markers
 */
export default function TimelineStateScrubber({
  currentVersion = 1,
  maxVersion = 1,
  onChangeVersion,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  events = [],
}) {
  const canStepBack = currentVersion > 1;
  const canStepForward = currentVersion < maxVersion;

  // Map versions that had alert events
  const alertVersions = useMemo(() => {
    const set = new Set();
    events.forEach((evt) => {
      if (isAlertEvent(evt.eventType) && evt.version) {
        set.add(evt.version);
      }
    });
    return set;
  }, [events]);

  const handleSliderChange = (e) => {
    const nextVal = parseInt(e.target.value, 10);
    if (!isNaN(nextVal)) {
      onChangeVersion(nextVal);
    }
  };

  const handleStepGenesis = () => onChangeVersion(1);
  const handleStepBack = () => {
    if (canStepBack) onChangeVersion(currentVersion - 1);
  };
  const handleStepForward = () => {
    if (canStepForward) onChangeVersion(currentVersion + 1);
  };
  const handleStepHead = () => onChangeVersion(maxVersion);

  const speedOptions = [0.5, 1, 2, 3];

  return (
    <div className={styles.scrubberDock}>
      <div className={styles.dockHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}>🎛️</span>
          <h4 className={styles.title}>Event Stream State Scrubber & Time-Travel Player</h4>
        </div>

        <div className={styles.versionStatus}>
          <span className={styles.statusLabel}>Position:</span>
          <span className={styles.statusVersion}>
            Version #{currentVersion}
          </span>
          <span className={styles.statusOf}>/ v{maxVersion}</span>
          {currentVersion < maxVersion ? (
            <span className={styles.rewindBadge}>REWOUND</span>
          ) : (
            <span className={styles.liveBadge}>LIVE HEAD</span>
          )}
        </div>
      </div>

      {/* Interactive Range Slider with Version Ticks */}
      <div className={styles.sliderContainer}>
        <input
          type="range"
          min="1"
          max={Math.max(1, maxVersion)}
          value={currentVersion}
          onChange={handleSliderChange}
          className={styles.slider}
          aria-label="Timeline Version Scrubber"
        />

        {/* Visual Tick Line */}
        <div className={styles.ticksRow}>
          {Array.from({ length: maxVersion }).map((_, idx) => {
            const v = idx + 1;
            const hasAlert = alertVersions.has(v);
            const isCurrent = currentVersion === v;

            return (
              <button
                key={v}
                type="button"
                className={`
                  ${styles.tickBtn}
                  ${isCurrent ? styles.tickCurrent : ''}
                  ${hasAlert ? styles.tickAlert : ''}
                `}
                onClick={() => onChangeVersion(v)}
                title={`Jump to Version ${v}${hasAlert ? ' (⚠️ Alert Event)' : ''}`}
              >
                <span className={styles.tickDot} />
                <span className={styles.tickLabel}>v{v}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className={styles.controlsBar}>
        {/* Navigation Step Buttons */}
        <div className={styles.navButtons}>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleStepGenesis}
            disabled={!canStepBack || isPlaying}
            title="Jump to Genesis (v1)"
          >
            ⏮ Genesis
          </button>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleStepBack}
            disabled={!canStepBack || isPlaying}
            title="Step Back 1 Event"
          >
            ◀ Step Back
          </button>

          {/* Main Play / Pause Button */}
          <button
            type="button"
            className={`${styles.playBtn} ${isPlaying ? styles.pauseBtn : ''}`}
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause replay simulation' : 'Play automated event replay'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Replay Stream'}
          </button>

          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleStepForward}
            disabled={!canStepForward || isPlaying}
            title="Step Forward 1 Event"
          >
            Step Forward ▶
          </button>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleStepHead}
            disabled={!canStepForward || isPlaying}
            title="Jump to Head (Latest)"
          >
            Head ⏭
          </button>
        </div>

        {/* Speed Multiplier Pills */}
        <div className={styles.speedGroup}>
          <span className={styles.speedLabel}>Speed:</span>
          {speedOptions.map((spd) => (
            <button
              key={spd}
              type="button"
              className={`
                ${styles.speedBtn}
                ${playbackSpeed === spd ? styles.speedBtnActive : ''}
              `}
              onClick={() => onChangeSpeed(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
