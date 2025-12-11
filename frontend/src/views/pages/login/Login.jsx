import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilStorage, cilWarning, cilLanguage } from '@coreui/icons'
import { useTranslation } from 'react-i18next'
import { API_ENDPOINTS, ERROR_MESSAGES } from './config.jsx'
import apiFetcher from '../../../utils/apiFetcher.js'
import './Login.css'

const Login = () => {
  const { t, i18n } = useTranslation()
  const [login, setLogin] = useState('')
  const [motpasse, setMotpasse] = useState('')
  const [databaseChoice, setDatabaseChoice] = useState('')
  const [databases, setDatabases] = useState([])
  const [loadingDatabases, setLoadingDatabases] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Mettre à jour la direction du document
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language, isRTL])

  // Changer la langue
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
    document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lng)
  }

  // Vérifier session existante
  useEffect(() => {
    const user = sessionStorage.getItem('user')
    const db = sessionStorage.getItem('database_choice')
    if (user && db) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Charger les bases de données au montage du composant
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await apiFetcher(API_ENDPOINTS.databases, {
          method: 'GET',
          timeout: 10000,
        })
        if (response.success) {
          setDatabases(response.data.databases || [])
        } else {
          setError(t('login.errors.loadDatabasesFailed'))
        }
      } catch (err) {
        console.error('❌ Erreur fetchDatabases:', err)
        if (err.message === 'Request timed out') {
          setError(t('login.errors.connectionTimeout'))
        } else if (err.response?.status === 404) {
          setError(t('login.errors.endpointNotFound') + ': ' + API_ENDPOINTS.databases)
        } else if (err.response?.status >= 500) {
          setError(t('login.errors.serverError'))
        } else if (err.message === 'Network Error') {
          setError(t('login.errors.networkError'))
        } else {
          setError(`${t('login.errors.loadDatabasesFailed')}: ${err.message}`)
        }
      } finally {
        setLoadingDatabases(false)
      }
    }

    fetchDatabases()
  }, [t])

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!login.trim()) {
      setError(t('login.errors.usernameRequired'))
      return
    }
    if (!motpasse.trim()) {
      setError(t('login.errors.passwordRequired'))
      return
    }
    if (!databaseChoice) {
      setError(t('login.errors.databaseRequired'))
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await apiFetcher(API_ENDPOINTS.login, {
        method: 'POST',
        body: {
          login,
          motpasse,
          database_choice: databaseChoice,
        },
        timeout: 10000,
        headers: {
          'X-Database-Choice': databaseChoice
        }
      })

      if (response.success) {
        // Extraire le token quel que soit son nom
        const token = response.data.token
          || response.data.user?.token
          || response.data.user?.api_token
          || response.data.user?.access_token

        // Stocker les informations de l'utilisateur et la base de données choisie
        const storedUser = { ...(response.data.user || {}), token }
        sessionStorage.setItem('user', JSON.stringify(storedUser))
        if (token) sessionStorage.setItem('auth_token', token)
        sessionStorage.setItem('database_choice', databaseChoice)
        
        // Trouver le label de la base de données
        const db = databases.find(db => db.code === databaseChoice)
        if (db) {
          sessionStorage.setItem('database_label', db.display_label)
        }
        
        navigate('/', { replace: true })
      } else {
        setError(response.data.error || t('login.errors.unknownError'))
      }
    } catch (err) {
      console.error('❌ Erreur Login:', err)
      if (err.response?.status === 401) {
        setError(ERROR_MESSAGES[401] || t('login.errors.invalidCredentials'))
      } else if (err.response?.status === 404) {
        setError(ERROR_MESSAGES[404] || t('login.errors.endpointNotFound'))
      } else if (err.response?.status >= 500) {
        setError(ERROR_MESSAGES[500] || t('login.errors.serverError'))
      } else if (err.message === 'Request timed out') {
        setError(t('login.errors.connectionTimeout'))
      } else if (err.message === 'Network Error') {
        setError(ERROR_MESSAGES.NETWORK || t('login.errors.networkError'))
      } else {
        setError(err.data?.error?.message || err.data?.error || ERROR_MESSAGES.UNKNOWN || t('login.errors.unknownError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`login-page-wrapper ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <div className="login-language-switcher">
        <button
          type="button"
          className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`}
          onClick={() => changeLanguage('fr')}
          aria-label="Français"
        >
          <CIcon icon={cilLanguage} className="me-1" />
          FR
        </button>
        <button
          type="button"
          className={`lang-btn ${i18n.language === 'ar' ? 'active' : ''}`}
          onClick={() => changeLanguage('ar')}
          aria-label="العربية"
        >
          <CIcon icon={cilLanguage} className="me-1" />
          AR
        </button>
      </div>

      <CContainer className="login-container">
        <CRow className="justify-content-center align-items-center min-vh-100">
          <CCol md={8} lg={5} xl={4}>
            <CCardGroup>
              <CCard className="login-card">
                <CCardBody className="p-5">
                  <CForm onSubmit={handleSubmit}>
                    <div className="text-center mb-4">
                      <h2 className="login-form-title">{t('login.formTitle')}</h2>
                    </div>

                    {error && (
                      <CAlert color="danger" className="d-flex align-items-center mb-3">
                        <CIcon icon={cilWarning} className="me-2" />
                        <span>{error}</span>
                      </CAlert>
                    )}

                    {/* Champ login */}
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-semibold">
                        {t('login.username')}
                      </label>
                      <CInputGroup>
                        <CInputGroupText className="input-icon">
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          id="username"
                          placeholder={t('login.usernamePlaceholder')}
                          value={login}
                          onChange={(e) => setLogin(e.target.value)}
                          autoComplete="username"
                          required
                          disabled={isLoading}
                          className="form-input"
                        />
                      </CInputGroup>
                    </div>

                    {/* Champ mot de passe */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">
                        {t('login.password')}
                      </label>
                      <CInputGroup>
                        <CInputGroupText className="input-icon">
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          id="password"
                          type="password"
                          placeholder={t('login.passwordPlaceholder')}
                          value={motpasse}
                          onChange={(e) => setMotpasse(e.target.value)}
                          autoComplete="current-password"
                          required
                          disabled={isLoading}
                          className="form-input"
                        />
                      </CInputGroup>
                    </div>

                    {/* Choix dynamique de la base */}
                    <div className="mb-4">
                      <label htmlFor="database" className="form-label fw-semibold">
                        {t('login.database')}
                      </label>
                      <CInputGroup>
                        <CInputGroupText className="input-icon">
                          <CIcon icon={cilStorage} />
                        </CInputGroupText>
                        <CFormSelect
                          id="database"
                          value={databaseChoice}
                          onChange={(e) => setDatabaseChoice(e.target.value)}
                          required
                          disabled={loadingDatabases || isLoading}
                          className="form-select"
                        >
                          <option value="">
                            {loadingDatabases ? t('login.loadingDatabases') : t('login.selectDatabase')}
                          </option>
                          {databases.map((db) => (
                            <option key={db.code} value={db.code}>
                              {db.display_label}
                            </option>
                          ))}
                        </CFormSelect>
                      </CInputGroup>
                    </div>

                    <div className="d-grid">
                      <CButton
                        type="submit"
                        color="primary"
                        disabled={isLoading || loadingDatabases || !databaseChoice}
                        className="login-submit-btn"
                      >
                        {isLoading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            {t('login.submitting')}
                          </>
                        ) : (
                          t('login.submit')
                        )}
                      </CButton>
                    </div>

                    <div className="text-center mt-3">
                      <Link to="/forgot-password" className="login-link">
                        {t('login.forgotPassword')}
                      </Link>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>

            <div className="text-center mt-4">
              <p className="login-footer-text">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="login-link fw-semibold">
                  {t('login.createAccount')}
                </Link>
              </p>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
