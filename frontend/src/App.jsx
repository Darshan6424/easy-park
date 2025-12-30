import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/layout.jsx";

import Home from "./pages/home.jsx";
import QRComponent from "./components/ui/QRComponent.jsx";
import QrCodeScanner from "./components/ui/QRScanner.jsx";

function App() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <QRComponent value={'hello guys'} />
      <QrCodeScanner />
    </div>
  );
}

export default App;
