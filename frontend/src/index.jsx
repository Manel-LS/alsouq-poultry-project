import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import i18n from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { initReactI18next } from 'react-i18next'

import App from './App.jsx'
import store from './store'

// Import des traductions
import arTranslations from './locales/ar.json'
import frTranslations from './locales/fr.json'

// 🌐 Initialisation i18n avec prise en compte du stockage local et des langues ar/fr
const savedLang =
  (typeof window !== 'undefined' && window.localStorage
    ? window.localStorage.getItem('lang')
    : null) || 'fr'

// Initialiser i18next de manière synchrone
i18n
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: 'fr',
    supportedLngs: ['ar', 'fr'],
    resources: {
      ar: { translation: arTranslations },
      fr: { translation: frTranslations },
    },
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
    },
  })

// Mettre à jour la direction du document selon la langue
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', savedLang)
}

// Rendre l'application
const root = createRoot(document.getElementById('root'))
root.render(
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </Provider>
)
