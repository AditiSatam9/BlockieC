import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import View from "./routes/view";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(

  <BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/view" element={<View />} />
  </Routes>
</BrowserRouter>


);
