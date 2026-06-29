# Kryonix-v3 Fix/Improve TODO

## Plan confirmation
- [x] Gathered repo overview and inspected critical backend/frontend files.
- [x] Identified mobile sidebar issue likely due to missing CSS classes/JS state sync.

## Next steps
- [ ] Fix mobile sidebar not showing (ChatPage/Sidebar/CSS).
- [ ] Fix OTP/fetch endpoint mismatch risk and verify verifyOtp endpoint usage.
- [ ] Fix any streaming/patching bugs between `/chat/stream` and ChatPage.
- [ ] Add minimal backend tests (pytest) with mocks for Ollama/web search.
- [ ] Add minimal frontend smoke tests (Vitest/RTL) for chat render + auth/OTP navigation.
- [ ] Run backend + frontend lint/type checks (if available) and manual smoke test matrix.

