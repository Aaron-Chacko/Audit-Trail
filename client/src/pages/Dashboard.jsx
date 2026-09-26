import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import anime from "@/utils/anime.js";

import Card from "@/components/common/Card.jsx";
import ErrorMessage from "@/components/common/ErrorMessage.jsx";
import Loader from "@/components/common/Loader.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { useShipment } from "@/hooks/useShipment.js";

import styles from "./Dashboard.module.css";

const DEMO_SHIPMENTS = [
  { id: "SHIP-10042", label: "SHIP-10042 (Vaccines - Temp Alert)" },
  { id: "SHIP-10043", label: "SHIP-10043 (Electronics - Customs Hold)" },
  { id: "SHIP-10044", label: "SHIP-10044 (Spices - In Transit)" },
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [shipmentId, setShipmentId] = useState(initialId || null);
  const { shipment, isLoading, error, refetch } = useShipment(shipmentId);
  const contentRef = useRef(null);

  const handleSearch = (event) => {
    event.preventDefault();
    const id = searchId.trim().toUpperCase();
    if (id) {
      setShipmentId(id);
      setSearchParams({ id });
    }
  };

  const handleSelectDemo = (id, e) => {
    if (e?.currentTarget) {
      anime({
        targets: e.currentTarget,
        scale: [0.94, 1],
        duration: 250,
        easing: 'easeOutElastic(1, .5)',
      });
    }
    setSearchId(id);
    setShipmentId(id);
    setSearchParams({ id });
  };

  // Listen for simulated events to auto-refresh live dashboard
  useEffect(() => {
    const handleSimulated = (e) => {
      if (e.detail?.aggregateId === (shipment?.aggregateId || shipmentId)) {
        refetch();
      }
    };
    window.addEventListener('audit_trail_event_simulated', handleSimulated);
    return () => window.removeEventListener('audit_trail_event_simulated', handleSimulated);
  }, [shipment?.aggregateId, shipmentId, refetch]);

  // Stagger entrance animation when shipment loads
  useEffect(() => {
    if (shipment && !isLoading && contentRef.current) {
      anime({
        targets: contentRef.current.children,
        opacity: [0, 1],
        translateY: [16, 0],
        delay: anime.stagger(70),
        duration: 400,
        easing: 'easeOutQuad',
      });
    }
  }, [shipment, isLoading]);

  const activeId = shipment?.aggregateId || shipment?.id || shipmentId;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Shipment Overview</h1>
        <p className={styles.subtitle}>
          Search or pick a shipment to inspect live status, route, sensors and alerts.
        </p>
      </div>

      {/* Search & Quick Select */}
      <div className={styles.searchCard}>
        <form className={styles.search} onSubmit={handleSearch}>
          <div className={styles.inputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.input}
              type="text"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              placeholder="Enter Shipment ID (e.g. SHIP-10042)..."
              aria-label="Shipment ID"
            />
          </div>

          <button
            className={styles.button}
            type="submit"
            disabled={!searchId.trim() || isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className={styles.quickSelectRow}>
          <span className={styles.quickLabel}>Quick Sample:</span>
          {DEMO_SHIPMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.quickChip} ${shipmentId === item.id ? styles.quickChipActive : ""}`}
              onClick={(e) => handleSelectDemo(item.id, e)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Loader />}
      {error && <ErrorMessage error={error} />}

      {/* Empty State */}
      {!shipmentId && !isLoading && (
        <Card>
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📦</div>
            <p style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "var(--color-text)", fontWeight: "600" }}>
              No Shipment Selected
            </p>
            <p style={{ fontSize: "0.875rem", maxWidth: "420px", margin: "0 auto" }}>
              Type a shipment ID above or click one of the quick samples to monitor its real-time telemetry.
            </p>
          </div>
        </Card>
      )}

      {/* Shipment Details Layout */}
      {shipment && !isLoading && (
        <div ref={contentRef} className={styles.detailsGrid}>
          {/* Main Info Card */}
          <Card title={`Shipment ${activeId}`}>
            <div className={styles.cardHeaderRow}>
              <StatusBadge status={shipment.status} />
              <Link
                to={`/timeline?id=${activeId}`}
                className={styles.timelineLinkBtn}
                title="View full event history and replay timeline"
              >
                <span>Full Audit Timeline</span>
                <span>➔</span>
              </Link>
            </div>

            <div className={styles.mainInfoGrid}>
              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Current Location</span>
                <span className={styles.infoValue}>
                  {shipment.currentLocation?.port || "In Transit"}
                  {shipment.currentLocation?.country ? `, ${shipment.currentLocation.country}` : ""}
                </span>
              </div>

              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Origin Port</span>
                <span className={styles.infoValue}>
                  {shipment.origin?.port || "—"}
                  {shipment.origin?.country ? `, ${shipment.origin.country}` : ""}
                </span>
              </div>

              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Destination Port</span>
                <span className={styles.infoValue}>
                  {shipment.destination?.port || "—"}
                  {shipment.destination?.country ? `, ${shipment.destination.country}` : ""}
                </span>
              </div>

              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Transport Vessel</span>
                <span className={styles.infoValue}>
                  {shipment.vessel?.name || "Not assigned"}
                </span>
              </div>

              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Cargo Description</span>
                <span className={styles.infoValue}>
                  {shipment.cargo?.description || "Not specified"}
                </span>
              </div>

              <div className={styles.infoCell}>
                <span className={styles.infoLabel}>Current Step</span>
                <span className={styles.infoValue}>
                  Version #{shipment.version ?? 1}
                </span>
              </div>
            </div>
          </Card>

          {/* Side Cards: Sensors & Alerts */}
          <div className={styles.sideCards}>
            {/* Sensor Readings Card */}
            <Card title="Live Sensor Readings">
              <div className={styles.sensorRows}>
                <div className={styles.sensorRow}>
                  <span className={styles.sensorLabel}>🌡️ Temperature</span>
                  <span className={styles.sensorVal}>
                    {shipment.sensorState?.temperature != null
                      ? `${shipment.sensorState.temperature} °C`
                      : "—"}
                  </span>
                </div>

                <div className={styles.sensorRow}>
                  <span className={styles.sensorLabel}>💧 Humidity</span>
                  <span className={styles.sensorVal}>
                    {shipment.sensorState?.humidity != null
                      ? `${shipment.sensorState.humidity} %`
                      : "—"}
                  </span>
                </div>

                <div className={styles.sensorRow}>
                  <span className={styles.sensorLabel}>⏱️ Last Recorded</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                    {shipment.sensorState?.recordedAt
                      ? new Date(shipment.sensorState.recordedAt).toLocaleTimeString()
                      : "—"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Incident Alerts Card */}
            <Card title="Safety & Compliance">
              <div className={styles.alertList}>
                <div className={styles.alertItem}>
                  <span className={styles.alertItemLabel}>Temperature Spike</span>
                  <StatusBadge
                    label={shipment.flags?.hasTemperatureSpike ? "Incident" : "Normal"}
                    variant={shipment.flags?.hasTemperatureSpike ? "danger" : "success"}
                  />
                </div>

                <div className={styles.alertItem}>
                  <span className={styles.alertItemLabel}>Humidity Alert</span>
                  <StatusBadge
                    label={shipment.flags?.hasHumidityAlert ? "Incident" : "Normal"}
                    variant={shipment.flags?.hasHumidityAlert ? "danger" : "success"}
                  />
                </div>

                <div className={styles.alertItem}>
                  <span className={styles.alertItemLabel}>Customs Clearance</span>
                  <StatusBadge
                    label={shipment.flags?.customsHeld ? "Held" : "Cleared"}
                    variant={shipment.flags?.customsHeld ? "danger" : "success"}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
