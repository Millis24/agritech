// src/lib/getBaseUrl.ts
export const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'https://agritech-crm.it/api';
};