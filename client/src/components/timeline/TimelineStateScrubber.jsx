import { useMemo, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import { isAlertEvent } from '@/utils/event-theme.js';
import styles from './TimelineStateScrubber.module.css';

/**
 * TimelineStateScrubber
 * Time-travel control dock allowing interactive version scrubbing,
 * step-by-step navigation, and automated event replay simulation with anime.js micro-interactions.
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
  const dockRef = useRef(null);
  const playBtnRef = useRef(null);

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

  // Spring animation on play button toggle
  useEffect(() => {
    if (playBtnRef.current) {
      anime({
        targets: playBtnRef.current,
        scale: [0.93, 1],
        duration: 300,
        easing: 'easeOutElastic(1, .5)',
      });
    }
  }, [isPlaying]);

  // Active version indicator pulse
  useEffect(() => {
    if (dockRef.current) {
      const activeTick = dockRef.current.querySelector(`.${styles.tickCurrent}`);
      if (activeTick) {
        anime({
          targets: activeTick,
          scale: [0.85, 1],
          duration: 300,
          easing: 'easeOutElastic(1, .6)',
        });
      }
    }
  }, [currentVersion]);

  const handleSliderChange = (e) => {
    const nextVal = parseInt(e.target.value, 10);
    if (!isNaN(nextVal)) {
      onChangeVersion(nextVal);
    }
  };

  const handleStepGenesis = (e) => {
    animateClick(e);
    onChangeVersion(1);
  };
  const handleStepBack = (e) => {
    animateClick(e);
    if (canStepBack) onChangeVersion(currentVersion - 1);
  };
  const handleStepForward = (e) => {
    animateClick(e);
    if (canStepForward) onChangeVersion(currentVersion + 1);
  };
  const handleStepHead = (e) => {
    animateClick(e);
    onChangeVersion(maxVersion);
  };

  const animateClick = (e) => {
    if (e?.currentTarget) {
      anime({
        targets: e.currentTarget,
        scale: [0.9, 1],
        duration: 250,
        easing: 'easeOutElastic(1, .5)',
      });
    }
  };

  const speedOptions = [0.5, 1, 2, 3];

  return (
    <div ref={dockRef} className={styles.scrubberDock}>
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
                onClick={(e) => {
                  animateClick(e);
                  onChangeVersion(v);
                }}
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
            ref={playBtnRef}
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
              onClick={(e) => {
                animateClick(e);
                onChangeSpeed(spd);
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
