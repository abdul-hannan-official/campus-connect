import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeProvider";
import { SocketProvider } from "../context/SocketContext";
import "../context/theme.css";
import "./index.css";
import "./modern.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);