import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index.jsx'

const DefaultLayout = () => {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <div>
      <AppSidebar />
      <div
        className="wrapper d-flex flex-column min-vh-100"
        style={{
          // Laisser la place du sidebar du bon côté selon la langue
          marginLeft: isArabic ? 0 : 'var(--cui-sidebar-width)',
          marginRight: isArabic ? 'var(--cui-sidebar-width)' : 0,
        }}
      >
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
