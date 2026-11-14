// Centralized API configuration for Federated Learning Frontend
let rawUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL || "http://localhost:5000";

// Ensure URL starts with https:// or http:// if missing
if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
  rawUrl = `https://${rawUrl}`;
}

// Remove trailing slash if present
const API_BASE_URL = rawUrl.replace(/\/+$/, "");

export default API_BASE_URL;
