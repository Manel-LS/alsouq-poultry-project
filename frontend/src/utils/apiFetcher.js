import { API_CONFIG, getAuthHeaders } from '../config/api.js'

const apiFetcher = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers, timeout = API_CONFIG.TIMEOUT, skipAuth = false } = options

  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  // Si skipAuth est true, utiliser seulement les headers par défaut sans authentification
  const defaultHeaders = skipAuth ? API_CONFIG.DEFAULT_HEADERS : getAuthHeaders()

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })
    clearTimeout(id)

    if (!response.ok) {
      let errorData = { status: response.status, statusText: response.statusText };
      // Clone the response before reading to avoid "body stream already read" error
      const errorResponseClone = response.clone();
      try {
        const jsonResponse = await errorResponseClone.json();
        errorData = { ...errorData, ...jsonResponse };
      } catch (e) {
        // If it's not JSON, try to read as plain text
        try {
          const textResponse = await response.clone().text();
          if (textResponse) {
            errorData.rawText = textResponse;
          }
        } catch (textError) {
          // If both fail, just use the status info
          console.warn(`apiFetcher: Failed to parse error response for status ${response.status}`, textError);
        }
      }
      const errorMessage = errorData.message || errorData.title || errorData.rawText || `Request failed with status ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.response = response;
      error.data = { success: false, error: errorData };
      throw error;
    }

    // If response.ok is true, try to parse as JSON.
    try {
        const jsonResponse = await response.json();
        return { success: true, data: jsonResponse }; // Wrap successful JSON in { success: true, data: ... }
    } catch (e) {
        console.error("apiFetcher: Failed to parse successful response as JSON.", e);
        const error = new Error(`Failed to parse successful response as JSON: ${e.message}`);
        error.response = response;
        error.data = { success: false, error: { message: e.message, rawError: e } }; // Consistent error structure
        throw error;
    }

  } catch (error) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    console.error("apiFetcher: Unexpected error in fetch operation:", error);
    throw error
  }
}

export default apiFetcher
