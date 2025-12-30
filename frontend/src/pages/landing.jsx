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
      navigate("/home");
    }
  });

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
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-6">
                Never Worry About Parking Again
              </h1>
              <p className="text-lg md:text-xl text-muted mb-8">
                Book your parking spot in advance and arrive stress-free.
                {APP_CONFIG.name} makes parking simple, fast, and convenient.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-primary text-white px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => navigate("/locations")}
                  className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
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

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Why Choose {APP_CONFIG.name}?
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              We make parking easy with features designed for your convenience
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background border border-border rounded-xl p-6 hover:border-primary transition-colors"
              >
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted">
              Three simple steps to secure parking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Location",
                desc: "Select your destination and time",
              },
              {
                step: "2",
                title: "Book & Pay",
                desc: "Reserve your spot instantly",
              },
              {
                step: "3",
                title: "Park & Go",
                desc: "Show your ticket and park hassle-free",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  {item.title}
                </h3>
                <p className="text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
                Park Smarter, Not Harder
              </h2>
              <p className="text-lg text-muted mb-8">
                Say goodbye to parking stress and hello to convenience. With{" "}
                {APP_CONFIG.name}, you're always one step ahead.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      className="text-primary shrink-0 mt-1"
                      size={20}
                    />
                    <span className="text-text">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 shadow-xl">
              <div className="text-center">
                <p className="text-5xl md:text-6xl font-bold text-white mb-4">
                  1000+
                </p>
                <p className="text-xl text-white font-semibold mb-2">
                  Parking Spots
                </p>
                <p className="text-white text-opacity-90">
                  Available across the city
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="text-center bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-white">50+</p>
                  <p className="text-sm text-white text-opacity-90">
                    Locations
                  </p>
                </div>
                <div className="text-center bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-white">10k+</p>
                  <p className="text-sm text-white text-opacity-90">
                    Happy Users
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted mb-8">
            Join thousands of drivers who never worry about parking anymore
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-primary text-white px-10 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight size={24} />
          </button>
        </div>
      </section>
    </div>
  );
}
