import { Mail, Phone, MapPin } from "lucide-react";
import APP_CONFIG from "../../config/config.js";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-text text-background border-t border-primary">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4">
              {APP_CONFIG.name}
            </h3>
            <p className="text-background opacity-80 text-sm md:text-base">
              Book your parking spot in advance. Park hassle-free at your
              scheduled time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-background">
              Quick Links
            </h4>
            <ul className="space-y-1.5 md:space-y-2">
              <li>
                <a
                  href="/about"
                  className="text-background opacity-80 hover:text-primary transition-colors text-sm md:text-base"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/locations"
                  className="text-background opacity-80 hover:text-primary transition-colors text-sm md:text-base"
                >
                  Locations
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-background opacity-80 hover:text-primary transition-colors text-sm md:text-base"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-background">
              Contact Us
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-center gap-2 text-background opacity-80 text-sm md:text-base">
                <Mail size={16} className="text-primary" />
                <a
                  href={`mailto:${APP_CONFIG.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {APP_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-background opacity-80 text-sm md:text-base">
                <Phone size={16} className="text-primary" />
                <a
                  href={`tel:${APP_CONFIG.phone}`}
                  className="hover:text-primary transition-colors"
                >
                  {APP_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-background opacity-80 text-sm md:text-base">
                <MapPin size={16} className="text-primary mt-1" />
                <span>{APP_CONFIG.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background mt-6 md:mt-8 pt-6 md:pt-8 text-center text-background opacity-70">
          <p className="text-xs md:text-base">
            © 2024 Smart Parking Booking • Hackathon Project
          </p>
        </div>
      </div>
    </footer>
  );
}
