import React from 'react';
import { cloneElement, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Composant commun pour les headers de page avec design uniforme et optimisé
 * @param {string} title - Titre principal
 * @param {string} subtitle - Sous-titre optionnel
 * @param {ReactNode} icon - Icône optionnelle (sera automatiquement stylisée)
 * @param {ReactNode} badge - Badge optionnel (ex: date range)
 * @param {string} className - Classes CSS additionnelles
 */
const PageHeaderCard = ({ title, subtitle, icon, badge, className = '' }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  // Normaliser l'icône pour appliquer les styles standardisés
  const normalizedIcon = icon && isValidElement(icon) 
    ? cloneElement(icon, {
        style: {
          fontSize: 'var(--page-header-icon-size)',
          color: 'var(--page-header-text)',
          ...(icon.props?.style || {}),
        },
        className: `page-header-icon ${icon.props?.className || ''}`,
      })
    : icon;

  return (
    <div
      className={`page-header-card ${className}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="page-header-content">
        <div className="page-header-main">
          {normalizedIcon && (
            <div className="page-header-icon-wrapper">
              {normalizedIcon}
            </div>
          )}
          <div className="page-header-text">
            <h1 className="page-header-title">
              {title}
            </h1>
            {subtitle && (
              <p className="page-header-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <div className="page-header-badge-wrapper">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PageHeaderCard);

