import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

// Fonction de traduction des noms de routes
const translateRouteName = (routeName, isArabic) => {
  const translations = {
    'Home': isArabic ? 'الرئيسية' : 'Accueil',
    'لوحة التحكم': isArabic ? 'لوحة التحكم' : 'Tableau de bord',
    'لوحة التسمين': isArabic ? 'لوحة التسمين' : 'Tableau de bord - Poulets de chair',
    'لوحة البياض': isArabic ? 'لوحة البياض' : 'Tableau de bord - Poules pondeuses',
    'إدخال البيانات اليومية': isArabic ? 'إدخال البيانات اليومية' : 'Saisie des données quotidiennes',
    'التقارير': isArabic ? 'التقارير' : 'Rapports',
    'تصدير التقارير': isArabic ? 'تصدير التقارير' : 'Export des rapports',
    'مصادقة النشاط اليومي': isArabic ? 'مصادقة النشاط اليومي' : 'Rapport Journalier',
    'قائمة المباني': isArabic ? 'قائمة المباني' : 'Liste des bâtiments',
    'قائمة الحظائر': isArabic ? 'قائمة الحظائر' : 'Liste des centres et bâtiments',
    'إضافة استقبال المنتوجات': isArabic ? 'إضافة استقبال المنتوجات' : 'Ajouter une réception de produits',
    'قائمة استقبال المنتوجات': isArabic ? 'قائمة استقبال المنتوجات' : 'Liste des Réceptions',
  }
  
  return translations[routeName] || routeName
}

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0" dir={isArabic ? 'rtl' : 'ltr'}>
      <CBreadcrumbItem href="/">{isArabic ? 'الرئيسية' : 'Accueil'}</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
          >
            {translateRouteName(breadcrumb.name, isArabic)}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
