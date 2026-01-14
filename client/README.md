# Client (Frontend) - Detail Documentation

This directory contains the React-based frontend application for the Cloud Storage Service. It is designed to be responsive, interactive, and user-friendly.

## 📚 Libraries & Dependencies

We use a modern stack to ensure performance and developer experience.

### Core
*   **`react` (^19.2.0)**: The library for building user interfaces.
*   **`react-dom` (^19.2.0)**: React package for working with the DOM.
*   **`vite` (^7.2.4)**: Next-generation frontend tooling. fast build times.

### Routing & Navigation
*   **`react-router-dom` (^7.12.0)**: Handles declarative routing, URL parameters (`/folder/:id`), and protected route logic.

### Styling & UI
*   **`tailwindcss` (^3.4.19)**: Utility-first CSS framework for custom designs without writing CSS files.
*   **`lucide-react` (^0.562.0)**: A clean, consistent icon library used throughout the application (e.g., Folder, File, Trash, Star icons).
*   **`autoprefixer` & `postcss`**: Tools for parsing CSS and adding vendor prefixes.

### Utilities
*   **`@supabase/supabase-js` (^2.90.1)**: Used for specific direct interactions with storage buckets where needed.

---

## 📂 File Structure & Components

### `src/components/`
Reusable UI building blocks.

*   **`Layout.jsx`**: The main wrapper for the dashboard. It manages the responsive structure, holding the `Sidebar` and the main content area.
*   **`Sidebar.jsx`**: The collapsible side navigation. Displays links to *My Drive*, *Recent*, *Starred*, *Shared*, and *Trash*. Also shows the storage usage bar.
*   **`Header.jsx`**: The top bar containing the `Searchbar` and User Profile/Logout actions.
*   **`Breadcrumb.jsx`**: Shows the current path (e.g., `My Drive > Work > Project`). Clickable links allow quick navigation up the tree.
*   **`Searchbar.jsx`**: An input component that triggers a global search for files/folders.
*   **`FileUpload.jsx`**: A drop-zone component. Users can drag files here or click to open the file dialog. Handles the upload progress UI.
*   **`CreateFolder.jsx`**: An input group to type a new folder name and create it.
*   **`ShareModal.jsx`**: A complex modal with tabs for:
    *   **Invite**: Share via email.
    *   **Public Link**: Generate links with Date/Password options.
    *   **Manage**: Remove access for users.
*   **`FileViewerModal.jsx`**: A modal to preview files (Images, Text) without downloading them.
*   **`MoveModal.jsx`**: A minimal file explorer allowing users to select a destination folder for moving items.
*   **`CreateFileModal.jsx`**: A text editor modal for creating new `.txt` files directly in the browser.
*   **`Modals.jsx`**: Contains generic `ConfirmModal` (for dangerous actions like delete) and `InputModal` (for renaming).
*   **`ProtectedRoute.jsx`**: A wrapper component that checks if a user is logged in. If not, it redirects to `/login`.

### `src/pages/`
Top-level views corresponding to routes.

*   **`Dashboard.jsx`**: The main logic hub.
    *   Fetches Folders/Files.
    *   Handles View Mode (Grid/List) & Sorting.
    *   Implements Drag & Drop logic.
    *   Renders the main grid of items.
*   **`Login.jsx`**: User login form with email/password.
*   **`Register.jsx`**: New user registration form.
*   **`Recent.jsx`**: A dedicated view showing the 20 most recently modified files.
*   **`Starred.jsx`**: Displays only items that have been "starred" by the user.
*   **`TrashFiles.jsx`**: Displays deleted items. Allows "Restore" or "Delete Forever".
*   **`share.jsx`**: Known as "Shared with me". Shows files/folders other users have shared with you.
*   **`PublicView.jsx`**: A standalone page for external users accessing content via a public link (does not require login).

### `src/services/`
*   **`folderApi.js`**: A centralized service file containing all `fetch` calls to the backend API. This keeps API logic separate from UI components.

### `src/context/`
*   **`authContext.jsx`**: Uses React Context API to manage the User's session state (Token, User Info) globally across the app.

---

## 🌟 detailed Features

1.  **Drag and Drop Movement**:
    *   Implemented in `Dashboard.jsx`.
    *   Uses HTML5 Drag and Drop API.
    *   Files and Folders can be dragged onto other Folder cards to move them.
    *   Target folders highlight blue when hovered.

2.  **View Modes**:
    *   **Grid View**: Large icons, good for visual scanning.
    *   **List View**: Compact rows, shows detailed metadata (Date, Size) in columns.

3.  **Search System**:
    *   Debounced search input searches both Files and Folders.
    *   Results update in real-time.

4.  **Security**:
    *   Routes are protected by `ProtectedRoute`.
    *   JWT tokens are stored in `localStorage` and sent with every API request.
