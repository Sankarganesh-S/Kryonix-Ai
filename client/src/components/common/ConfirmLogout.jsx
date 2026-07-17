import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { usePopup } from "../../Popup";

import { useAuth } from "../../context/AuthContext";

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

  // Keep signature stable; popup system owns open/close state.
  const onCancel = useCallback(() => {}, []);

  return (
    <Button
      className={className}
      variant={buttonVariant}
      size={buttonSize}
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
    </Button>
  );
}

