import { useContext } from "react";
import { PopupContext } from "./PopupProvider";

export function usePopupState() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("PopupRenderer must be used within PopupProvider");
  return ctx;
}

