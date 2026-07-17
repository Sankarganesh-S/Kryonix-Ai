import { memo } from "react";

export default memo(function Button({
  variant = "primary", // primary | ghost | danger | link
  size = "md", // sm | md | lg
  className = "",
  disabled = false,
  type = "button",
  onClick,
  children,
  ...rest
}) {
  const cls = ["kry-btn", `kry-btn-${variant}`, `kry-btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
});

