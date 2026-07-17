import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import usePopup from "../../Popup/usePopup";

import { useAuth } from "../../features/auth/AuthContext";

export default function ConfirmLogout({
  className,
  buttonVariant = "ghost",
  buttonSize = "md",
  icon,
  buttonText = "Logout",
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const popup = usePopup();

  const onCancel = useCallback(() => {}, []);

  return (
    <button
      className={className}
      data-variant={buttonVariant}
      data-size={buttonSize}
      type="button"
      onClick={() =>
        popup.confirm({
          title: "Logout?",
          description: "You will be signed out of your account.",
          danger: true,
          confirmText: buttonText,
          cancelText: "Cancel",
          onCancel,
          onConfirm: () => {
            logout();
            navigate("/login");
          },
        })
      }
    >
      {icon}
    </button>
  );
}
