import { createContext, useContext, useState, useCallback } from "react";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const TK = "kryonix_token";
const UK = "kryonix_user";

const Ctx = createContext(null);

const readStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures such as private mode or quota issues.
  }
};

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures such as private mode or quota issues.
  }
};

const parseJsonBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: "The server returned an invalid response." };
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStorage(TK));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = readStorage(UK);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const save = (t, u) => {
    writeStorage(TK, t);
    writeStorage(UK, JSON.stringify(u));
    setToken(t);
    setUser(u);
  };
  const clear = () => {
    removeStorage(TK);
    removeStorage(UK);
    setToken(null);
    setUser(null);
  };

  const register = useCallback(async (email, username, password, adminSecret) => {
    setLoading(true);
    setError(null);
    try {
      const body = { email, username, password };
      if (adminSecret) body.admin_secret = adminSecret;
      const r = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Registration failed");
      if (d.requires_otp)
        return { ok: true, requires_otp: true, email, message: d.message };
      save(d.access_token, d.user);
      return { ok: true, requires_otp: false };
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Login failed");
      if (d.requires_otp)
        return { ok: true, requires_otp: true, email, message: d.message };
      save(d.access_token, d.user);
      return { ok: true, requires_otp: false };
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (email, otp, endpoint = "/auth/verify-otp") => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Invalid OTP");
        save(d.access_token, d.user);
        return { ok: true };
      } catch (e) {
        setError(e.message);
        toast.error(e.message);
        return { ok: false, error: e.message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const resendOtp = useCallback(async (email) => {
    try {
      const response = await fetch(`${API}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJsonBody(response);
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Unable to resend OTP");
      }
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to resend OTP";
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to refresh user");
      save(token, d);
    } catch {
      // ignore refresh failures
    }
  }, [token]);

  const logout = useCallback(() => {
    clear();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        setError,
        register,
        login,
        verifyOtp,
        resendOtp,
        refreshUser,
        logout,
        API,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
