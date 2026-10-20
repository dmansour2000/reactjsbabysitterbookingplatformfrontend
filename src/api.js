const productionApiUrl =
  "https://nodejsbabysitterbookingplatformbackend.onrender.com";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5170" : productionApiUrl)
).replace(/\/$/, "");

export function apiUrl(path) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
