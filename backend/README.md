# ⚙️ Server Documentation (Backend)

This directory hosts the **RESTful API** built on Node.js and Express. It serves as the secure gateway between the Client and the Database/Storage Infrastructure.

## 💾 Database Schema (PostgreSQL)

The database is normalized to 3rd Normal Form (3NF) to ensure data integrity.

### Entity Relationship Diagram (Conceptual)
*   **User** `1:N` **Folders** (A user owns multiple folders)
*   **User** `1:N` **Files** (A user owns multiple files)
*   **Folder** `1:N` **Files** (A folder contains files)
*   **Folder** `1:N` **Folder** (Recursive: Folders can contain folders)
*   **User/Resources** `M:N` **Shares** (Users can have access to resources owned by others)

### Key Tables
1.  **`users`**: Authentication credentials (managed mostly by Supabase Auth).
2.  **`profiles`**: Public user metadata (Display Name, Avatar).
3.  **`folders`**:
    *   `id` (PK), `name`, `parent_id` (FK -> folders.id), `owner_id` (FK -> users.id).
4.  **`files`**:
    *   `id` (PK), `name`, `size`, `mime_type`, `storage_path`, `folder_id` (FK), `owner_id` (FK).
5.  **`link_shares`**:
    *   `token` (Unique Index), `resource_id`, `expires_at`, `password_hash`.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.
Most endpoints require the `Authorization: Bearer <token>` header.

### 1. Authentication (`/auth`)
| Endpoint | Method | Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `/register` | `POST` | `{ email, password, fullName }` | Creates new user. |
| `/login` | `POST` | `{ email, password }` | Returns JWT Token. |

### 2. File Operations (`/files`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/upload` | `POST` | Saves file metadata after storage upload. |
| `/:id` | `PUT` | Rename file. |
| `/:id` | `DELETE` | Soft delete (move to trash). |
| `/recent` | `GET` | **Algorithm**: Queries `created_at` DESC limit 20. |

### 3. Sharing System (`/shares`)
| Endpoint | Method | Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `/link` | `POST` | `{ resourceId, expiresAt, password }` | Creates Public Link. |
| `/public/:token` | `GET` | `None` | Resolves a public link token to a resource. |
| `/invite` | `POST` | `{ email, resourceId, role }` | Grants specific user access. |

---

## 🛡 Security Measures

### Request Validation
*   Incoming requests are validated for data types (e.g., preventing NoSQL injection or payload pollution).
*   **Middleware**: `auth.Middleware.js` intercepts every protected request to verify the JWT signature before any controller logic executes.

### File Security
*   **Storage**: Files are NOT stored on the server disk. They are streamed directly to Supabase Storage Buckets.
*   **Access**: Files use **Signed URLs**. A file URL is valid only for 60 seconds, preventing unauthorized sharing of direct links.

### Password Security
*   **Bcrypt**: Shared link passwords are hashed with a salt round of 10. `bcrypt.compare()` is used during link access validation.

---

## 📦 Dependencies

*   **Runtime**: Node.js
*   **Framework**: Express
*   **ORM/DB Client**: @supabase/supabase-js
*   **Security**: cors, helmet (recommended), bcryptjs, jsonwebtoken
*   **Utils**: dotenv, archiver (for ZIP downloads)

---

