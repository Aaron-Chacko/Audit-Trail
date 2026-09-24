import { NavLink } from 'react-router-dom';
import styles from './PageWrapper.module.css';

/**
  * components/layout/PageWrapper.jsx
  * Shared layout shell used by every page.
  */
export default function PageWrapper({ children }) {
  return (
    <>
      <header>
        <nav className={styles.navbar}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandIcon}>◈</span>
            <span>Audit Trail</span>
          </NavLink>

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
        </nav>
      </header>

      <main className={styles.main}>
        {children}
      </main>
    </>
  );
}
