import { memo } from "react";

export default memo(function Input({
  className = "",
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  ...rest
}) {
  return (
    <label className={["kry-input-wrap", className].filter(Boolean).join(" ")}>
      {label && <div className="kry-input-label">{label}</div>}
      <input
        className="kry-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...rest}
      />
      {hint && <div className="kry-input-hint">{hint}</div>}
    </label>
  );
});

