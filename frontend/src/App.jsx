import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'
import { useTranslation } from 'react-i18next'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout.jsx'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login.jsx'))
const Register = React.lazy(() => import('./views/pages/register/Register.jsx'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404.jsx'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500.jsx'))

// 🔒 Composant de protection des routes
import PrivateRoute from './auth/PrivateRoute.jsx'

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes(
    'coreui-free-react-admin-template-theme',
  )
  const storedTheme = useSelector((state) => state.theme)
  const { i18n } = useTranslation()

  // 🎨 Gestion du thème
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (!isColorModeSet()) {
      setColorMode(storedTheme)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 🌐 Gestion de la direction RTL/LTR selon la langue
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/404" element={<Page404 />} />
  <Route path="/500" element={<Page500 />} />

  {/* Toutes les routes protégées */}
  <Route
    path="/*"
    element={
      <PrivateRoute>
        <DefaultLayout />
      </PrivateRoute>
    }
  />
</Routes>

      </Suspense>
    </BrowserRouter>
  )
}

export default App
