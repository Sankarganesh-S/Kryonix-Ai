import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const OtpPage = lazy(() => import("./pages/OtpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ImageEditorPage = lazy(() => import("./pages/ImageEditorPage"));

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="auth-spinner" />
      <span>Loading Kryonix AI…</span>
    </div>
  );
}

export default function Routers() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:chatId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/image-editor"
        element={
          <ProtectedRoute>
            <ImageEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Suspense>
  );
}
