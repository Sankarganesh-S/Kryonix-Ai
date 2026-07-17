# Kryonix-v3 Migration TODO

## Client migration (folder structure refactor)
- [ ] Step 1: Create new folders (beginner-friendly structure) without deleting anything
- [ ] Step 2: Add `client/src/AppProviders.jsx` and wire it into `client/src/main.jsx`
- [ ] Step 3: Update `client/src/Routers.jsx` imports to new locations (after moves)
- [ ] Step 4: Migrate auth feature (auth pages, AuthContext, ProtectedRoute)
- [ ] Step 5: Migrate chat feature (ChatPage + chat components)
- [ ] Step 6: Migrate admin feature (AdminPage + AdminRoute)
- [ ] Step 7: Migrate settings feature (SettingsPage + ImageEditorPage)
- [ ] Step 8: Split `client/src/utils/api.js` into feature-scoped api modules
- [ ] Step 9: Update all imports to point at split api modules
- [ ] Step 10: Delete old `client/src/utils/api.js` and `client/src/utils/api.test.js` only after build/tests pass
- [ ] Step 11: Remove old empty folders (only when nothing imports them)

## Verification
- [ ] After each step: run `npm run build` (client) and ensure it succeeds
- [ ] Fix/verify Vitest runtime so unit tests pass (current failures pre-migration)

