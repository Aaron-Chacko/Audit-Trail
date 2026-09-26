import { useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import LiveSimulationModal from '../simulation/LiveSimulationModal.jsx';
import AiAssistantDrawer from '../ai/AiAssistantDrawer.jsx';
import styles from './PageWrapper.module.css';

/**
  * components/layout/PageWrapper.jsx
  * Shared layout shell used by every page with integrated Live Simulator & AI Copilot.
  */
export default function PageWrapper({ children }) {
  const [searchParams] = useSearchParams();
  const activeId = searchParams.get('id') || 'SHIP-10042';
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const handleEventSimulated = () => {
    // Dispatch a global custom event or trigger page sync
    window.dispatchEvent(new CustomEvent('audit_trail_event_simulated', { detail: { aggregateId: activeId } }));
  };

  return (
    <>
      <header>
        <nav className={styles.navbar}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandIcon}>◈</span>
            <span>Audit Trail</span>
          </NavLink>

          <div className={styles.navRight}>
            <button
              type="button"
              className={styles.simBtn}
              onClick={() => setIsSimModalOpen(true)}
              title="Open Live Scenario Simulator"
            >
              <span className={styles.simDot} />
              <span>⚡ Live Simulator</span>
            </button>

            <div className={styles.nav}>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/timeline"
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Timeline
              </NavLink>
            </div>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      {/* Live Scenario Simulator Modal */}
      <LiveSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        activeShipmentId={activeId}
        onEventSimulated={handleEventSimulated}
      />

      {/* AI Audit & Logistics Copilot */}
      <AiAssistantDrawer activeShipmentId={activeId} />
    </>
  );
}
