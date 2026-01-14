# Cloud Storage Service (Labmentix Project 2)

A robust, full-stack cloud storage application similar to Google Drive, designed to provide a seamless and secure file management experience. Built with the MERN stack (PostgreSQL/Supabase variant), this project demonstrates modern web development practices including responsive design, secure authentication, and complex file operations.

## 🚀 Features at a Glance

### Core Functionality
*   **User Authentication**: Secure JWT-based Login and Registration system.
*   **File Management**:
    *   **Upload**: Drag & Drop interface with progress tracking.
    *   **Download**: Secure, signed URL downloads for files and ZIP downloads for folders.
    *   **Organize**: Rename, Move, and Delete files/folders.
*   **Folder System**: hierarchical structure with intuitive breadcrumb navigation.

### Advanced Features
*   **Drag & Drop Organization**: Move files and folders by dragging them into other folders.
*   **Smart Search**: Real-time search across all files and folders.
*   **Visual Organization**:
    *   **Grid/List Views**: Toggle between visual cards or detailed list layouts.
    *   **Sorting**: Order functionality by Name, Date, or Size.
*   **Productivity Tools**:
    *   **Starred**: Mark important items for quick access.
    *   **Recent**: Automatically tracks the 20 most recently created or modified files.
    *   **Trash**: Soft-delete system allowing item restoration or permanent deletion.
    *   **Storage Quota**: Visual indicator of storage usage (15GB limit simulated).

### Sharing & Collaboration
*   **Direct Sharing**: Invite registered users via email with `Viewer` or `Editor` roles.
*   **Public Links**: Generate shareable links for non-registered users.
    *   **Expiration**: Set optional expiry dates for links.
    *   **Password Protection**: Secure links with a password **(Database Schema Ready)**.

---

## 🛠️ Technology Stack Summary

### Frontend (Client)
A high-performance Single Page Application (SPA) built with:
*   **React 19**: The core framework.
*   **Vite**: For lightning-fast development and building.
*   **TailwindCSS**: For rapid, responsive styling.
*   **React Router v7**: For seamless client-side navigation.
*   **Lucide React**: For a consistent, modern icon system.

### Backend (Server)
A scalable REST API built with:
*   **Node.js & Express**: The server runtime and framework.
*   **Supabase**: Provides the PostgreSQL database and Blob Storage.
*   **BcryptJS & JWT**: For military-grade security in authentication.

---

## 🏁 Installation & Setup Guide

### prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [Git](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd <project-folder>
```

### Step 2: Backend Setup
 Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with your Supabase credentials:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-secure-random-secret-key
```

Start the backend server:
```bash
npm start
# OR for development with auto-reload
npm run dev
```
*The server will run on `http://localhost:5000`*

### Step 3: Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd ../client
npm install
```

Start the frontend application:
```bash
npm run dev
```
*The application will open at `http://localhost:5173`*

---

## � Detailed Documentation

For specific details on components, schema, and API endpoints, please refer to the dedicated READMEs:
*   [**Frontend Documentation**](./client/README.md): Detailed component breakdown.
*   [**Backend Documentation**](./backend/README.md): API routes and Database Schema.
