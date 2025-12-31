import "../index.css";
import {
  Car,
  Bike,
  MapPin,
  Clock,
  Shield,
  Github,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Real-Time Map View",
      description:
        "Interactive map showing all available parking spots in real-time",
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Multiple Vehicle Types",
      description: "Support for both cars and motorcycles with dedicated spots",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Instant Booking",
      description: "Reserve your spot in seconds with our intuitive interface",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Guaranteed Spots",
      description: "Your reserved space is secured and waiting for you",
    },
  ];

  const techStack = [
    "Nodejs",
    "React",
    "Tailwind CSS",
    "Leaflet Maps",
    "MongoDB",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Hackathon 2026 Project
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Smart Parking Booking
          </h1>
          <p className="text-xl text-white/90">
            Find, book, and manage parking spots with ease
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* About Section */}
        <div className="mb-12 animate-slideIn">
          <h2 className="text-3xl font-bold text-text mb-4">About the App</h2>
          <p className="text-muted text-lg leading-relaxed max-w-3xl">
            A modern solution to urban parking challenges, designed to make
            finding and booking parking spots seamless and stress-free. Built
            with cutting-edge web technologies to provide a fast, intuitive, and
            reliable parking management experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-surface border-2 border-border rounded-xl p-6 hover:border-primary transition-colors animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-text mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-surface border-2 border-border rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-text mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Browse",
                desc: "View available spots on the map",
              },
              {
                step: "2",
                title: "Select",
                desc: "Choose your preferred location",
              },
              { step: "3", title: "Book", desc: "Confirm your reservation" },
              { step: "4", title: "Park", desc: "Drive to your reserved spot" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack & Credits */}
        <div className="bg-surface border-2 border-border rounded-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text mb-2">
              Credits & Tech Stack
            </h2>
            <p className="text-muted">Built with modern web technologies</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Tech Stack */}
            <div className="mb-8">
              <h3 className="font-semibold text-text mb-4 text-center text-sm uppercase tracking-wider">
                Built With
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* GitHub Repository */}
            <div className="bg-background border-2 border-border rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold text-text mb-1 flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    Open Source
                  </h3>
                  <p className="text-sm text-muted">
                    Check out the code on GitHub
                  </p>
                </div>
                <a
                  href="https://github.com/dayaj1222/easy-park"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-text text-background px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  View Repository
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Team Section */}
            <div className="text-center pt-6 border-t-2 border-border">
              <p className="text-muted text-sm mb-2">Developed by</p>
              <p className="text-text font-bold text-xl mb-1">
                Glimpse of Starlight
              </p>

              {/* Team Members */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  {
                    name: "Daya Joshi",
                    github: "https://github.com/dayaj1222",
                  },
                  {
                    name: "Darshan Subedi",
                    github: "https://github.com/darshan6424",
                  },
                  {
                    name: "Kshitiz Khatri",
                    github: "https://github.com/kshitij886",
                  },
                  {
                    name: "Bimin Koju",
                    github: "https://github.com/biminkoju",
                  },
                ].map((member) => (
                  <a
                    key={member.name}
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 bg-background border border-border rounded-lg hover:border-primary transition-colors group"
                  >
                    <Github className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                    <span className="text-sm text-text font-medium text-center">
                      {member.name}
                    </span>
                  </a>
                ))}
              </div>
              <p className="text-muted text-sm">
                Made with ❤️ for Hackathon 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
