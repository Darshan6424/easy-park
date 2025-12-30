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
import MyBookings from "./components/ui/myBookings.jsx";
import Locations from "./pages/location.jsx";
import AddLocation from "./pages/addLocation.jsx";
import LocationDetail from "./pages/locationDetails.jsx";

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
          path="/my-bookings"
          element={
            <Layout>
              <MyBookings />
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
            <Layout>
              <AddLocation />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
