import "../index.css";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I book a parking spot?",
      answer:
        "Simply browse available spots on the interactive map, click on your preferred spot, select your vehicle type (car or motorcycle), and click the 'Book Now' button to confirm your reservation.",
    },
    {
      question: "Can I cancel or modify my booking?",
      answer:
        "Yes, you can view and manage all your bookings from the 'My Bookings' section. You can cancel or modify your reservation before the scheduled time.",
    },
    {
      question: "What vehicle types are supported?",
      answer:
        "We currently support both cars and motorcycles. Each parking spot is designated for a specific vehicle type, and you can filter spots based on your vehicle when booking.",
    },
    {
      question: "How do I know which spot is mine?",
      answer:
        "After booking, you'll receive a confirmation with your spot number and exact location. You can also view your booking details anytime in the 'My Bookings' section, which shows the spot number and location on the map.",
    },
    {
      question: "Is the parking availability updated in real-time?",
      answer:
        "Yes! Our system updates in real-time, so you always see the most current availability status. When a spot is booked, it's immediately marked as occupied on the map.",
    },
    {
      question: "What if someone is parked in my reserved spot?",
      answer:
        "Your reservation guarantees you that specific spot. If you encounter any issues, please contact the parking facility management or use the support feature in the app.",
    },
    {
      question: "Can I book multiple spots at once?",
      answer:
        "Currently, you can book one spot at a time per reservation. If you need multiple spots, you'll need to make separate bookings for each one.",
    },
    {
      question: "How far in advance can I book?",
      answer:
        "You can book parking spots based on the availability shown in the system. Check the specific parking location for their advance booking policies.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fadeIn">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-white/90">
            Everything you need to know about parking bookings
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-surface border-2 border-border rounded-xl overflow-hidden animate-slideIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-background transition-colors"
              >
                <span className="font-semibold text-text pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 text-muted leading-relaxed border-t border-border pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-surface border-2 border-border rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-text mb-2">
            Still have questions?
          </h2>
          <p className="text-muted mb-4">
            Can't find what you're looking for? We're here to help!
          </p>
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
