import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

import { Sparkles, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export default function OtpPage() {
  const { verifyOtp, resendOtp, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, purpose } = location.state || {};
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");
  const refs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/login");
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[i] = val.slice(-1);
    setDigits(newDigits);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (newDigits.every((d) => d) && val) {
      submitOtp(newDigits.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      submitOtp(pasted);
    }
  };

  const submitOtp = async (otp) => {
    setError(null);
    const endpoint =
      purpose === "login" ? "/auth/login-otp" : "/auth/verify-otp";
    const result = await verifyOtp(email, otp, endpoint);
    if (result.ok) navigate("/chat");
    else setDigits(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
  };

  const handleResend = async () => {
    setResendMsg("");
    const r = await resendOtp(email);
    if (r.ok) {
      setResendMsg("OTP resent! Check your email.");
      setResendCooldown(60);
    } else setResendMsg("Failed to resend. Try again.");
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo" style={{ justifyContent: "center" }}>
          <div className="auth-logo-icon">
            <Sparkles size={22} />
          </div>
          <span className="auth-logo-text">Kryonix AI</span>
        </div>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "rgba(124,110,245,.12)",
            border: "1px solid rgba(124,110,245,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ShieldCheck size={28} color="#7c6ef5" />
        </div>

        <h1 className="auth-heading">Verify your identity</h1>
        <p className="auth-sub" style={{ marginBottom: 8 }}>
          We sent a 6-digit OTP to
        </p>
        <p
          style={{
            color: "#a78bfa",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          {email}
        </p>

        {error && (
          <div className="auth-alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {resendMsg && (
          <div className="auth-success" style={{ marginBottom: 16 }}>
            <span>{resendMsg}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginBottom: 28,
          }}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 48,
                height: 56,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "monospace",
                background: d ? "rgba(124,110,245,.12)" : "var(--bg3)",
                border: `2px solid ${d ? "#7c6ef5" : "var(--border)"}`,
                borderRadius: 12,
                color: "var(--text)",
                outline: "none",
                transition: "all .15s",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => submitOtp(digits.join(""))}
          disabled={digits.some((d) => !d) || loading}
          className="auth-btn"
          style={{ width: "100%" }}
        >
          {loading ? <span className="auth-spinner" /> : "Verify OTP"}
        </button>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Didn't receive it?
          </span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: resendCooldown > 0 ? "var(--muted)" : "#a78bfa",
              fontSize: 14,
              fontWeight: 600,
              cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RefreshCw size={13} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}

