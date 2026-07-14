import { createSlice } from "@reduxjs/toolkit";

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: read("kryonix_theme", "dark"),
    model: read("kryonix_model", "llama3.1:8b"),
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload === "light" ? "light" : "dark";
      try { localStorage.setItem("kryonix_theme", state.theme); } catch {}
    },
    setModel(state, action) {
      state.model = String(action.payload || "llama3.1:8b");
      try { localStorage.setItem("kryonix_model", state.model); } catch {}
    },
  },
});

export const { setTheme, setModel } = uiSlice.actions;
export default uiSlice.reducer;
