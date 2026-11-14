// Centralized API configuration for Federated Learning Frontend
// In development, this defaults to localhost:5000.
// In production (Vercel/Netlify), set REACT_APP_API_URL or REACT_APP_BASE_URL in your hosting dashboard.

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL || "http://localhost:5000";

export default API_BASE_URL;
