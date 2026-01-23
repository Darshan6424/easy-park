import {
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import APP_CONFIG from "../config/config.js";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const features = [
    {
      icon: Clock,
      title: "Book in Advance",
      description: "Reserve your spot ahead of time and skip the hassle",
    },
    {
      icon: MapPin,
      title: "Multiple Locations",
      description: "Find parking spots near all major destinations",
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description: "All parking areas are monitored and secure",
    },
    {
      icon: Zap,
      title: "Instant Confirmation",
      description: "Get your parking ticket immediately after booking",
    },
  ];

  const benefits = [
    "No more circling for parking",
    "Guaranteed spot at your chosen time",
    "Contactless check-in with QR code",
    "Flexible cancellation policy",
    "24/7 customer support",
  ];

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-6">
                Never Worry About Parking Again
              </h1>
              <p className="text-lg md:text-xl text-muted mb-8">
                Book your parking spot in advance and arrive stress-free.
                {APP_CONFIG.name.english} makes parking simple, fast, and convenient.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-primary text-white px-8 py-4 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => navigate("/locations")}
                  className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-medium"
                >
                  View Locations
                </button>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="bg-primary bg-opacity-10 rounded-3xl p-8 border-2 border-primary">
                <div className="bg-surface rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <MapPin className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Downtown Mall</p>
                      <p className="font-semibold text-text">Parking Level 2</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Time</span>
                      <span className="text-text font-medium">
                        2:00 PM - 5:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Spot</span>
                      <span className="text-text font-medium">A-24</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Price</span>
                      <span className="text-primary font-bold text-lg">
                        $8.00
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-primary text-white py-3 rounded-lg mt-4 font-medium">
                    Confirmed ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
