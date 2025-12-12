import axios from "axios";
import { API_CONFIG, getAuthHeaders, getDatabaseChoice } from "../config/api.js";

// ⚡ Instance Axios configurée
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
  withCredentials: true,
});

// 🔹 Intercepteur pour ajouter les en-têtes et le choix de DB
api.interceptors.request.use(
  (config) => {
    // 1. Ajout des headers custom
    const headers = getAuthHeaders();
    config.headers = { ...config.headers, ...headers };

    // 2. Ajout du choix de base de données en paramètre
    // Exclure certains endpoints qui n'acceptent pas le paramètre database en query string
    const endpointsWithoutDatabaseParam = [
      '/api/reports', // Endpoint GET pour récupérer les types de rapports (utilise uniquement les headers)
    ];
    
    // Endpoints qui utilisent databaseName au lieu de database
    const endpointsWithDatabaseName = [
      '/api/reports/types', // Utilise databaseName comme paramètre
    ];
    
    const shouldExcludeDatabaseParam = endpointsWithoutDatabaseParam.some(endpoint => 
      config.url && config.url.includes(endpoint)
    );
    const shouldUseDatabaseName = endpointsWithDatabaseName.some(endpoint => 
      config.url && config.url.includes(endpoint)
    );
    
    const db = getDatabaseChoice();
    if (db) {
      const existingParams = config.params || {};
      
      if (shouldUseDatabaseName) {
        // Pour /api/reports/types, utiliser databaseName
        if (existingParams.databaseName == null) {
          config.params = { ...existingParams, databaseName: db };
        }
      } else if (!shouldExcludeDatabaseParam) {
        // Pour les autres endpoints, utiliser database
        if (existingParams.database == null && existingParams.db == null) {
          config.params = { ...existingParams, database: db };
        }
      }
    }

    // 3. Ajout automatique du token JWT si manquant
    if (!config.headers.Authorization) {
      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Erreur 401 : token invalide ou expiré (JWT)");
      // Clear the token from storage
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;