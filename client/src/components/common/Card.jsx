/**
 * components/common/Card.jsx
 *
 * Surface container for grouping related content.
 * Used throughout Dashboard and Timeline for info panels, charts, etc.
 *
 * Usage:
 *   <Card title="Shipment Details" action={<Button>Refresh</Button>}>
 *     <p>Content here</p>
 *   </Card>
 *
 *   <Card>
 *     <p>No header needed</p>
 *   </Card>
 */

import styles from './Card.module.css';

/**
 * @param {{
 *   title?: string,
 *   action?: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string
 * }} props
 */
export default function Card({ title, action, children, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
