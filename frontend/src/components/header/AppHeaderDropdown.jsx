import React from 'react';
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle, CAvatar } from '@coreui/react';
import { cilUser, cilSettings, cilLockLocked } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../../auth/useAuth';

const AppHeaderDropdown = React.memo(() => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const userName = user?.name || user?.login || (isArabic ? 'مستخدم' : 'Utilisateur');

  const labels = {
    profile: isArabic ? 'الملف الشخصي' : 'Profil',
    settings: isArabic ? 'الإعدادات' : 'Paramètres',
    logout: isArabic ? 'تسجيل الخروج' : 'Se déconnecter',
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'}>
      <CDropdown variant="nav-item">
        <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
          <div className="user-avatar-container">
            <CAvatar
              src="/assets/images/avatar.jpg"
              size="md"
              alt={isArabic ? 'صورة المستخدم' : "Avatar de l'utilisateur"}
            />
            <span className="user-name">{userName}</span>
          </div>
        </CDropdownToggle>
        <CDropdownMenu className="dropdown-menu-rtl" placement="bottom-end">
          <CDropdownItem href="#">
            <CIcon icon={cilUser} className="ms-2" />
            {labels.profile}
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilSettings} className="ms-2" />
            {labels.settings}
          </CDropdownItem>
          <CDropdownItem onClick={logout} className="text-danger">
            <CIcon icon={cilLockLocked} className="ms-2" />
            {labels.logout}
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      <style>{`
        .dropdown-menu-rtl {
          text-align: right;
          font-family: 'Noto Sans Arabic', sans-serif;
          min-width: 140px;
          border-radius: 6px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          background: #fff;
          padding: 6px 0;
        }

        .dropdown-menu-rtl .dropdown-item {
          padding: 6px 12px;
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          color: #2d3748;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .dropdown-menu-rtl .dropdown-item:hover {
          background-color: #f1f5f9;
        }

        .dropdown-menu-rtl .dropdown-item.text-danger {
          color: #e53e3e;
        }

        .dropdown-menu-rtl .dropdown-item.text-danger:hover {
          background-color: #fed7d7;
        }

        .dropdown-menu-rtl .dropdown-item .c-icon {
          margin-left: 6px;
          color: #718096;
        }

        .user-name {
          font-weight: 600;
          color: rgb(231 101 88) !important;
          font-size: 0.9rem;
          margin-right: 8px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-avatar-container {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .user-avatar-container:hover {
          background-color: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
});

export default AppHeaderDropdown;