# 🎨 Client Documentation (Frontend)

This directory contains the source code for the **React Single Page Application (SPA)**. It is engineered for speed, responsiveness, and code maintainability.

## 🏛 Directory Structure

```text
client/
├── public/              # Static assets (favicons, manifest)
├── src/
│   ├── assets/          # Images and global styles
│   ├── components/      # Reusable UI Atoms and Molecules
│   │   ├── Sidebar.jsx      # Navigation & Storage Quota
│   │   ├── Breadcrumb.jsx   # Path Navigation Logic
│   │   ├── FileUpload.jsx   # Drag & Drop Zone
│   │   └── ...
│   ├── context/         # React Context (Global State)
│   │   └── authContext.jsx  # User Session Management
│   ├── layouts/         # Page Layout Wrappers
│   ├── pages/           # Route Views (Dashboard, Login, etc.)
│   ├── services/        # API Integration Layer (Fetch Wrappers)
│   ├── App.jsx          # Route Definitions
│   └── main.jsx         # Entry Point
└── package.json         # Dependency Manifest
```

---

## 🧩 Key Architecture Decisions

### 1. Component Design Pattern
We utilize a **Atomic Design** inspired approach. Small, reusable components (like `Searchbar`, `Breadcrumb`) are assembled into Page Views (`Dashboard`).
*   **Benefit**: changing the search bar style update it everywhere instantly.

### 2. Centralized API Service (`folderApi.js`)
Instead of making `fetch()` calls inside components, all network requests are abstracted into a service layer.
```javascript
// Example: The component doesn't need to know the endpoint URL
export const getFolders = async (token, parentId) => {
  // ...implementation details
}
```
*   **Benefit**: Easy to refactor backend URLs or switch to Axios/React Query without touching UI code.

### 3. Global Authentication State
Using **React Context API** (`authContext.jsx`), we provide the `user` object and `token` to the entire component tree.
*   **Mechanism**: On load, the app checks `localStorage` for a token. If valid, it hydrates the user state. If invalid, it redirects to Login via `ProtectedRoute`.

---

## ⚡ Performance Optimizations

1.  **Debounced Search**: The search input (`Searchbar.jsx`) uses debouncing to prevent API spamming while the user types.
2.  **Memoization**: Heavy computations (like sorting file lists) are memoized to prevent re-calculation on every render frame.
3.  **Lazy Loading**: The router supports lazy loading for non-critical routes (like `PublicView`) to reduce the initial bundle size.
4.  **Optimistic UI**: The UI updates instantly for actions like "Starring" a file, assuming success before the API responds, making the app feel native-fast.

---

## 🛠 Component Reference

### `Dashboard.jsx` (The Core)
This is the most complex component, handling:
*   **State**: `viewMode` (Grid/List), `sortBy`, `fileList`.
*   **Effects**: Fetches data whenever the URL `folderId` changes.
*   **Drag & Drop**: Implements `onDragStart`, `onDragOver`, `onDrop` handlers to allow visual file organization.

### `ShareModal.jsx`
A multi-tabbed modal handling complex business logic:
*   **Tab 1 (Invite)**: Checks email validity and sends invite via API.
*   **Tab 2 (Public Link)**: Generates unique tokens. Displays options for *Expiry* and *Password* if the backend supports it.
*   **Tab 3 (Manage)**: Lists current access holders with "Remove" capabilities.

---

## 🎨 Styling Philosophy

We use **TailwindCSS** for rapid development.
*   **Responsive**: Layouts use `flex-col` on mobile and `flex-row` on desktop (`lg:flex-row`).
*   **Interactive**: Extensive use of `hover:`, `focus:`, and `group-hover` states for polished UX.
*   **Consistent**: A defined color palette (Blue-600 primary, Gray-50 backgrounds) ensures professional aesthetics.
