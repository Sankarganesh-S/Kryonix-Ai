import { configureStore } from "@reduxjs/toolkit";
import ui from "./uiSlice";

export const store = configureStore({
  reducer: { ui },
});
