import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilStorage,
} from '@coreui/icons'

import { AppBreadcrumb, AppHeaderDropdown } from './index.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
 
const AppHeader = () => {
  const headerRef = useRef()
  const { t, i18n } = useTranslation() // ✅ récupérer t et i18n
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  const isRTL = i18n.language === 'ar'
  const isArabic = isRTL

  // Récupérer la base de données depuis la session
  const databaseLabel = sessionStorage.getItem('database_label') || sessionStorage.getItem('database_choice') || ''

  return (
    <CHeader
      position="sticky"
      className={`mb-4 p-0 ${isRTL ? 'rtl' : ''}`}
      ref={headerRef}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        {/* <CHeaderNav className="d-none d-md-flex">
          <CNavItem>
            <CNavLink to="/dashboard" as={NavLink}>
              {t('dashboard')}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">{t('users')}</CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">{t('settings')}</CNavLink>
          </CNavItem>
        </CHeaderNav> */}

        {/* <CHeaderNav className="ms-auto">
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilBell} size="lg" />
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilList} size="lg" />
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilEnvelopeOpen} size="lg" />
            </CNavLink>
          </CNavItem>
        </CHeaderNav> */}

        <CHeaderNav>
          {databaseLabel && (
            <>
              <li className="nav-item py-1 d-flex align-items-center">
                <CBadge className="d-flex align-items-center gap-1" style={{ 
                  fontSize: 'var(--text-xs)', 
                  padding: '0.35rem 0.7rem',
                  backgroundColor: '#e76558',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  boxShadow: '0 2px 6px rgba(231, 101, 88, 0.3)'
                }}>
                  <CIcon icon={cilStorage} size="sm" />
                  <span>{databaseLabel}</span>
                </CBadge>
              </li>
              <li className="nav-item py-1">
                <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
              </li>
            </>
          )}

          <CDropdown variant="nav-item" placement={isRTL ? 'bottom-start' : 'bottom-end'}>
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" />{' '}
                {isArabic ? 'فاتح' : 'Clair'}
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" />{' '}
                {isArabic ? 'داكن' : 'Sombre'}
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

         
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <LanguageSwitcher />
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>

      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
