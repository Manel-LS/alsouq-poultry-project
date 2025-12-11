import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilCalculator, cilChartPie, cilList, cilStorage, cilFile } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

// Génère la configuration du menu selon la langue
const getNavConfig = (lang = 'fr') => {
  const isArabic = lang === 'ar'

  return [
   {
    component: CNavItem,
      name: isArabic ? 'قائمة الحظائر' : 'Liste des bâtiments',
    to: '/centres',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
      name: isArabic ? 'مصادقة النشاط اليومي' : 'Rapport Journalier',
    to: '/settings',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
      name: isArabic ? 'إضافة استقبال المنتوجات' : 'Bon de Réception',
    to: '/stock-entry',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
      name: isArabic ? 'قائمة استقبال المنتوجات' : 'Liste des Réceptions',
    to: '/bon-entree-consultation',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
      name: isArabic ? 'عرض التقارير' : 'Affichage Rapport',
    to: '/reports',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
]
}

export default getNavConfig
