export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  CHAT_DETAIL: "/chat/:chatId",
  SETTINGS: "/settings",
  IMAGE_EDITOR: "/image-editor",
  ADMIN: "/admin",
  LOGIN: "/login",
  REGISTER: "/register",
  OTP: "/otp",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",
};

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.OTP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.VERIFY_EMAIL,
];

export const PROTECTED_ROUTES = [
  ROUTES.CHAT,
  ROUTES.CHAT_DETAIL,
  ROUTES.SETTINGS,
  ROUTES.IMAGE_EDITOR,
];

export const ADMIN_ROUTES = [ROUTES.ADMIN];
