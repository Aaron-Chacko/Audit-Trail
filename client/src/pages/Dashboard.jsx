/**
 * pages/Dashboard.jsx
 *
 * Route-level page stub for the main Logistics & Shipment Dashboard.
 *
 * Responsibilities (to be built):
 *  - Shipment search / selection
 *  - Current shipment state overview (status, location, vessel, cargo)
 *  - Live sensor metrics & indicators
 *  - Command dispatch triggers (create shipment, record temperature, move)
 */

import Card from '@/components/common/Card.jsx';

export default function Dashboard() {
  return (
    <div>
      <Card title="Shipment Dashboard">
        <p style={{ color: 'var(--color-text-muted)' }}>
          Dashboard view stub. Feature logic and components (search, live metrics, status overview) to be implemented here.
        </p>
      </Card>
    </div>
  );
}
