import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Loader2,
  MapPin,
  Save,
  Navigation,
  Car,
  Bike,
  ScanLine,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ownerIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function OwnerMapPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    cost: "",
    carSpots: 2,
    bikeSpots: 2,
  });

  const center = useMemo(
    () => selectedCoords || [27.700769, 85.30014],
    [selectedCoords],
  );

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location?ownerOnly=true`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const data = await response.json();
      if (response.ok) {
        setLocations(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Unable to load locations");
      }
    } catch (err) {
      setError("Network error while loading locations");
    } finally {
      setLoading(false);
    }
  };

  const generateSpots = () => {
    const spots = [];
    for (let i = 0; i < Number(form.carSpots || 0); i++) {
      spots.push({ spotNumber: `C${i + 1}`, type: "car" });
    }
    for (let i = 0; i < Number(form.bikeSpots || 0); i++) {
      spots.push({ spotNumber: `B${i + 1}`, type: "bike" });
    }
    return spots;
  };

  const handleCreate = async () => {
    if (!selectedCoords) {
      setError("Click on the map to set coordinates first.");
      return;
    }
    if (!form.name.trim() || !form.cost) {
      setError("Name and hourly rate are required.");
      return;
    }

    setSaving(true);
    setError("");

    const parkingSpots = generateSpots();
    const payload = {
      name: form.name,
      description: form.description,
      cost: parseFloat(form.cost),
      location: {
        type: "Point",
        coordinates: [selectedCoords[1], selectedCoords[0]], // lng, lat
      },
      parkingSpots,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      if (response.ok) {
        setForm({ name: "", description: "", cost: "", carSpots: 2, bikeSpots: 2 });
        setSelectedCoords(null);
        fetchLocations();
      } else {
        setError(data.message || "Failed to save location");
      }
    } catch (err) {
      setError("Network error while saving location");
    } finally {
      setSaving(false);
    }
  };

  const availableCount = (location, type) =>
    location.parkingSpots?.filter((s) => s.type === type && !s.isOccupied).length || 0;

  return (
    <div className="min-h-screen bg-background py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted flex items-center gap-2">
              <ScanLine size={16} /> Owner Map &amp; Scanning
            </p>
            <h1 className="text-3xl font-bold text-text">Manage Your Locations</h1>
            <p className="text-muted text-sm">
              Add parking directly on the map and launch the scanner for a specific site.
            </p>
          </div>
          <button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
            onClick={() => fetchLocations()}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-error/10 border border-error/40 text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface border-2 border-border rounded-xl overflow-hidden">
              <MapContainer
                center={center}
                zoom={14}
                style={{ height: "520px", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationPicker onSelect={setSelectedCoords} />

                {selectedCoords && (
                  <Marker position={selectedCoords} icon={ownerIcon}>
                    <Popup>New location here</Popup>
                  </Marker>
                )}

                {locations.map((loc) => (
                  <Marker
                    key={loc._id}
                    position={[
                      loc.location.coordinates[1],
                      loc.location.coordinates[0],
                    ]}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <p className="font-bold text-text">{loc.name}</p>
                        <p className="text-xs text-muted">रु {loc.cost}/hr</p>
                        <p className="text-xs text-muted">{loc.description}</p>
                        <div className="flex items-center gap-3 text-xs font-semibold text-text">
                          <span className="flex items-center gap-1">
                            <Car size={14} /> {availableCount(loc, "car")} car
                          </span>
                          <span className="flex items-center gap-1">
                            <Bike size={14} /> {availableCount(loc, "bike")} bike
                          </span>
                        </div>
                        <button
                          className="w-full bg-primary text-white py-2 rounded-lg text-xs font-semibold"
                          onClick={() => navigate(`/scan?locationId=${loc._id}`)}
                        >
                          Open Scanner
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="bg-surface border-2 border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-text">Add Location</h2>
            </div>
            <p className="text-sm text-muted">
              Click on the map to set coordinates, then fill the details below.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-text">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                  placeholder="e.g., City Center Basement"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                  rows={3}
                  placeholder="Access road, security, landmarks..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text">Hourly Rate (रु)</label>
                <input
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                  placeholder="70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-text flex items-center gap-1">
                    <Car size={16} /> Car spots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.carSpots}
                    onChange={(e) => setForm({ ...form, carSpots: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text flex items-center gap-1">
                    <Bike size={16} /> Bike spots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.bikeSpots}
                    onChange={(e) => setForm({ ...form, bikeSpots: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="bg-background border-2 border-border rounded-lg p-3 text-sm text-muted">
                <p>
                  Click anywhere on the map to place the marker. Coordinates are saved automatically.
                </p>
                {selectedCoords && (
                  <p className="mt-1 text-text font-semibold">
                    {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                  </p>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
