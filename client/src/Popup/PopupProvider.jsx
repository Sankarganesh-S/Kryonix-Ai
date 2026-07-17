import { createContext, useCallback, useMemo, useReducer } from "react";

export const PopupContext = createContext(null);

const initialState = {
  open: false,
  title: undefined,
  description: undefined,
  content: undefined,
  children: undefined,
  size: "md", // sm | md | lg | fullscreen
  type: "info", // confirm | alert | success | error | warning | info | loading
  variant: "info", // internal styling/behavior
  danger: false,
  loading: false,
  icon: undefined,

  confirmText: "OK",
  cancelText: "Cancel",
  onConfirm: undefined,
  onCancel: undefined,

  footer: undefined,
  closeOnOutsideClick: false,
  closeOnEscape: true,
};

function reducer(state, action) {
  switch (action.type) {
    case "OPEN": {
      const payload = action.payload || {};
      const resolvedType = payload.type || payload.variant || "info";
      const variant = payload.variant || resolvedType;

      return {
        ...state,
        open: true,
        type: resolvedType,
        variant,
        title: payload.title,
        description: payload.description,
        content: payload.content,
        children: payload.children,
        size: payload.size || "md",
        danger: Boolean(payload.danger),
        loading: Boolean(payload.loading),
        icon: payload.icon,
        confirmText: payload.confirmText ?? state.confirmText,
        cancelText: payload.cancelText ?? state.cancelText,
        onConfirm: payload.onConfirm,
        onCancel: payload.onCancel,
        footer: payload.footer,
        closeOnOutsideClick: Boolean(payload.closeOnOutsideClick),
        closeOnEscape: payload.closeOnEscape ?? true,
      };
    }
    case "CLOSE":
      return { ...initialState };
    default:
      return state;
  }
}

export function PopupProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const close = useCallback(() => {
    dispatch({ type: "CLOSE" });
  }, []);

  const value = useMemo(() => ({ ...state, dispatch, close }), [state, close]);

  return <PopupContext.Provider value={value}>{children}</PopupContext.Provider>;
}

