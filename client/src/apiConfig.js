// Centralized API Base URL configuration
const envUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
export const API_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
