import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function MapComponent({ data }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [data]);

  if (
    data?.latitude == null ||
    data?.longitude == null ||
    isNaN(data.latitude) ||
    isNaN(data.longitude)
  ) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#333",
          color: "#aaa",
        }}
      >
        Invalid coordinates provided.
      </div>
    );
  }


  return (
    <MapContainer
      ref={mapRef}
      center={[data.latitude, data.longitude]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[data.latitude, data.longitude]}>
        <Popup>
          {data.city ? `${data.city}, ` : ""}
          {data.country_name || "Location"} <br />
          {data.org ? `ISP: ${data.org}` : ""}
        </Popup>
      </Marker>
    </MapContainer>
  );
}


function App() {
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    setError("");
    setData(null);
    setLoading(true);

    if (!input.trim()) {
      setError("Please enter an IP address or domain.");
      setLoading(false);
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

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.latitude == null || result.longitude == null) {
          throw new Error("Geolocation data (latitude/longitude) missing in API response.");
      }

      setData(result);
    } catch (err) {
       console.error("Fetch Error:", err);
       setError(err.message || "An unexpected error occurred during fetch.");
       setData(null);
    } finally {
      setLoading(false);
    }
  };


  const renderContent = () => {
    if (loading) {
      return (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="spinner-container"
        >
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </motion.div>
      );
    }

    if (data) {
      return (
        <motion.div
          key="data"
          className="result-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
        >
          <motion.div className="result" variants={itemVariants}>
            <div className="details-column">
              <motion.p variants={itemVariants}>
                <strong>Resolved IP:</strong> {data.resolved_ip || "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>City:</strong> {data.city || "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>Region:</strong> {data.region || "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>Country:</strong> {data.country_name || "N/A"}
              </motion.p>
            </div>
            <div className="details-column">
              <motion.p variants={itemVariants}>
                <strong>Org:</strong> {data.org || "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>Timezone:</strong> {data.timezone || "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>Latitude:</strong> {data.latitude ?? "N/A"}
              </motion.p>
              <motion.p variants={itemVariants}>
                <strong>Longitude:</strong> {data.longitude ?? "N/A"}
              </motion.p>
            </div>
          </motion.div>


          <motion.div className="map-container" variants={itemVariants}>
            <MapComponent data={data} />
          </motion.div>
        </motion.div>
      );
    }

    if (!error) {
         return (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="initial-prompt"
          >
            <p>Enter an IP or domain to see the details.</p>
          </motion.div>
         );
    }

    return null;

  };

  return (
    <div className="App">
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Ip Tracker & Geolocation tool🌍
      </motion.h1>

      <div className="input-container">
        <input
          type="text"
          value={input}
          placeholder="Enter IP or domain (e.g., 8.8.8.8 or google.com)"
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && handleTrack()}
          disabled={loading}
        />
        <motion.button
          onClick={handleTrack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          {loading ? <div className="loader" /> : "Track"}
        </motion.button>
      </div>

      <div className="error-container">
        <AnimatePresence>
          {error && (
            <motion.p
              className="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="content-area">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </div>
    </div>
  );
}

export default App;