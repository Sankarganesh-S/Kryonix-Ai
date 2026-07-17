# TODO - Unify Popups

## Step 1: Inventory
- [x] Read current popup-related files (Popup.jsx, Popup.js, GlobalPopupProvider.jsx, ConfirmLogout.jsx, popup.css).
- [ ] Identify all usages of PopupManager / GlobalPopup / Popup.js / other popup components across the client.

## Step 2: Implement single global component
- [ ] Create `client/src/Popup/popup.js` (or `client/src/Popup/Popup.js` if already present) as the only public API.
- [ ] Ensure it supports: confirm dialogs, info dialogs, danger variants, loading state, custom icon, confirm/cancel.
- [ ] Provide a single React hook/API from `popup.js` to open dialogs.

## Step 3: Wire renderer
- [ ] Update `client/src/main.jsx` to render the single popup renderer once.

## Step 4: Delete / remove unused files
- [ ] Remove/stop importing old components: PopupManager.js, GlobalPopupProvider duplicates, ConfirmLogout component (replace usage with popup.js).
- [ ] Remove `client/src/Popup/PopupManager.js` if unused.
- [ ] Remove `client/src/components/common/GlobalPopup.jsx` if unused.

## Step 5: Update call sites
- [ ] Replace any usage of old popup APIs with the new `popup.js`.

## Step 6: Test/build
- [ ] Run `npm test` (if present) and `npm run build` for client.

