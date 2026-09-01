/**
 * components/common/StatusBadge.jsx
 *
 * Pill badge for shipment status display.
 * Variant + label come from formatShipmentStatus() in utils/formatters.js.
 *
 * Usage:
 *   import { formatShipmentStatus } from '@/utils/formatters';
 *   const { label, variant } = formatShipmentStatus(shipment.status);
 *   <StatusBadge label={label} variant={variant} />
 *
 * Or pass a raw status string and let the component handle formatting:
 *   <StatusBadge status="in_transit" />
 */

import { formatShipmentStatus } from '@/utils/formatters.js';
import styles from './StatusBadge.module.css';

/**
 * @param {{ status?: string, label?: string, variant?: string }} props
 */
export default function StatusBadge({ status, label, variant }) {
  // Allow either raw status OR pre-resolved label+variant
  const resolved = status ? formatShipmentStatus(status) : { label, variant };

  return (
    <span className={`${styles.badge} ${styles[resolved.variant] ?? styles.neutral}`}>
      {resolved.label}
    </span>
  );
}
