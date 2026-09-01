import { useState } from "react";

import Card from "@/components/common/Card.jsx";
import ErrorMessage from "@/components/common/ErrorMessage.jsx";
import Loader from "@/components/common/Loader.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { useShipment } from "@/hooks/useShipment.js";

import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [searchId, setSearchId] = useState("");
  const [shipmentId, setShipmentId] = useState(null);

  const { shipment, isLoading, error } = useShipment(shipmentId);

  const handleSearch = (event) => {
    event.preventDefault();

    const id = searchId.trim();

    if (id) {
      setShipmentId(id);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shipment Dashboard</h1>
        <p className={styles.subtitle}>
          Search for a shipment to view its current state.
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
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </Card>

      {isLoading && <Loader />}

      {error && <ErrorMessage message={error.message} />}

      {shipment && !isLoading && (
        <Card title={`Shipment ${shipment.aggregateId}`}>
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
