import React from "react";
import ReactDOM from "react-dom/client";

import Routers from "./Routers";
import "./assets/styles/styles.scss";
import "./Popup/popup.css";

import AppProviders from "./AppProviders";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppProviders>
    <Routers />
  </AppProviders>
);

