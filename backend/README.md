# Backend (Server) - Detailed Documentation

This directory contains the Node.js/Express server that powers the Cloud Storage Service API. It handles all business logic, database interactions, and file storage operations.

## 📚 Libraries & Dependencies

*   **`express` (^5.2.1)**: The core web server framework for handling HTTP requests and routing.
*   **`@supabase/supabase-js` (^2.90.1)**: The official client for interacting with the Supabase PostgreSQL database and Storage Buckets.
*   **`dotenv` (^17.2.3)**: Loads environment variables (API keys, secrets) from the `.env` file for security.
*   **`cors` (^2.8.5)**: Enables Cross-Origin Resource Sharing, allowing the frontend (on a different port) to communicate with this API.
*   **`jsonwebtoken` (^9.0.3)**: Generates and verifies secure "tokens" for user authentication (Stateless auth).
*   **`bcryptjs` (^3.0.3)**: A library to hash passwords securely. We use this to hash passwords for Public Links.
*   **`archiver` (^7.0.1)**: A powerful library to create `.zip` files on the fly. Used when a user downloads an entire folder.

---

## 📂 File Structure

### `controller/`
Contains the logic for each route.
*   **`user.Controller.js`**: Handles Registration and Login. Generates JWTs.
*   **`folder.Controller.js`**: Logic for Creating folders, Fetching contents, and Getting breadcrumb paths.
*   **`file.Controller.js`**: Logic for Uploading file metadata, Renaming, Moving, and Deleting files.
*   **`share.Controller.js`**: Manages User-to-User sharing and Public Link generation/resolving.
*   **`star.Controller.js`**: Toggles the "starred" status of items.
*   **`trash.Controller.js`**: Fetches deleted items and handles Restore/Permanent Delete.
*   **`search.Controller.js`**: Performs fuzzy search queries against the database.
*   **`download.Controller.js`**: Generates signed download URLs for files and streams ZIP archives for folders.

### `routes/`
Maps HTTP endpoints to Controllers.
*   `files.Route.js`, `folder.Route.js`, `user.Route.js`, `share.Route.js`, etc. (Self-explanatory mapping).

### `middleware/`
*   **`auth.Middleware.js`**: The `protect` function. It intercepts requests, checks for a valid JWT in the headers, verifies it, and attaches the user to `req.user`. If invalid, sends 401 Unauthorized.

---

## 🔌 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Create account. Returns Token. |
| POST | `/api/auth/login` | Login. Returns Token + User Info. |

### Folders
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/folders` | Create a folder (Body: name, parentId). |
| GET | `/api/folders/:parentId` | Get contents of a folder. |
| GET | `/api/folders/:id/path` | Get parent hierarchy for breadcrumbs. |
| PUT | `/api/folders/:id` | Rename folder. |
| PUT | `/api/folders/move` | Move folder (Body: folderId, targetId). |
| DELETE | `/api/folders/:id` | Move folder to Trash. |

### Files
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/files/upload` | Save file metadata after storage upload. |
| GET | `/api/files/recent` | Get 20 most recent files. |
| PUT | `/api/files/:id` | Rename file. |
| PUT | `/api/files/move` | Move file. |
| DELETE | `/api/files/:id` | Move file to Trash. |

### Sharing
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/shares` | Invite user (Body: email, resourceId, role). |
| POST | `/api/shares/link` | Create Public Link (Body: expiresAt, password). |
| GET | `/api/shares/me` | Get items shared with me. |
| GET | `/api/shares/public/:token` | Get resource info from public token. |

### Other
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/search` | Search items (Query: ?query=xyz). |
| POST | `/api/star/toggle` | Star/Unstar an item. |
| GET | `/api/trash` | Get trash contents. |

---

## 🗄️ Database Schema

The backend is built on **Supabase (PostgreSQL)**.

1.  **`users`**: (Managed by Supabase Auth).
2.  **`folders`**:
    *   `id` (UUID), `name`, `parent_id` (Self-ref), `owner_id` (User), `is_deleted` (Bool), `is_starred` (Bool).
3.  **`files`**:
    *   `id` (UUID), `name`, `size`, `type`, `url` (Storage path), `folder_id` (Ref), `owner_id`, `is_deleted`, `is_starred`.
4.  **`shares`**:
    *   `id`, `resource_id`, `resource_type` ('file'/'folder'), `grantee_email`, `role`, `owner_id`.
5.  **`link_shares`**:
    *   `id`, `token` (Unique), `resource_id`, `resource_type`, `password_hash`, `expires_at`.

This schema ensures referential integrity and allows for complex querying like "Get all contents of Folder X owned by User Y that are not deleted."
