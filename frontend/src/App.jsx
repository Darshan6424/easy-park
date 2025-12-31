import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/layout.jsx";

import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Landing from "./pages/landing.jsx";
import Home from "./pages/home.jsx";
import SearchMap from "./pages/searchMap.jsx";
import BookingPage from "./pages/booking.jsx";
import Profile from "./pages/profile.jsx";
import Locations from "./pages/location.jsx";
import AddLocation from "./pages/addLocation.jsx";
import LocationDetail from "./pages/locationDetails.jsx";
import Ticket from "./pages/ticket.jsx";
import QRScannerPage from "./pages/QRScanner.jsx";
import MyBookingsComponent from "./components/ui/myBookings.jsx";
import About from "./pages/about.jsx";
import FAQ from "./pages/faq.jsx";
import RegisterOwner from "./pages/register-owner.jsx";

function App() {
  return (
    <BrowserRouter>
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
          path="/add-location"
          element={
            <layout>
              <AddLocation />
            </layout>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
