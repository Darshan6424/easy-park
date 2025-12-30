import SearchParking from "../components/ui/searchParking.jsx";
import MyBookings from "../components/ui/myBookings.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section with Search */}
        <section className="mb-12 md:mb-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text mb-4">
              Welcome Back!
            </h1>
            <p className="text-lg text-muted">
              Find and book your parking spot in seconds
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <SearchParking />
          </div>
        </section>

        {/* My Bookings Section */}
        <section>
          <MyBookings />
        </section>
      </div>
    </div>
  );
}
