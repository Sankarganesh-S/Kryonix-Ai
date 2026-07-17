import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";

import { store } from "./store";
import { AuthProvider } from "./context/AuthContext";
import Routers from "./Routers";
import "./assets/styles/styles.scss";
import "./Popup/popup.css";
import { PopupProvider, PopupRenderer } from "./Popup";




const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PopupProvider>
            <Routers />
            <PopupRenderer />

          </PopupProvider>

        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>,
);
