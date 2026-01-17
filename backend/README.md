# ⚙️ Server-Side Documentation

**Scope**: This directory contains the source code for the RESTful API service. It acts as the secure intermediary between the client applications and the data layer.

## 🏛 Directory Structure

The backend follows the **Model-View-Controller (MVC)** architectural pattern to ensure code modularity.

```text
backend/
├── config/             # Database connection & Environment config
├── controller/         # Business Logic & Request handling
│   ├── file.Controller.js    # Uploads, Metadata, Listing
│   ├── share.Controller.js   # Permission & Link logic
│   └── user.Controller.js    # Auth & Quota logic
├── middleware/         # Interceptors (Auth, Logging)
├── routes/             # API Endpoint definitions
├── utils/              # Helpers (JWT generation, formatters)
└── server.js           # Entry point
```

---

## 💾 Database Schema

The system uses **PostgreSQL** hosted on Supabase. Interactions are handled via the `supabase-js` client, but the underlying structure is strict SQL.

### Core Tables

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| **`users`** | Identity store (managed by Auth). | `id` (UUID), `email`, `last_sign_in` |
| **`folders`** | Recursive folder structure. | `id`, `name`, `parent_id` (Self-ref FK), `owner_id` |
| **`files`** | File metadata registry. | `id`, `size`, `type`, `storage_path`, `folder_id` |
| **`shares`** | Internal Permissions (RBAC). | `resource_id`, `grantee_id`, `role` (viewer/editor) |
| **`link_shares`** | Public Share Tokens. | `token` (Index), `password_hash`, `expires_at` |

---

## 🔐 Security Architecture

### 1. Authentication Strategy
*   **JWT (JSON Web Tokens)**: We use stateless authentication. On login, the server issues a signed JWT containing the user's UUID and email.
*   **Middleware Protection**: The `auth.Middleware.js` intercepts every protected route, verifies the token signature, and attaches the user context to the request object.

### 2. Password Security (Bcrypt)
For **Public Shared Links**, we implemented a custom password protection flow:
1.  **Hashing**: When a user sets a password, we hash it using `bcryptjs` (Salt Rounds: 10).
2.  **Storage**: Only the hash is stored in the `link_shares` table.
3.  **Verification**: When a visitor enters a password, the server compares the input against the stored hash. Timing-safe comparison is used to prevent side-channel attacks.

### 3. Authorization (RLS)
Even if the API were bypassed, the database layer enforces **Row Level Security**.
*   *Policy*: Users can only `SELECT` rows where `owner_id` matches their auth UID.
*   *Policy*: Shared resources are accessible if a record exists in the `shares` table linking the resource to the user.

---

## 🔌 API Reference

### File Management (`/api/files`)
*   **`GET /`**: List files. Supports advanced querying.
    *   *Query Param* `sortBy`: Sort by `name`, `size`, `created_at`.
    *   *Query Param* `order`: `asc` or `desc`.
    *   *Query Param* `filterType`: `image`, `video`, `document`.
*   **`POST /`**: Upload file metadata (File binary goes to Storage Bucket directly).
*   **`PUT /:id`**: Rename a file.

### Folder Management (`/api/folders`)
*   **`GET /`**: List folders. Returns hierarchical adjacency list.
*   **`POST /`**: Create a new folder. Optional `parent_id` to nest it.

### Sharing (`/api/shares`)
*   **`POST /link`**: Create a secure public link.
    *   *Body*: `{ resourceId, password, expiresAt }`
*   **`GET /public/:token/items`**: Resolve a public link.
    *   *Header*: `x-share-password` (Required if link is protected).

### User (`/api/user`)
*   **`GET /storage`**: Get quota usage.
    *   **Logic**: Returns Total vs Used bytes. Custom logic applies 2TB limit for Admin accounts (`ansari@gmail.com`).

---

## 📦 Dependencies

*   **Runtime**: Node.js v18+
*   **Framework**: Express.js
*   **Database Client**: @supabase/supabase-js
*   **Encryption**: bcryptjs
*   **Environment**: dotenv
*   **Security**: helmet, cors
