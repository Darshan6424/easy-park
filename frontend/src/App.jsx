// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./components/layout/layout.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Landing from "./pages/landing.jsx";
import Home from "./pages/home.jsx";
import SearchMap from "./pages/searchMap.jsx";
import BookingPage from "./pages/booking.jsx";
import Profile from "./pages/profile.jsx";
import Locations from "./pages/location.jsx";
import LocationDetail from "./pages/locationDetails.jsx";
import Ticket from "./pages/ticket.jsx";
import QRScannerPage from "./pages/QRScanner.jsx";
import MyBookingsComponent from "./components/ui/myBookings.jsx";
import About from "./pages/about.jsx";
import FAQ from "./pages/faq.jsx";
import RegisterOwner from "./pages/register-owner.jsx";
import OwnerMapPage from "./pages/ownerMap.jsx";
import OwnerDashboard from "./pages/ownerDashboard.jsx";
import OwnerLocations from "./pages/ownerLocations.jsx";
import OwnerEditLocation from "./pages/ownerEditLocation.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Landing />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/register"
            element={
              <Layout>
                <Register />
              </Layout>
            }
          />
          <Route
            path="/home"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route path="/map" element={<SearchMap />} />
          <Route
            path="/book"
            element={
              <Layout>
                <BookingPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <Profile />
              </Layout>
            }
          />
          <Route
            path="/booking/:bookingId"
            element={
              <Layout>
                <Ticket />
              </Layout>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <Layout>
                <MyBookingsComponent />
              </Layout>
            }
          />
          <Route
            path="/locations"
            element={
              <Layout>
                <Locations />
              </Layout>
            }
          />
          <Route
            path="/location/:locationId"
            element={
              <Layout>
                <LocationDetail />
              </Layout>
            }
          />
          <Route
            path="/scan"
            element={
              <Layout>
                <QRScannerPage />
              </Layout>
            }
          />
          <Route
            path="/owner-map"
            element={
              <Layout>
                <OwnerMapPage />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/faq"
            element={
              <Layout>
                <FAQ />
              </Layout>
            }
          />
          <Route
            path="/register-owner"
            element={
              <Layout>
                <RegisterOwner />
              </Layout>
            }
          />
          <Route
            path="/owner-dashboard"
            element={
              <Layout>
                <OwnerDashboard />
              </Layout>
            }
          />
          <Route
            path="/owner-locations"
            element={
              <Layout>
                <OwnerLocations />
              </Layout>
            }
          />
          <Route
            path="/owner/edit-location/:locationId"
            element={
              <Layout>
                <OwnerEditLocation />
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
