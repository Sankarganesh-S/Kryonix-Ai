import { useCallback, useContext, useMemo } from "react";
import { PopupContext } from "./PopupProvider";

export default function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within PopupProvider");

  const { open, close, dispatch } = ctx;

  const popup = useMemo(
    () => ({
      open: (payload) => dispatch({ type: "OPEN", payload }),
      close,
      confirm: ({ title, description, confirmText = "OK", cancelText = "Cancel", ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "confirm",
            variant: "confirm",
            confirmText,
            cancelText,
            ...rest,
          },
        }),
      alert: ({ title, description, confirmText = "OK", ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "alert",
            variant: "alert",
            confirmText,
            cancelText: undefined,
            ...rest,
          },
        }),
      success: ({ title, description, confirmText = "OK", ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "success",
            variant: "success",
            confirmText,
            cancelText: undefined,
            ...rest,
          },
        }),
      error: ({ title, description, confirmText = "OK", danger = true, ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "error",
            variant: "error",
            danger,
            confirmText,
            cancelText: undefined,
            ...rest,
          },
        }),
      warning: ({ title, description, confirmText = "OK", danger = true, ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "warning",
            variant: "warning",
            danger,
            confirmText,
            cancelText: undefined,
            ...rest,
          },
        }),
      info: ({ title, description, confirmText = "OK", danger = false, ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "info",
            variant: "info",
            danger,
            confirmText,
            cancelText: undefined,
            ...rest,
          },
        }),
      loading: ({ title, description, ...rest }) =>
        dispatch({
          type: "OPEN",
          payload: {
            title,
            description,
            type: "loading",
            variant: "loading",
            confirmText: "Please wait…",
            cancelText: undefined,
            loading: true,
            ...rest,
          },
        }),
    }),
    [close, dispatch],
  );

  return popup;
}

