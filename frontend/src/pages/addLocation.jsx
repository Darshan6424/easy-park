import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Grid3x3,
  Car,
  Bike,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  IndianRupee,
} from "lucide-react";

export default function AddLocation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Cost, 3: Location, 4: Grid Setup, 5: Place Spots, 6: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
    coordinates: { lat: "", lng: "" },
  });

  // Grid setup
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 });
  const [selectedType, setSelectedType] = useState("car"); // car or bike
  const [placedSpots, setPlacedSpots] = useState({}); // { "0-0": "car", "0-1": "bike" }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      coordinates: { ...prev.coordinates, [name]: value },
    }));
  };

  const handleGridClick = (row, col) => {
    const key = `${row}-${col}`;
    setPlacedSpots((prev) => {
      const newSpots = { ...prev };
      if (newSpots[key] === selectedType) {
        delete newSpots[key]; // Remove if clicking same type
      } else {
        newSpots[key] = selectedType; // Place or change type
      }
      return newSpots;
    });
  };

  const getSpotCounts = () => {
    const counts = { car: 0, bike: 0 };
    Object.values(placedSpots).forEach((type) => {
      counts[type]++;
    });
    return counts;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Convert placed spots to array format
      const parkingSpots = Object.entries(placedSpots).map(([key, type]) => {
        const [row, col] = key.split("-");
        return {
          spotNumber: `${String.fromCharCode(65 + parseInt(row))}${parseInt(col) + 1}`,
          type: type,
        };
      });

      const requestBody = {
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost),
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.coordinates.lng),
            parseFloat(formData.coordinates.lat),
          ],
        },
        parkingSpots: parkingSpots,
      };

      console.log("Submitting:", requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/location/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        },
      );

      const result = await response.json();
      console.log("Response:", result);

      if (response.ok) {
        // Clear cache after adding location
        localStorage.removeItem("parking_locations_cache");
        localStorage.removeItem("parking_locations_timestamp");

        alert("Location created successfully!");
        navigate("/locations");
      } else {
        setError(result.message || "Failed to create location");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== "";
      case 2:
        return formData.cost !== "" && parseFloat(formData.cost) > 0;
      case 3:
        return (
          formData.coordinates.lat !== "" && formData.coordinates.lng !== ""
        );
      case 4:
        return gridSize.rows > 0 && gridSize.cols > 0;
      case 5:
        return Object.keys(placedSpots).length > 0;
      default:
        return true;
    }
  };

  const counts = getSpotCounts();

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/locations")}
            className="text-muted hover:text-text mb-4 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Back to Locations
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Add Parking Location
          </h1>
          <p className="text-muted">
            Create a new parking location for users to book
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s <= step ? "bg-primary text-white" : "bg-border text-muted"
                }`}
              >
                {s}
              </div>
              {s < 6 && (
                <div
                  className={`w-6 md:w-10 h-1 mx-1 ${s < step ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface border-2 border-border rounded-xl p-6 md:p-8 shadow-sm">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                Location Details
              </h2>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Mall Parking"
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the parking location"
                  rows={3}
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 2: Cost */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">Set Pricing</h2>

              <p className="text-muted text-sm">
                Enter the hourly parking rate for this location
              </p>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Hourly Rate *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <IndianRupee className="text-muted" size={20} />
                  </div>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="50"
                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text text-lg font-semibold transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                    per hour
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-4">
                <p className="text-sm text-text">
                  <strong>💡 Pricing Tips:</strong>
                </p>
                <ul className="text-sm text-muted mt-2 space-y-1 ml-4 list-disc">
                  <li>Consider your location's convenience and demand</li>
                  <li>Check competitor pricing in the area</li>
                  <li>You can update this later if needed</li>
                </ul>
              </div>

              {formData.cost && parseFloat(formData.cost) > 0 && (
                <div className="bg-success/10 border border-success rounded-lg p-4">
                  <p className="text-sm font-semibold text-text">
                    Preview: ₹{formData.cost}/hour
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Users will see this rate when booking
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location Coordinates */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                Set Location
              </h2>

              <p className="text-muted text-sm">
                Enter the GPS coordinates of your parking location. You can get
                these from Google Maps.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    name="lat"
                    step="any"
                    value={formData.coordinates.lat}
                    onChange={handleCoordinateChange}
                    placeholder="27.7172"
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    name="lng"
                    step="any"
                    value={formData.coordinates.lng}
                    onChange={handleCoordinateChange}
                    placeholder="85.3240"
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                  />
                </div>
              </div>

              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4">
                <p className="text-sm text-text">
                  <strong>💡 Tip:</strong> Right-click on Google Maps and select
                  the coordinates to copy them.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Grid Setup */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                Setup Parking Grid
              </h2>

              <p className="text-muted text-sm">
                Define the size of your parking grid. You'll place spots in the
                next step.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Rows *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={gridSize.rows}
                    onChange={(e) =>
                      setGridSize({
                        ...gridSize,
                        rows: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Columns *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={gridSize.cols}
                    onChange={(e) =>
                      setGridSize({
                        ...gridSize,
                        cols: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary text-text transition-colors"
                  />
                </div>
              </div>

              <div className="bg-background border-2 border-border rounded-lg p-4">
                <p className="text-muted text-sm">
                  Total grid capacity:{" "}
                  <span className="text-text font-semibold text-lg">
                    {gridSize.rows * gridSize.cols} spots
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Place Spots */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                Place Parking Spots
              </h2>

              <p className="text-muted text-sm mb-4">
                Select spot type below, then click on the grid to place spots.
                Click again to remove.
              </p>

              {/* Type Selector */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setSelectedType("car")}
                  className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
                    selectedType === "car"
                      ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-md"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <Car
                    className={`mx-auto mb-2 ${selectedType === "car" ? "text-primary" : "text-muted"}`}
                    size={32}
                    strokeWidth={2.5}
                  />
                  <p className="font-bold text-text">Car</p>
                  <p className="text-sm text-muted font-medium mt-1">
                    {counts.car} placed
                  </p>
                </button>

                <button
                  onClick={() => setSelectedType("bike")}
                  className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
                    selectedType === "bike"
                      ? "border-secondary bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-md"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <Bike
                    className={`mx-auto mb-2 ${selectedType === "bike" ? "text-secondary" : "text-muted"}`}
                    size={32}
                    strokeWidth={2.5}
                  />
                  <p className="font-bold text-text">Bike</p>
                  <p className="text-sm text-muted font-medium mt-1">
                    {counts.bike} placed
                  </p>
                </button>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="inline-block min-w-full">
                  <div
                    className="grid gap-2 sm:gap-3 p-4 bg-background rounded-xl"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: gridSize.rows }).map((_, row) =>
                      Array.from({ length: gridSize.cols }).map((_, col) => {
                        const key = `${row}-${col}`;
                        const spotType = placedSpots[key];
                        const spotNumber = `${String.fromCharCode(65 + row)}${col + 1}`;

                        return (
                          <button
                            key={key}
                            onClick={() => handleGridClick(row, col)}
                            className={`aspect-square min-w-0 rounded-lg border-2 flex flex-col items-center justify-center gap-1 p-2 transition-all ${
                              spotType === "car"
                                ? "border-primary bg-gradient-to-br from-primary/30 to-primary/10 shadow-md"
                                : spotType === "bike"
                                  ? "border-secondary bg-gradient-to-br from-secondary/30 to-secondary/10 shadow-md"
                                  : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            {spotType === "car" && (
                              <Car
                                size={20}
                                className="text-primary"
                                strokeWidth={2.5}
                              />
                            )}
                            {spotType === "bike" && (
                              <Bike
                                size={20}
                                className="text-secondary"
                                strokeWidth={2.5}
                              />
                            )}
                            <span className="text-xs font-bold text-text">
                              {spotNumber}
                            </span>
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                Review & Submit
              </h2>

              <div className="space-y-4">
                <div className="bg-background border-2 border-border rounded-lg p-4">
                  <p className="text-xs text-muted uppercase font-semibold mb-2">
                    Location Name
                  </p>
                  <p className="text-text font-bold text-lg">{formData.name}</p>
                </div>

                {formData.description && (
                  <div className="bg-background border-2 border-border rounded-lg p-4">
                    <p className="text-xs text-muted uppercase font-semibold mb-2">
                      Description
                    </p>
                    <p className="text-text">{formData.description}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary rounded-lg p-4">
                  <p className="text-xs text-muted uppercase font-semibold mb-2">
                    Hourly Rate
                  </p>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="text-primary" size={24} />
                    <p className="text-primary font-bold text-2xl">
                      {formData.cost}
                    </p>
                    <span className="text-muted text-sm">per hour</span>
                  </div>
                </div>

                <div className="bg-background border-2 border-border rounded-lg p-4">
                  <p className="text-xs text-muted uppercase font-semibold mb-2">
                    Coordinates
                  </p>
                  <p className="text-text font-mono">
                    {formData.coordinates.lat}, {formData.coordinates.lng}
                  </p>
                </div>

                <div className="bg-background border-2 border-border rounded-lg p-4">
                  <p className="text-xs text-muted uppercase font-semibold mb-3">
                    Parking Spots
                  </p>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Car
                          className="text-primary"
                          size={20}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div>
                        <p className="text-text font-bold text-lg">
                          {counts.car}
                        </p>
                        <p className="text-xs text-muted">Car spots</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Bike
                          className="text-secondary"
                          size={20}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div>
                        <p className="text-text font-bold text-lg">
                          {counts.bike}
                        </p>
                        <p className="text-xs text-muted">Bike spots</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted">
                      Total spots:{" "}
                      <span className="text-text font-bold">
                        {Object.keys(placedSpots).length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border-2 border-error rounded-lg p-4">
                  <p className="text-text text-sm font-semibold">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="px-6 py-3 border-2 border-border text-text rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}

            {step < 6 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Create Location
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
