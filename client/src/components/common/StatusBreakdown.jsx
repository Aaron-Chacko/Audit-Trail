import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import Card from './Card.jsx';
import styles from './StatusBreakdown.module.css';

const STATUS_LABELS = {
  created: 'Created',
  loaded: 'Loaded',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  unloaded: 'Unloaded',
  cancelled: 'Cancelled',
};

const STATUS_VARIANTS = {
  created: 'neutral',
  loaded: 'info',
  in_transit: 'accent',
  arrived: 'success',
  unloaded: 'success',
  cancelled: 'danger',
};

// BUG-8 FIX: Recharts <Cell> is an SVG element — className has no effect on fill colour.
// The fill must be passed directly as a prop. These hex values match the CSS
// variables defined in global.css so the chart stays on-brand.
const FILL_COLORS = {
  neutral: '#94a3b8',
  info:    '#38bdf8',
  accent:  '#6366f1',
  success: '#22c55e',
  danger:  '#ef4444',
};

export default function StatusBreakdown({ shipments = [] }) {
  const statusCounts = shipments.reduce((counts, shipment) => {
    const status = shipment.status;

    if (status) {
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return counts;
  }, {});

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    name: STATUS_LABELS[status] ?? status,
    value: count,
  }));

  if (data.length === 0) {
    return (
      <Card title="Shipment Overview">
        <p className={styles.empty}>No shipment data available.</p>
      </Card>
    );
  }

  return (
    <Card title="Shipment Overview">
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={FILL_COLORS[STATUS_VARIANTS[entry.status]] ?? FILL_COLORS.neutral}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Total Shipments</span>
          <span className={styles.metricValue}>{shipments.length}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Active</span>
          <span className={styles.metricValue}>
            {shipments.filter(
              ({ status }) =>
                status === 'loaded' || status === 'in_transit'
            ).length}
          </span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Alerts</span>
          <span className={styles.metricValue}>
            {shipments.filter(
              ({ flags }) =>
                flags?.hasTemperatureSpike ||
                flags?.hasHumidityAlert ||
                flags?.customsHeld
            ).length}
          </span>
        </div>
      </div>
    </Card>
  );
}