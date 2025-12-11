import api from "./api"
import { API_ENDPOINTS } from "../config/api"

// Fonction pour décoder le token JWT et extraire les données
const decodeJWT = (token) => {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Ajouter le padding si nécessaire pour base64
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const decoded = JSON.parse(atob(base64))
    return decoded
  } catch (error) {
    console.error('Erreur lors du décodage du JWT:', error)
    return null
  }
}

// Fonction pour récupérer la société depuis le token JWT ou l'objet user
const getSociete = () => {
  // 1. Essayer depuis l'objet user (toutes les variantes possibles)
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')
  const societeFromUser = user.societe || user.societeCode || user.Societe || user.SocieteCode || 
                          user.company || user.companyCode || user.Company || user.CompanyCode || 
                          user.soc || user.Soc || user.SOC || user.SOCIETE || ''
  
  if (societeFromUser) {
    console.log('✅ Société trouvée dans user:', societeFromUser)
    return societeFromUser
  }
  
  // 2. Essayer depuis database_choice (peut être le code de la société)
  const databaseChoice = sessionStorage.getItem('database_choice') || ''
  if (databaseChoice) {
    console.log('✅ Utilisation de database_choice comme société:', databaseChoice)
    return databaseChoice
  }
  
  // 3. Essayer depuis le token JWT
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || user.token
  if (token) {
    const decoded = decodeJWT(token)
    if (decoded) {
      console.log('🔍 Token JWT décodé:', decoded)
      const societeFromToken = decoded.societe || decoded.societeCode || decoded.Societe || decoded.SocieteCode ||
                               decoded.company || decoded.companyCode || decoded.Company || decoded.CompanyCode ||
                               decoded.soc || decoded.Soc || decoded.SOC || decoded.SOCIETE ||
                               decoded.database_choice || decoded.databaseChoice || decoded.database || ''
      if (societeFromToken) {
        console.log('✅ Société trouvée dans token JWT:', societeFromToken)
        return societeFromToken
      }
    }
  }
  
  console.warn('⚠️ Aucune société trouvée. User:', user, 'Token disponible:', !!token)
  return ''
}

export const fetchParamsoucheReports = async ({ fromDate, toDate, signal } = {}) => {
  const params = {}

  if (fromDate) {
    params.from = fromDate
  }

  if (toDate) {
    params.to = toDate
  }

  const response = await api.get(API_ENDPOINTS.paramsouche, {
    params,
    signal,
  })

  const payload = response?.data

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.result)) {
    return payload.result
  }

  return []
}

export const fetchRapChairCentre = async ({ dateDebut, dateFin, reportType, signal } = {}) => {
  if (!dateDebut || !dateFin) {
    throw new Error("dateDebut et dateFin sont requis")
  }

  // Récupérer le codeuser et la société depuis la session
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')
  const codeuser = user.codeuser || user.codeUser || user.code || user.id || ''
  const societe = getSociete()

  if (!societe) {
    throw new Error("Societe est requise. Impossible de récupérer la société depuis la session ou le token JWT.")
  }

  const body = {
    dateDebut,
    dateFin,
    codeuser,
    societe,
  }

  // Préparer les paramètres de requête (query parameters)
  const params = {}
  if (reportType) {
    params.reportType = reportType
  }

  // Configuration pour recevoir un fichier (blob)
  // Utiliser le nouvel endpoint /api/reports/generate avec reportType comme query parameter
  let response
  try {
    response = await api.post(API_ENDPOINTS.reportsGenerate, body, {
      params, // Envoyer reportType comme query parameter
      signal,
      responseType: 'blob', // Important pour recevoir un fichier
      validateStatus: (status) => status < 500, // Ne pas lancer d'erreur pour les codes < 500
    })
  } catch (error) {
    // Si la réponse est un blob mais contient une erreur, essayer de la parser
    if (error.response && error.response.data instanceof Blob) {
      const errorText = await error.response.data.text()
      try {
        const errorJson = JSON.parse(errorText)
        const errorMessage = errorJson.error || errorJson.message || 'خطأ في إنشاء التقرير'
        throw new Error(errorMessage)
      } catch (parseError) {
        // Si ce n'est pas du JSON, utiliser le texte brut ou un message par défaut
        throw new Error(errorText || 'خطأ في إنشاء التقرير. يرجى المحاولة مرة أخرى.')
      }
    }
    throw error
  }

  // Vérifier le statut HTTP
  if (response.status >= 400) {
    // Erreur HTTP, essayer de parser le blob comme JSON
    const errorText = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(response.data)
    })
    
    try {
      const errorJson = JSON.parse(errorText)
      const errorMessage = errorJson.error || errorJson.message || 'خطأ في إنشاء التقرير'
      throw new Error(errorMessage)
    } catch (parseError) {
      throw new Error(errorText || `خطأ في إنشاء التقرير (${response.status}). يرجى المحاولة مرة أخرى.`)
    }
  }

  // Vérifier si la réponse est une erreur (Content-Type: application/json)
  const contentType = response.headers['content-type'] || ''
  if (contentType.includes('application/json')) {
    // La réponse est du JSON (erreur), pas un fichier
    const errorText = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(response.data)
    })
    
    try {
      const errorJson = JSON.parse(errorText)
      const errorMessage = errorJson.error || errorJson.message || 'خطأ في إنشاء التقرير'
      throw new Error(errorMessage)
    } catch (parseError) {
      throw new Error(errorText || 'خطأ في إنشاء التقرير. يرجى المحاولة مرة أخرى.')
    }
  }

  // Récupérer le nom du fichier depuis les headers si disponible
  const contentDisposition = response.headers['content-disposition']
  let filename = `rapport_${dateDebut}_${dateFin}.xlsx` // Nom par défaut
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '')
      // Décoder le nom de fichier si encodé en UTF-8
      try {
        filename = decodeURIComponent(filename)
      } catch (e) {
        // Si le décodage échoue, utiliser le nom tel quel
      }
    }
  }

  // Créer un blob et déclencher le téléchargement
  const blob = new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)

  return { success: true, filename }
}

export default {
  fetchParamsoucheReports,
  fetchRapChairCentre,
}





