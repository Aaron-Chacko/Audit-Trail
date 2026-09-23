import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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

  const { shipment, isLoading, error } = useShipment(shipmentId);

  const handleSearch = (event) => {
    event.preventDefault();

    const id = searchId.trim().toUpperCase();

    if (id) {
      setShipmentId(id);
      setSearchParams({ id });
    }
  };

  const handleSelectDemo = (id) => {
    setSearchId(id);
    setShipmentId(id);
    setSearchParams({ id });
  };

  const activeId = shipment?.aggregateId || shipment?.id || shipmentId;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shipment Dashboard</h1>
        <p className={styles.subtitle}>
          Select or search a shipment ID to see its live details.
        </p>
      </div>

      <Card>
        <form className={styles.search} onSubmit={handleSearch}>
          <input
            className={styles.input}
            type="text"
            value={searchId}
            onChange={(event) => setSearchId(event.target.value)}
            placeholder="Enter shipment ID e.g. SHIP-10042"
            aria-label="Shipment ID"
          />

          <button
            className={styles.button}
            type="submit"
            disabled={!searchId.trim() || isLoading}
          >
            {isLoading ? "Loading..." : "Search"}
          </button>
        </form>

        <div className={styles.quickSelectRow}>
          <span className={styles.quickLabel}>Sample Shipments:</span>
          {DEMO_SHIPMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.quickChip} ${shipmentId === item.id ? styles.quickChipActive : ""}`}
              onClick={() => handleSelectDemo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {isLoading && <Loader />}

      {error && <ErrorMessage error={error} />}

      {!shipmentId && !isLoading && (
        <Card>
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--color-text-muted)" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--color-text)", fontWeight: "600" }}>
              No Shipment Loaded
            </p>
            <p>Type a shipment ID above or click one of the sample shipments to view its live status.</p>
          </div>
        </Card>
      )}

      {shipment && !isLoading && (
        <Card title={`Shipment ${activeId}`}>
          <div className={styles.cardHeaderRow}>
            <Link
              to={`/timeline?id=${activeId}`}
              className={styles.timelineLinkBtn}
              title="View full event history and replay timeline"
            >
              View Full History ➔
            </Link>
          </div>
          <div className={styles.content}>
            <div className={styles.section}>
              <span className={styles.label}>Status</span>
              <StatusBadge status={shipment.status} />
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Current Location</span>
              <span className={styles.value}>
                {shipment.currentLocation?.port || "Unknown"}
                {shipment.currentLocation?.country
                  ? `, ${shipment.currentLocation.country}`
                  : ""}
              </span>
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Origin</span>
              <span className={styles.value}>
                {shipment.origin?.port || "Unknown"}
                {shipment.origin?.country ? `, ${shipment.origin.country}` : ""}
              </span>
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Destination</span>
              <span className={styles.value}>
                {shipment.destination?.port || "Unknown"}
                {shipment.destination?.country
                  ? `, ${shipment.destination.country}`
                  : ""}
              </span>
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Vessel</span>
              <span className={styles.value}>
                {shipment.vessel?.name || "Not assigned"}
              </span>
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Cargo</span>
              <span className={styles.value}>
                {shipment.cargo?.description || "Not specified"}
              </span>
            </div>
          </div>
        </Card>
      )}
      {shipment && !isLoading && (
        <>
          <Card title="Latest Sensor Readings">
            <div className={styles.content}>
              <div className={styles.section}>
                <span className={styles.label}>Temperature</span>
                <span className={styles.value}>
                  {shipment.sensorState?.temperature != null
                    ? `${shipment.sensorState.temperature} °C`
                    : "No reading"}
                </span>
              </div>

              <div className={styles.section}>
                <span className={styles.label}>Humidity</span>
                <span className={styles.value}>
                  {shipment.sensorState?.humidity != null
                    ? `${shipment.sensorState.humidity} %`
                    : "No reading"}
                </span>
              </div>

              <div className={styles.section}>
                <span className={styles.label}>Last Recorded</span>
                <span className={styles.value}>
                  {shipment.sensorState?.recordedAt
                    ? new Date(shipment.sensorState.recordedAt).toLocaleString()
                    : "No reading"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Alerts">
            <div className={styles.content}>
              <div className={styles.section}>
                <span className={styles.label}>Temperature Spike</span>
                <StatusBadge
                  label={
                    shipment.flags?.hasTemperatureSpike ? "Alert" : "Normal"
                  }
                  variant={
                    shipment.flags?.hasTemperatureSpike ? "danger" : "success"
                  }
                />
              </div>

              <div className={styles.section}>
                <span className={styles.label}>Humidity Alert</span>
                <StatusBadge
                  label={shipment.flags?.hasHumidityAlert ? "Alert" : "Normal"}
                  variant={
                    shipment.flags?.hasHumidityAlert ? "danger" : "success"
                  }
                />
              </div>

              <div className={styles.section}>
                <span className={styles.label}>Customs</span>
                <StatusBadge
                  label={shipment.flags?.customsHeld ? "Held" : "Clear"}
                  variant={shipment.flags?.customsHeld ? "danger" : "success"}
                />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
