// Configuration de l'API (Vite utilise import.meta.env)
const IS_DEV = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)
const API_ORIGIN = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'https://localhost:7054'
const DEFAULT_DB = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_DATABASE) || ''

export const API_CONFIG = {
  // URL du serveur backend (utilise le proxy Vite en dev)
  BASE_URL: IS_DEV ? '' : API_ORIGIN,

  // Timeout pour les requêtes
  TIMEOUT: 30000,

  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// Endpoints de l'API
export const API_ENDPOINTS = {
  login: `/api/login`,
  health: `/api/health`,
  logout: `/api/logout`,
  databases: `/api/databases`,
  
  miseplaces: '/api/miseplaces-by-bat',
  batiments: `/api/batiments`,
  batimentsAvecMiseplace: '/api/batiments-avec-miseplace',
  structures: `/api/structures`,
  inventory: `/api/inventory`,
  production: `/api/production`,
  validate: `/api/validate-day`,
  paramsouche: '/api/paramsouche',
  depot: '/api/depot',
  jourEnCours: '/api/Lot/jour-en-cours', // New endpoint for current day info
  lmvt: '/api/lmvt',
  stockEntry: '/api/stock-entry', // Endpoint pour l'entrée stock (POST - ajout)
  listeStockEntry: '/api/liste-stock-entry', // Endpoint pour la consultation/liste des bons d'entrée (GET)
  detailStockEntry: '/api/detail-stock-entry', // Endpoint pour les détails d'un bon d'entrée (GET, basé sur LBE)
  fournisseurs: '/api/fournisseurs', // Endpoint pour récupérer la liste des fournisseurs
  rapChairCentre: '/api/reports/rap_chair_centre', // Obsolète - utiliser reportsGenerate
  reportsGenerate: '/api/reports/generate', // Nouvel endpoint pour générer les rapports
  reportTypes: '/api/reports/types', // Endpoint obsolète - essayer /api/reports en GET
  reports: '/api/reports', // Endpoint pour récupérer les types de rapports (GET)
}

// Configuration Axios
// export const axiosConfig = {
//   baseURL: API_CONFIG.BASE_URL,
//   timeout: API_CONFIG.TIMEOUT,
//   headers: API_CONFIG.DEFAULT_HEADERS
// }

// Messages d'erreur en arabe
export const ERROR_MESSAGES = {
  401: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  404: 'الخادم غير متاح. يرجى التحقق من الاتصال',
  500: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً',
  NETWORK: 'لا يمكن الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت',
  UNKNOWN: 'خطأ غير متوقع. يرجى المحاولة مرة أخرى'
}
// Gestion de la base de données choisie et des en-têtes d'authentification
export const getDatabaseChoice = () => {
  return sessionStorage.getItem('database_choice') || DEFAULT_DB
}

export const setDatabaseChoice = (databaseCode) => {
  sessionStorage.setItem('database_choice', databaseCode)
}

export const buildAuthorizationHeader = (token) => {
  if (!token) return undefined
  const trimmed = String(token).trim()
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed : `Bearer ${trimmed}`
}

export const getAuthHeaders = () => {
  const databaseChoice = getDatabaseChoice()
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')

  const headers = { ...API_CONFIG.DEFAULT_HEADERS }
  if (databaseChoice) {
    headers['X-Database-Choice'] = databaseChoice
    // Ajoute des alias possibles si le backend utilise un autre nom
    headers['X-Database'] = databaseChoice
    headers['X-DB-Code'] = databaseChoice
  }
  // prioriser auth_token, puis user.token
  const storedToken = sessionStorage.getItem('auth_token') || user.token
  const authHeader = buildAuthorizationHeader(storedToken)
  if (authHeader) headers['Authorization'] = authHeader
  return headers
}
