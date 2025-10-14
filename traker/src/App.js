import React, { useState, useEffect } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function App() {
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    setError("");
    setData(null);

    if (!input.trim()) {
      setError("Please enter an IP address or domain.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Something went wrong");

      setData(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <h1>IP/Domain Tracker</h1>
      <input
        type="text"
        value={input}
        placeholder="Enter IP or domain"
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleTrack}>Track</button>

      {error && <p className="error">{error}</p>}

      {data && (
        <>
          <div className="result">
            <p><strong>Resolved IP:</strong> {data.resolved_ip}</p>
            <p><strong>City:</strong> {data.city}</p>
            <p><strong>Region:</strong> {data.region}</p>
            <p><strong>Country:</strong> {data.country_name}</p>
            <p><strong>Org:</strong> {data.org}</p>
            <p><strong>Timezone:</strong> {data.timezone}</p>
          </div>

          <MapContainer
            center={[data.latitude, data.longitude]}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "400px", width: "80%", margin: "20px auto" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[data.latitude, data.longitude]}>
              <Popup>
                {data.city}, {data.country_name} <br />
                ISP: {data.org}
              </Popup>
            </Marker>
          </MapContainer>
        </>
      )}
    </div>
  );
}

export default App;
