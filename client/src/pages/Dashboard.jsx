import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import anime from "@/utils/anime.js";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import Loader from "@/components/common/Loader.jsx";
import ErrorMessage from "@/components/common/ErrorMessage.jsx";
import { useShipment } from "@/hooks/useShipment.js";
import { listShipments } from "@/api/shipments.js";
import styles from "./Dashboard.module.css";

/** Convert user input like "10042" or "SHIP-10042" to canonical "SHIP-10042" */
function toAggregateId(raw) {
  const cleaned = raw.trim().toUpperCase();
  if (cleaned.startsWith("SHIP-")) return cleaned;
  return `SHIP-${cleaned}`;
}

/** Show just the numeric part for display: "SHIP-10042" → "10042" */
function toDisplayId(aggregateId) {
  if (!aggregateId) return "";
  return aggregateId.replace(/^SHIP-/, "");
}

const ROUTE_STEPS = ["Created", "Loaded", "Departed", "In Transit", "Arrived", "Unloaded"];

function getRouteProgress(status) {
  const map = {
    CREATED: 0,
    LOADED: 1,
    DEPARTED: 2,
    IN_TRANSIT: 3,
    ARRIVED: 4,
    UNLOADED: 5,
    DELIVERED: 5,
    CANCELLED: -1,
  };
  return map[status?.toUpperCase()] ?? 2;
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawInitialId = searchParams.get("id") || "";
  const initialAggId = rawInitialId ? toAggregateId(rawInitialId) : null;

  const [inputValue, setInputValue] = useState(toDisplayId(rawInitialId));
  const [shipmentId, setShipmentId] = useState(initialAggId);
  const [allShipments, setAllShipments] = useState([]);

  const { shipment, isLoading, error, refetch } = useShipment(shipmentId);
  const contentRef = useRef(null);

  // Fetch the list of all shipments for the "Available Shipments" panel
  useEffect(() => {
    listShipments()
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.data ?? res?.shipments ?? [];
        setAllShipments(arr);
      })
      .catch(() => setAllShipments([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    const aggId = toAggregateId(val);
    setShipmentId(aggId);
    setSearchParams({ id: aggId });
  };

  const handleSelect = (aggId, e) => {
    if (e?.currentTarget) {
      anime({
        targets: e.currentTarget,
        scale: [0.96, 1],
        duration: 220,
        easing: "easeOutElastic(1, .6)",
      });
    }
    setInputValue(toDisplayId(aggId));
    setShipmentId(aggId);
    setSearchParams({ id: aggId });
  };

  // Auto-refresh when Live Simulator fires an event
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.aggregateId === shipmentId) refetch();
    };
    window.addEventListener("audit_trail_event_simulated", handler);
    return () => window.removeEventListener("audit_trail_event_simulated", handler);
  }, [shipmentId, refetch]);

  // Stagger entrance
  useEffect(() => {
    if (shipment && !isLoading && contentRef.current) {
      anime({
        targets: contentRef.current.querySelectorAll("[data-animate]"),
        opacity: [0, 1],
        translateY: [12, 0],
        delay: anime.stagger(60),
        duration: 380,
        easing: "easeOutQuad",
      });
    }
  }, [shipment, isLoading]);

  const displayId = shipment ? toDisplayId(shipment.aggregateId || shipmentId) : toDisplayId(shipmentId);
  const routeProgress = shipment ? getRouteProgress(shipment.status) : -1;

  return (
    <div className={styles.dashboard}>

      {/* ── Page Header ─────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Shipment Dashboard</h1>
          <p className={styles.pageSubtitle}>Real-time tracking, sensor telemetry and compliance status.</p>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────── */}
      <div className={styles.workspace}>

        {/* Left: Sidebar — search + shipment list */}
        <aside className={styles.sidebar}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchInputWrap}>
              <svg className={styles.searchSvg} viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter ID e.g. 10042"
                aria-label="Shipment number"
              />
            </div>
            <button className={styles.searchBtn} type="submit" disabled={!inputValue.trim() || isLoading}>
              Load
            </button>
          </form>

          <div className={styles.listSection}>
            <span className={styles.listTitle}>Available Shipments</span>
            {allShipments.length === 0 ? (
              <p className={styles.listEmpty}>No shipments found.</p>
            ) : (
              <ul className={styles.shipmentList}>
                {allShipments.map((s) => {
                  const sid = s.aggregateId || s._id;
                  const isActive = sid === shipmentId;
                  return (
                    <li key={sid}>
                      <button
                        type="button"
                        className={`${styles.shipmentItem} ${isActive ? styles.shipmentItemActive : ""}`}
                        onClick={(e) => handleSelect(sid, e)}
                      >
                        <span className={styles.shipmentNum}>{toDisplayId(sid)}</span>
                        <span className={`${styles.shipmentStatusDot} ${s.flags?.hasTemperatureSpike ? styles.dotDanger : s.flags?.customsHeld ? styles.dotWarning : styles.dotOk}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right: Main panel */}
        <main className={styles.mainPanel}>
          {isLoading && <Loader />}
          {error && !isLoading && <ErrorMessage error={error} />}

          {/* Empty state */}
          {!shipmentId && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="14" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 22h40" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 6l8-2 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>No shipment selected</p>
              <p className={styles.emptySub}>Enter a shipment number or click one from the list on the left.</p>
            </div>
          )}

          {/* Shipment loaded */}
          {shipment && !isLoading && (
            <div ref={contentRef} className={styles.detail}>

              {/* ── Identity row ── */}
              <div data-animate className={styles.identityRow}>
                <div className={styles.idBlock}>
                  <span className={styles.idLabel}>Shipment ID</span>
                  <span className={styles.idValue}>{displayId}</span>
                </div>
                <div className={styles.identityRight}>
                  <StatusBadge status={shipment.status} />
                  <Link to={`/timeline?id=${shipment.aggregateId || shipmentId}`} className={styles.timelineLink}>
                    View Timeline
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* ── Route bar ── */}
              <div data-animate className={styles.routeBar}>
                <div className={styles.routeEndpoints}>
                  <div className={styles.routePort}>
                    <span className={styles.routePortLabel}>Origin</span>
                    <span className={styles.routePortName}>{shipment.origin?.port || "—"}</span>
                    <span className={styles.routePortCountry}>{shipment.origin?.country || ""}</span>
                  </div>
                  <div className={styles.routeArrow}>
                    <div className={styles.routeTrack}>
                      <div className={styles.routeTrackFill} style={{ width: `${Math.max(0, routeProgress / (ROUTE_STEPS.length - 1)) * 100}%` }} />
                      {ROUTE_STEPS.map((step, idx) => (
                        <div
                          key={step}
                          className={`${styles.routeNode} ${idx <= routeProgress ? styles.routeNodeDone : ""}`}
                          style={{ left: `${(idx / (ROUTE_STEPS.length - 1)) * 100}%` }}
                          title={step}
                        />
                      ))}
                    </div>
                    <div className={styles.routeStepLabels}>
                      {ROUTE_STEPS.map((step) => (
                        <span key={step}>{step}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`${styles.routePort} ${styles.routePortRight}`}>
                    <span className={styles.routePortLabel}>Destination</span>
                    <span className={styles.routePortName}>{shipment.destination?.port || "—"}</span>
                    <span className={styles.routePortCountry}>{shipment.destination?.country || ""}</span>
                  </div>
                </div>
              </div>

              {/* ── Three stat cards ── */}
              <div data-animate className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Current Location</span>
                  <span className={styles.statValue}>
                    {shipment.currentLocation?.port || "In Transit"}
                  </span>
                  <span className={styles.statSub}>{shipment.currentLocation?.country || ""}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Vessel</span>
                  <span className={styles.statValue}>{shipment.vessel?.name || "Not assigned"}</span>
                  {shipment.vessel?.imo && (
                    <span className={styles.statSub}>IMO {shipment.vessel.imo}</span>
                  )}
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Cargo</span>
                  <span className={styles.statValue}>{shipment.cargo?.description || "General"}</span>
                  {shipment.cargo?.weightKg != null && (
                    <span className={styles.statSub}>{(shipment.cargo.weightKg / 1000).toFixed(1)} t</span>
                  )}
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Event Version</span>
                  <span className={`${styles.statValue} ${styles.monoValue}`}>v{shipment.version ?? 1}</span>
                  <span className={styles.statSub}>Immutable ledger</span>
                </div>
              </div>

              {/* ── Telemetry + Compliance ── */}
              <div data-animate className={styles.lowerRow}>
                {/* Sensors */}
                <div className={styles.sensorPanel}>
                  <span className={styles.panelTitle}>Sensor Telemetry</span>
                  <div className={styles.sensorGrid}>
                    <div className={`${styles.sensorCell} ${shipment.flags?.hasTemperatureSpike ? styles.sensorCellAlert : ""}`}>
                      <span className={styles.sensorCellLabel}>Temperature</span>
                      <span className={styles.sensorCellValue}>
                        {shipment.sensorState?.temperature != null
                          ? `${shipment.sensorState.temperature} °C`
                          : "—"}
                      </span>
                      {shipment.flags?.hasTemperatureSpike && (
                        <span className={styles.sensorAlert}>Spike detected</span>
                      )}
                    </div>
                    <div className={`${styles.sensorCell} ${shipment.flags?.hasHumidityAlert ? styles.sensorCellAlert : ""}`}>
                      <span className={styles.sensorCellLabel}>Humidity</span>
                      <span className={styles.sensorCellValue}>
                        {shipment.sensorState?.humidity != null
                          ? `${shipment.sensorState.humidity} %`
                          : "—"}
                      </span>
                      {shipment.flags?.hasHumidityAlert && (
                        <span className={styles.sensorAlert}>Above threshold</span>
                      )}
                    </div>
                    <div className={styles.sensorCell}>
                      <span className={styles.sensorCellLabel}>Last Reading</span>
                      <span className={styles.sensorCellValue} style={{ fontSize: "0.8rem" }}>
                        {shipment.sensorState?.recordedAt
                          ? new Date(shipment.sensorState.recordedAt).toLocaleString()
                          : "No reading"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className={styles.compliancePanel}>
                  <span className={styles.panelTitle}>Compliance Status</span>
                  <div className={styles.complianceList}>
                    <div className={styles.complianceRow}>
                      <span className={styles.complianceLabel}>Temperature</span>
                      <span className={`${styles.complianceStatus} ${shipment.flags?.hasTemperatureSpike ? styles.statusBad : styles.statusOk}`}>
                        {shipment.flags?.hasTemperatureSpike ? "Incident" : "Normal"}
                      </span>
                    </div>
                    <div className={styles.complianceRow}>
                      <span className={styles.complianceLabel}>Humidity</span>
                      <span className={`${styles.complianceStatus} ${shipment.flags?.hasHumidityAlert ? styles.statusBad : styles.statusOk}`}>
                        {shipment.flags?.hasHumidityAlert ? "Alert" : "Normal"}
                      </span>
                    </div>
                    <div className={styles.complianceRow}>
                      <span className={styles.complianceLabel}>Customs</span>
                      <span className={`${styles.complianceStatus} ${shipment.flags?.customsHeld ? styles.statusWarn : styles.statusOk}`}>
                        {shipment.flags?.customsHeld ? "Hold" : "Cleared"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
