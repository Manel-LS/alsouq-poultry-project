import React from 'react'
import { useTranslation } from 'react-i18next'
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLanguage } from '@coreui/icons'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
  }

  const languageOptions = [
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' }
  ]

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle caret={false}>
        <CIcon icon={cilLanguage} size="lg" />
      </CDropdownToggle>
      <CDropdownMenu>
        {languageOptions.map((lang) => (
          <CDropdownItem
            key={lang.code}
            active={i18n.language === lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.name}
          </CDropdownItem>
        ))}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default LanguageSwitcher