# 🎨 Client-Side Documentation

**Scope**: This directory contains the **React Single Page Application (SPA)**. It is engineered for high performance, responsiveness, and a premium user experience (UX).

## 🏛 Application Architecture

The frontend is built using a **Component-Based Architecture**, focusing on reusability and separation of concerns.

### Key Libraries & Tools
*   **React 19**: Leveraging the latest concurrent features for smooth rendering.
*   **Vite**: Next-generation bundler for instant dev server start and optimized production builds.
*   **TailwindCSS**: Utility-first styling for consistent design tokens and responsive layouts.
*   **Lucide React**: Modern, lightweight SVG icon library.
*   **Axios / Fetch**: For communicating with the API Gateway.

---

## 🧩 Component Breakdown

The `src/components/` directory houses our reusable UI building blocks.

### 1. `Sidebar.jsx` (Navigation & Quota)
*   **Function**: Handles global navigation and displays persistent storage usage.
*   **Key Feature**: **Dynamic Quota Formatter**.
    *   It accepts raw bytes from the backend and automatically converts them to the most readable unit (`1024 B` -> `1 KB`, `1048576 B` -> `1 MB`).
    *   Visual progress bar changes color (Blue -> Red) as the user approaches their limit.

### 2. `Dashboard.jsx` (File Explorer)
*   **Function**: The detailed view for browsing files and folders.
*   **Key Features**:
    *   **View Toggle**: Users can switch between a visual **Grid View** (cards) and a data-rich **List View** (table).
    *   **Context Aware**: The view updates automatically based on sorting filters selected in the top bar.

### 3. `ShareModal.jsx` (Access Control)
*   **Function**: A unified interface for all sharing operations.
*   **Business Logic**:
    *   **Tab 1 (Invite)**: Checks email validity and sends internal invites.
    *   **Tab 2 (Public Link)**: Provides UI controls for setting **Passwords** and **Expiration Dates**. It handles the encryption of the password client-side before sending it to the API.

---

## ⚛️ State Management

We utilize **React Context API** to manage global application state without "prop drilling".

*   **`AuthContext`**: 
    *   Persists the JWT token in `localStorage`.
    *   Provides the `user` object and `login/logout` methods to the entire component tree.
    *   Protects private routes (redirects to Login if token is missing).

---

## ⚡ Performance Optimizations

1.  **Code Splitting**: Routes are lazy-loaded to ensure the initial bundle size remains small.
2.  **Debouncing**: The Search Bar waits for 300ms of user inactivity before triggering an API call, reducing server load.
3.  **Optimistic UI Updates**: When a user "Stars" a file, the UI updates instantly while the request processes in the background, making the app feel responsive.

---

## 🚀 Development Setup

To start the frontend development environment:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Configuration** (`.env`):
    ```env
    VITE_API_URL=http://localhost:5000/api
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_KEY=your_public_key
    ```
3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
