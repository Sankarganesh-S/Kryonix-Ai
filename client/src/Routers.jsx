import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import AdminRoute from "./features/admin/AdminRoute";

const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/pages/RegisterPage"));
const OtpPage = lazy(() => import("./features/auth/pages/OtpPage"));
const ForgotPasswordPage = lazy(() => import("./features/auth/pages/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("./features/auth/pages/VerifyEmailPage"));
const ChatPage = lazy(() => import("./features/chat/pages/ChatPage"));
const AdminPage = lazy(() => import("./features/admin/pages/AdminPage"));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const ImageEditorPage = lazy(() => import("./features/settings/pages/ImageEditorPage"));


function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="kryonix-loader">
        <div className="kryonix-loader__ring" />
        <div className="kryonix-loader__core" />
      </div>
      <span className="route-loading__text">Kryonix AI is warming up…</span>
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
