import { useEffect, useId, useMemo, useRef } from "react";
import { usePopupState } from "./internal";
import usePopup from "./usePopup";
import "./popup.css";

function getVariantKind(variant, type) {
  const v = String(variant || type || "info").toLowerCase();
  if (v.includes("confirm")) return "confirm";
  if (v.includes("loading")) return "loading";
  if (v.includes("alert")) return "alert";
  if (v.includes("success")) return "single";
  if (v.includes("error")) return "single";
  if (v.includes("warning")) return "single";
  if (v.includes("info")) return "single";
  return "single";
}

export function PopupRenderer() {
  const popup = usePopupState();
  const { close } = usePopup();

  const {
    open,
    title,
    description,
    content,
    children,
    size,
    type,
    variant,
    danger,
    loading,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    icon,
    footer,
    closeOnOutsideClick,
    closeOnEscape,
  } = popup;

  const titleId = useId();
  const descId = useId();
  const cardRef = useRef(null);

  const kind = useMemo(() => getVariantKind(variant, type), [variant, type]);
  const isConfirm = kind === "confirm";
  const showCancel = isConfirm && typeof onCancel === "function";

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => cardRef.current?.focus?.(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel?.();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, onCancel, close]);

  if (!open) return null;

  const closeOnOverlayClick = Boolean(closeOnOutsideClick);

  return (
    <div
      className="popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => {
        if (!closeOnOverlayClick) return;
        if (e.target === e.currentTarget) {
          onCancel?.();
          close();
        }
      }}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        className={`popup-card ${danger ? "danger" : ""} ${size}`}
      >
        <div className="popup-head">
          <div className="popup-icon">{icon || (danger ? "⚠" : "✨")}</div>
          <div className="popup-titles">
            {title && (
              <div id={titleId} className="popup-title">
                {title}
              </div>
            )}
            {description && (
              <div id={descId} className="popup-desc">
                {description}
              </div>
            )}
          </div>

          <button
            className="popup-close"
            onClick={() => {
              onCancel?.();
              close();
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {(content || children) && (
          <div className="popup-body">{content || children}</div>
        )}

        {footer && <div className="popup-footer">{footer}</div>}

        <div className="popup-actions">
          {isConfirm && showCancel && (
            <button
              className="popup-btn"
              disabled={loading}
              onClick={() => {
                onCancel?.();
                close();
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            className={`popup-btn primary ${danger ? "danger" : ""}`}
            disabled={loading}
            onClick={() => {
              onConfirm?.();
              close();
            }}
          >
            {loading ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

