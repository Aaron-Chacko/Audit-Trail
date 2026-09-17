import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { isAlertEvent } from '@/utils/event-theme.js';
import styles from './SensorTimelineCorrelationChart.module.css';

/**
 * SensorTimelineCorrelationChart
 * Plots historical temperature and humidity telemetry overlaid with event versions
 * and critical safety thresholds.
 *
 * @param {object} props
 * @param {Array} props.events - Complete raw events array
 * @param {number} [props.currentVersion] - Active scrubber version
 * @param {Function} [props.onSelectVersion] - Handler to jump to version on click
 */
export default function SensorTimelineCorrelationChart({
  events = [],
  currentVersion = null,
  onSelectVersion,
}) {
  const [chartMode, setChartMode] = useState('both'); // 'temp' | 'humidity' | 'both'

  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    let lastTemp = 4.0;
    let lastHum = 65;

    return events.map((e) => {
      const payload = e.payload || {};
      const hasTemp = payload.temperature != null;
      const hasHum = payload.humidity != null;

      if (hasTemp) lastTemp = Number(payload.temperature);
      if (hasHum) lastHum = Number(payload.humidity);

      return {
        version: e.version,
        versionLabel: `v${e.version}`,
        eventType: e.eventType,
        temperature: hasTemp ? Number(payload.temperature) : lastTemp,
        humidity: hasHum ? Number(payload.humidity) : lastHum,
        isAlert: isAlertEvent(e.eventType) || (payload.temperature != null && payload.temperature > 8),
        threshold: payload.threshold ?? 8,
      };
    });
  }, [events]);

  if (chartData.length === 0) return null;

  const handleDotClick = (entry) => {
    if (entry && entry.version && onSelectVersion) {
      onSelectVersion(entry.version);
    }
  };

  const CustomTooltip = ({ active, payload: activePayload }) => {
    if (active && activePayload && activePayload.length) {
      const data = activePayload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipVersion}>Version #{data.version}</span>
            {data.isAlert && <span className={styles.tooltipAlert}>⚠️ INCIDENT</span>}
          </div>
          <div className={styles.tooltipType}>{data.eventType}</div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipTemp}>🌡️ Temperature: {data.temperature}°C</span>
            <span className={styles.tooltipHum}>💧 Humidity: {data.humidity}%</span>
          </div>
          <div className={styles.tooltipHint}>Click point to jump scrubber</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}>📈</span>
          <h4 className={styles.title}>Sensor Telemetry & Event Timeline Correlation</h4>
        </div>

        <div className={styles.modeButtons}>
          <button
            type="button"
            className={`${styles.modeBtn} ${chartMode === 'both' ? styles.modeActive : ''}`}
            onClick={() => setChartMode('both')}
          >
            Combined
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${chartMode === 'temp' ? styles.modeActive : ''}`}
            onClick={() => setChartMode('temp')}
          >
            🌡️ Temperature
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${chartMode === 'humidity' ? styles.modeActive : ''}`}
            onClick={() => setChartMode('humidity')}
          >
            💧 Humidity
          </button>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 24, left: -10, bottom: 0 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                handleDotClick(e.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" opacity={0.6} />
            <XAxis
              dataKey="versionLabel"
              stroke="#94a3b8"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
            />

            {/* Threshold Line at 8°C */}
            {(chartMode === 'both' || chartMode === 'temp') && (
              <ReferenceLine
                y={8}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: 'Safe Threshold (8°C)',
                  fill: '#f87171',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {/* Active Scrubber Version Vertical Line */}
            {currentVersion && (
              <ReferenceLine
                x={`v${currentVersion}`}
                stroke="#818cf8"
                strokeWidth={2}
                label={{
                  value: `Scrubber (v${currentVersion})`,
                  fill: '#a5b4fc',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
            )}

            {/* Temperature Line */}
            {(chartMode === 'both' || chartMode === 'temp') && (
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isCurrent = payload.version === currentVersion;
                  const isAlert = payload.isAlert;

                  return (
                    <circle
                      key={`temp-dot-${payload.version}`}
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 6 : isAlert ? 5 : 3.5}
                      fill={isAlert ? '#ef4444' : isCurrent ? '#6366f1' : '#f97316'}
                      stroke="#fff"
                      strokeWidth={isCurrent || isAlert ? 2 : 1}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* Humidity Line */}
            {(chartMode === 'both' || chartMode === 'humidity') && (
              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isCurrent = payload.version === currentVersion;
                  return (
                    <circle
                      key={`hum-dot-${payload.version}`}
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 5 : 3}
                      fill={isCurrent ? '#818cf8' : '#38bdf8'}
                      stroke="#fff"
                      strokeWidth={1}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
