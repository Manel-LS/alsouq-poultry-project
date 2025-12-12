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
import { cilLockLocked, cilUser, cilStorage, cilWarning } from '@coreui/icons'
import axios from 'axios'
import { API_ENDPOINTS, ERROR_MESSAGES } from './config.js'
import apiFetcher from '../../../utils/apiFetcher.js'

const Login = () => {
  const [login, setLogin] = useState('')
  const [motpasse, setMotpasse] = useState('')
  const [databaseChoice, setDatabaseChoice] = useState('')
  const [databases, setDatabases] = useState([])
  const [loadingDatabases, setLoadingDatabases] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

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
          setDatabases(response.databases || [])
        } else {
          setError(response.error || 'فشل تحميل قواعد البيانات')
        }
      } catch (err) {
        console.error('❌ Erreur fetchDatabases:', err)
        if (err.message === 'Request timed out') {
          setError('انتهت مهلة الاتصال بالخادم')
        } else if (err.response?.status === 404) {
          setError('Endpoint non trouvé: ' + API_ENDPOINTS.databases)
        } else if (err.response?.status >= 500) {
          setError('Erreur serveur interne')
        } else if (err.message === 'Network Error') { // Axios specific network error
          setError('Impossible de se connecter au serveur. Vérifiez la connexion.')
        } else {
          setError(`Erreur lors de la récupération des données: ${err.message}`)
        }
      } finally {
        setLoadingDatabases(false)
      }
    }

    fetchDatabases()
  }, [])

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!login.trim()) {
      setError('يرجى إدخال اسم المستخدم')
      return
    }
    if (!motpasse.trim()) {
      setError('يرجى إدخال كلمة المرور')
      return
    }
    if (!databaseChoice) {
      setError('يرجى اختيار قاعدة البيانات')
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

      console.log('📡 Réponse Login:', response)

      if (response.status === 'success') {
        // Extraire le token quel que soit son nom
        const token = response.token
          || response.user?.token
          || response.user?.api_token
          || response.user?.access_token

        // Stocker les informations de l'utilisateur et la base de données choisية
        const storedUser = { ...(response.user || {}), token }
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
        setError(response.error || 'Erreur inconnue lors de la connexion')
      }
    } catch (err) {
      console.error('❌ Erreur Login:', err)
      if (err.response?.status === 401) {
        setError(ERROR_MESSAGES[401])
      } else if (err.response?.status === 404) {
        setError(ERROR_MESSAGES[404])
      } else if (err.response?.status >= 500) {
        setError(ERROR_MESSAGES[500])
      } else if (err.message === 'Request timed out') {
        setError('انتهت مهلة الاتصال بالخادم')
      } else if (err.message === 'Network Error') {
        setError(ERROR_MESSAGES.NETWORK)
      } else {
        setError(err.response?.data?.error || ERROR_MESSAGES.UNKNOWN)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center login-container" dir="rtl">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <div className="text-center mb-4">
              <h2 className="text-primary">نظام إدارة الدواجن</h2>
              <p className="text-muted">منصة متكاملة لإدارة مزارع الدواجن</p>
            </div>
            
            <CCardGroup>
              {/* Formulaire connexion */}
              <CCard className="p-4 login-card">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h3 className="text-center mb-4">تسجيل الدخول</h3>

                    {error && (
                      <CAlert color="danger" className="d-flex align-items-center">
                        <CIcon icon={cilWarning} className="me-2" />
                        {error}
                      </CAlert>
                    )}

                    {/* Champ login */}
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-semibold">اسم المستخدم</label>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          id="username"
                          placeholder="أدخل اسم المستخدم"
                          value={login}
                          onChange={(e) => setLogin(e.target.value)}
                          autoComplete="username"
                          required
                          disabled={isLoading}
                        />
                      </CInputGroup>
                    </div>

                    {/* Champ mot de passe */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">كلمة المرور</label>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          id="password"
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={motpasse}
                          onChange={(e) => setMotpasse(e.target.value)}
                          autoComplete="current-password"
                          required
                          disabled={isLoading}
                        />
                      </CInputGroup>
                    </div>

                    {/* Choix dynamique de la base */}
                    <div className="mb-4">
                      <label htmlFor="database" className="form-label fw-semibold">قاعدة البيانات</label>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilStorage} />
                        </CInputGroupText>
                        <CFormSelect
                          id="database"
                          value={databaseChoice}
                          onChange={(e) => setDatabaseChoice(e.target.value)}
                          required
                          disabled={loadingDatabases || isLoading}
                        >
                          <option value="">
                            {loadingDatabases ? 'جاري تحميل قواعد البيانات...' : 'اختر قاعدة البيانات'}
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
                        className="py-2"
                      >
                        {isLoading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            جاري التحقق...
                          </>
                        ) : (
                          'تسجيل الدخول'
                        )}
                      </CButton>
                    </div>

                    <div className="text-center mt-3">
                      <Link to="/forgot-password" className="text-decoration-none">
                        نسيت كلمة المرور؟
                      </Link>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>

            <div className="text-center mt-4">
              <p className="text-muted">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-decoration-none fw-semibold">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </CCol>
        </CRow>
      </CContainer>

      <style>{`
        .login-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .login-card {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: none;
        }
        .form-label {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #1a4971, #3182ce);
          border: none;
          border-radius: 8px;
          font-weight: 600;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #153a5e, #2b6cb0);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
        }
        .btn-primary:disabled {
          background: #a0aec0;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  )
}

export default Login