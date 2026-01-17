const API = "https://project-2-cloud-based-storage-service-web.onrender.com/api/folders";

const getHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

export const createFolder = async (token, name, parentId) => {
  const res = await fetch(API, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ name, parent_id: parentId }) // API uses snake_case, JS uses camelCase
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create folder");
  }

  return res.json();
};

export const getFolders = async (token, parentId) => {
  const url = `${API}?parent_id=${parentId ?? ""}`;
  const res = await fetch(url, {
    headers: getHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch folders");
  }

  return res.json();
};

export const getRecentFiles = async (token) => {
  const response = await fetch(`${API_URL}/files/recent`, {
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error("Failed to fetch recent files");
  return response.json();
};

export const getBreadcrumbs = async (token, folderId) => {
  if (!folderId) return [];

  const res = await fetch(`${API}/${folderId}/path`, {
    headers: getHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch breadcrumbs");
  }

  return res.json();
};

export const saveFileMetadata = async (token, fileData) => {
  const response = await fetch("https://project-2-cloud-based-storage-service-web.onrender.com/api/files", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(fileData)
  });
  if (!response.ok) {
    throw new Error("Failed to save file")
  }
  return response.json();
};

export const getFiles = async (token, parentId) => {
  const url = `https://project-2-cloud-based-storage-service-web.onrender.com/api/files?parent_id=${parentId ?? 'null'}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(token)
  });
  if (!response.ok) {
    throw new Error("Failed to fetch files")
  }
  return response.json();
};

export const renameFolder = async (token, folderId, newName) => {
  const response = await fetch(`${API}/${folderId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ name: newName })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to rename folder");
  }
  return response.json();
};

export const deleteFolder = async (token, folderId) => {
  const response = await fetch(`${API}/${folderId}`, {
    method: "DELETE",
    headers: getHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete folder");
  }
  return response.json();
};

export const moveFolder = async (token, folderId, targetParentId) => {
  const response = await fetch(`${API}/${folderId}/move`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ parent_id: targetParentId })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to move folder");
  }
  return response.json();
};

export const moveFile = async (token, fileId, parentId) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/files/${fileId}/move`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ parent_id: parentId })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to move file");
  }
  return response.json();
};

export const toggleStar = async (token, resourceId, resourceType) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/stars/toggle`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ resourceId, resourceType })
  });
  if (!response.ok) throw new Error("Failed to toggle star");
  return response.json();
};

export const getStarred = async (token) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/stars`, {
    method: "GET",
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error("Failed to fetch starred items");
  return response.json();
};

export const renameFile = async (token, fileId, newName) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/files/${fileId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ name: newName })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to rename file");
  }
  return response.json();
};

export const deleteFile = async (token, fileId) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/files/${fileId}`, {
    method: "DELETE",
    headers: getHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete file");
  }
  return response.json();
};

export const shareResource = async (token, email, resourceId, resourceType, role) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/shares`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ email, resourceId, resourceType, role })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to share resource");
  }
  return response.json();
};

export const searchResources = async (token, query) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/search?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: getHeaders(token)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to search");
  }
  return response.json();
};

export const getSharedWithMe = async (token) => {
  const response = await fetch("https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/me", {
    method: "GET",
    headers: getHeaders(token)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch shared items");
  }
  return response.json();
};

export const createPublicLink = async (token, resourceId, resourceType, expiresAt, password) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/link`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ resourceId, resourceType, expiresAt, password })
  });
  if (!response.ok) throw new Error("Failed to create public link");
  return response.json();
};

export const getPublicResource = async (token) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/public/${token}`);
  if (!response.ok) throw new Error("Link invalid or expired");
  return response.json();
};

export const getPublicContents = async (token) => {
  const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/shares/public/${token}/items`);
  if (!response.ok) throw new Error("Failed to load items");
  return response.json();
};

export const getStorageUsage = async (token) => {
  const response = await fetch("https://project-2-cloud-based-storage-service-web.onrender.com/api/user/storage", {
    method: "GET",
    headers: getHeaders(token)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch storage usage");
  }
  return response.json();
};
