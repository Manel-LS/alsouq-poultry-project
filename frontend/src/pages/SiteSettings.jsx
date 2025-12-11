import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { CCard, CCardBody, CRow, CCol, CFormSelect, CFormInput, CFormTextarea, CButton, CAlert, CTable, CFormLabel, CFormFeedback, CSpinner, CPagination, CPaginationItem, CBadge, CInputGroup } from '@coreui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import CIcon from '@coreui/icons-react';
import                 { 
  cilChart, 
  cilClipboard, 
  cilList, 
  cilCheckCircle, 
  cilWarning, 
  cilChevronLeft, 
  cilChevronRight,
  cilCart,
  cilTrash,
  cilSearch
} from '@coreui/icons';
import api from '../services/api.js';
import { API_ENDPOINTS, getDatabaseChoice } from '../config/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTranslationField } from '../hooks/useTranslationField';

import './SiteSettings.css';
import Swal from 'sweetalert2';
import { PageHeaderCard } from '../components/index.jsx';

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);

// Modern Title Component
const ModernTitle = React.memo(({ icon, children, className = '', size = 'small', isArabic = false }) => {
  const sizes = {
    small: { fontSize: '13px', iconSize: '13px' },
    medium: { fontSize: '15px', iconSize: '15px' },
    large: { fontSize: '17px', iconSize: '17px' }
  };
  
  const { fontSize, iconSize } = sizes[size];
  
  return (
    <div className={`modern-title d-flex align-items-center ${className}`} 
         style={{ 
           fontSize, 
           fontWeight: '700', 
           color: 'var(--text-primary)', 
           marginBottom: '14px',
           marginTop: '4px',
           paddingBottom: '10px',
           borderBottom: '2px solid var(--border-color)',
         }}>
      {icon && (
        <span 
          className="d-flex align-items-center justify-content-center"
          style={{ 
            color: 'var(--accent-color)',
            fontSize: iconSize,
            width: '24px',
            height: '24px',
            marginRight: isArabic ? '16px' : '20px',
            marginLeft: isArabic ? '0' : '0'
          }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
});

// Section Header Component
const SectionHeader = React.memo(({ icon, title, subtitle, className = '', isArabic = false }) => (
  <div className={`section-header ${className}`} style={{ marginBottom: '24px', marginTop: '8px' }}>
    <div className="d-flex align-items-center mb-1">
      {icon && (
        <div 
          className="section-icon d-flex align-items-center justify-content-center"
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--accent-color)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            marginRight: isArabic ? '16px' : '20px',
            marginLeft: isArabic ? '0' : '0'
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <h6 style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: 0 
        }}>
          {title}
        </h6>
        {subtitle && (
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)',
            margin: 0,
            marginTop: '2px'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
));

const normalizeArticleCode = (code) => (code ?? '').toString().trim().toUpperCase();

const MOVEMENT_CODE_KEYS = [
  'codeart',
  'codeArt',
  'CodeArt',
  'CODEART',
  'code_article',
  'CodeArticle',
  'CODE_ART',
  'codeArticle',
];

const MOVEMENT_QUANTITY_KEYS = [
  'quantity',
  'Quantity',
  'qte',
  'Qte',
  'qteart',
  'QteArt',
  'qte_art',
  'Qte_Art',
  'qtemvt',
  'QteMvt',
  'qteMvt',
  'Qté',
  'QtéMvt',
  'QtéSaisie',
  'qtesaisie',
  'QteSaisie',
  'qtedeja',
  'QteDeja',
  'qteDeja',
];

const MOVEMENT_NUMMVT_KEYS = [
  'nummvt',
  'NumMvt',
  'numMvt',
  'nummvtSource',
  'NumBE',
  'numbe',
  'NumMouvement',
  'numMouvement'
];

const MOVEMENT_NUMAFFAIRE_KEYS = [
  'numaffaire',
  'NumAffaire',
  'numAffaire',
  'NumAff',
  'numaff',
  'NumAff',
  'affaire',
  'Affaire'
];

const MOVEMENT_DATE_KEYS = [
  'datemvt',
  'DateMvt',
  'dateMvt',
  'date_mvt',
  'Date',
  'date',
  'datemouvement',
  'DateMouvement'
];

const extractMovementCode = (entry) => {
  for (const key of MOVEMENT_CODE_KEYS) {
    if (entry && entry[key] != null && entry[key] !== '') {
      return normalizeArticleCode(entry[key]);
    }
  }
  return null;
};

const extractMovementQuantity = (entry) => {
  for (const key of MOVEMENT_QUANTITY_KEYS) {
    if (entry && entry[key] != null) {
      const parsed = Number(entry[key]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const normalizeMovementIdentifier = (value) => {
  if (value == null) {
    return '';
  }
  return value.toString().trim().toLowerCase();
};

const extractMovementField = (entry, keys) => {
  for (const key of keys) {
    if (entry && entry[key] != null && entry[key] !== '') {
      return entry[key];
    }
  }
  return null;
};

const extractMovementFamille = (entry) => {
  const keys = ['famille', 'Famille', 'codefam', 'codeFamille', 'fam', 'famart'];
  return extractMovementField(entry, keys);
};

const extractMovementDepot = (entry) => {
  const keys = ['codedep', 'CodeDep', 'codeDep', 'LibDep', 'libDep', 'depotCode', 'codeDepBat'];
  return extractMovementField(entry, keys);
};

const extractMovementNature = (entry) => {
  const keys = ['cnature', 'cNature', 'CNature', 'c_nature', 'C_NATURE', 'Nature', 'structure', 'Structure'];
  return extractMovementField(entry, keys);
};

const buildCompositeKey = (codeart, famille, codedep) => {
  const normalizedCode = normalizeArticleCode(codeart || '');
  const normalizedFamille = (famille || '').toString().trim().toUpperCase();
  const normalizedDepot = (codedep || '').toString().trim().toUpperCase();
  return `${normalizedCode}|${normalizedFamille}|${normalizedDepot}`;
};

const sortCartItemsByCode = (items = []) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const copy = [...items];
  copy.sort((a, b) => {
    const codeA = normalizeArticleCode(a?.codeart || a?.CodeArt || '');
    const codeB = normalizeArticleCode(b?.codeart || b?.CodeArt || '');
    if (codeA < codeB) return -1;
    if (codeA > codeB) return 1;
    return 0;
  });
  return copy;
};

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const shiftIsoDate = (isoDate, offsetDays = 0) => {
  const baseDate = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    return '';
  }
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split('T')[0];
};

const formatIsoDateForDisplay = (isoDate, locale = 'fr-FR') => {
  if (!isoDate) {
    return '';
  }
  const parsedDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
  } catch {
    return isoDate;
  }
};

const CLOSED_STATUS_KEYWORDS = [
  'cloture',
  'cloturee',
  'cloturé',
  'cloturée',
  'ferme',
  'fermee',
  'closed',
  'close',
  'termine',
  'terminee',
  'terminé',
  'terminée',
  'done',
  'completed',
  '1',
  'true',
  'o',
  'oui',
  'y',
  'yes',
];

const OPEN_STATUS_KEYWORDS = [
  'encours',
  'ouverte',
  'ouverte',
  'open',
  '0',
  'false',
  'n',
  'non',
  'no',
  'ongoing',
  'inprogress',
];

const interpretClosureValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  // Gérer les nombres (0 ou 1)
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 0) {
      return true; // 1 ou tout nombre > 0 = clôturé
    }
    if (value === 0) {
      return false; // 0 = non clôturé
    }
  }
  // Gérer les chaînes numériques ("0", "1", etc.)
  const stringValue = String(value).trim();
  
  // Ignorer les dates (si ça contient un tiret, c'est probablement une date)
  if (stringValue.includes('-')) {
    console.log('🔍 interpretClosureValue: date ignorée (pas une valeur de clôture):', stringValue);
    return null;
  }
  
  // Vérifier si c'est une chaîne numérique simple (0, 1, etc.)
  if (/^[01]$/.test(stringValue)) {
    // C'est explicitement "0" ou "1"
    const numericValue = Number(stringValue);
    console.log('🔍 interpretClosureValue: valeur numérique détectée (0/1):', numericValue);
    return numericValue > 0; // 1 = clôturé, 0 = non clôturé
  }
  
  // Vérifier les autres valeurs numériques
  const numericValue = Number(stringValue);
  if (!isNaN(numericValue) && stringValue !== '') {
    // C'est un nombre valide
    if (numericValue > 0) {
      console.log('🔍 interpretClosureValue: valeur numérique > 0 détectée:', numericValue);
      return true; // "1" ou tout nombre > 0 = clôturé
    }
    if (numericValue === 0) {
      console.log('🔍 interpretClosureValue: valeur numérique = 0 détectée:', numericValue);
      return false; // "0" = non clôturé
    }
  }
  
  // Gérer les mots-clés textuels
  const normalized = stringValue.toLowerCase();
  if (!normalized) {
    return null;
  }
  if (OPEN_STATUS_KEYWORDS.includes(normalized)) {
    console.log('🔍 interpretClosureValue: valeur ouverte détectée:', normalized);
    return false;
  }
  if (CLOSED_STATUS_KEYWORDS.includes(normalized)) {
    console.log('🔍 interpretClosureValue: valeur clôturée détectée:', normalized);
    return true;
  }
  console.log('🔍 interpretClosureValue: valeur non reconnue:', normalized, 'OPEN:', OPEN_STATUS_KEYWORDS.includes(normalized), 'CLOSED:', CLOSED_STATUS_KEYWORDS.includes(normalized));
  return null;
};

const normalizeMovementDate = (value) => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  const stringValue = value.toString().trim();
  if (!stringValue) {
    return '';
  }

  if (stringValue === '0001-01-01' || stringValue.startsWith('0001-01-01')) {
    return '';
  }

  // Extract date part if there's a time component (e.g., "01/11/2025 00:00:00" -> "01/11/2025")
  let dateOnly = stringValue;
  const spaceIndex = stringValue.indexOf(' ');
  if (spaceIndex > 0) {
    dateOnly = stringValue.substring(0, spaceIndex);
  }

  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = dateOnly.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return isoMatch[0];
  }

  // Handle date with slashes (DD/MM/YYYY or YYYY/MM/DD)
  const dateParts = dateOnly.split('/');
  if (dateParts.length === 3) {
    const [part1, part2, part3] = dateParts.map(p => p.trim());
    // Check if first part is year (YYYY format)
    if (part1.length === 4 && /^\d{4}$/.test(part1)) {
      return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
    }
    // Check if third part is year (DD/MM/YYYY format)
    if (part3.length === 4 && /^\d{4}$/.test(part3)) {
      return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
    }
  }

  // Try to parse as Date object if it's a valid date string
  try {
    const parsedDate = new Date(stringValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return stringValue;
};

const resolveApiDate = (value, fallback) => {
  const normalizedValue = normalizeMovementDate(value);
  if (normalizedValue) {
    return normalizedValue;
  }

  if (fallback) {
    const normalizedFallback = normalizeMovementDate(fallback);
    if (normalizedFallback) {
      return normalizedFallback;
    }
  }

  return getTodayIsoDate();
};

// Normalize all date fields in API response data
const normalizeApiResponseDates = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // List of common date field names that might contain dates with time
  // Exclure "cloture" et "tcloturer" car ce sont des valeurs numériques 0/1, pas des dates
  const dateFieldPatterns = [
    /date/i,
    /Date/i,
    /eclo/i,
    /Eclo/i,
    /mvt/i,
    /Mvt/i,
  ];
  
  // Liste des champs à exclure de la normalisation des dates (valeurs numériques 0/1)
  const excludeFromDateNormalization = [
    'cloture',
    'tcloturer',
    'Cloture',
    'Tcloturer',
  ];

  const normalizeObject = (obj, visited = new WeakSet()) => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => normalizeObject(item, visited));
    }

    visited.add(obj);
    const normalized = {};

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }

      const value = obj[key];
      const isExcluded = excludeFromDateNormalization.includes(key);
      const isDateField = !isExcluded && dateFieldPatterns.some(pattern => pattern.test(key));

      if (isDateField && value != null && value !== '') {
        try {
          const normalizedDate = normalizeMovementDate(value);
          normalized[key] = normalizedDate || value;
        } catch (e) {
          // If normalization fails, keep original value
          normalized[key] = value;
        }
      } else if (value && typeof value === 'object') {
        normalized[key] = normalizeObject(value, visited);
      } else {
        // Garder la valeur originale (incluant cloture et tcloturer comme nombres 0/1)
        normalized[key] = value;
      }
    }

    return normalized;
  };

  return normalizeObject(data);
};

const extractMovementsMap = (data, options = {}) => {
  const { targetNumMvt, targetDate } = options;
  const normalizedTargetNumMvt = normalizeMovementIdentifier(targetNumMvt);
  const normalizedTargetDate = normalizeMovementDate(targetDate);

  if (!data || typeof data !== 'object') {
    return new Map();
  }

  const visited = new WeakSet();
  const map = new Map();

  const traverse = (node) => {
    if (!node || typeof node !== 'object' || visited.has(node)) {
      return;
    }

    visited.add(node);

    if (Array.isArray(node)) {
      node.forEach((item) => {
        if (item && typeof item === 'object') {
          const code = extractMovementCode(item);
          const itemNumMvt = extractMovementField(item, MOVEMENT_NUMMVT_KEYS);
          const itemNumAffaire = extractMovementField(item, MOVEMENT_NUMAFFAIRE_KEYS);
          const itemDateMvt = extractMovementField(item, MOVEMENT_DATE_KEYS);

          let matchesNumMvt = true;
          if (normalizedTargetNumMvt) {
            const candidates = [itemNumMvt, itemNumAffaire].filter(
              (candidate) => candidate != null && candidate !== ''
            );

            if (candidates.length === 0) {
              matchesNumMvt = true;
            } else {
              matchesNumMvt = candidates.some((candidate) => {
                const normalizedCandidate = normalizeMovementIdentifier(candidate);
                return (
                  normalizedCandidate === normalizedTargetNumMvt ||
                  normalizedCandidate.includes(normalizedTargetNumMvt) ||
                  normalizedTargetNumMvt.includes(normalizedCandidate)
                );
              });
            }
          }

          let matchesDate = true;
          if (normalizedTargetDate) {
            if (itemDateMvt != null && itemDateMvt !== '') {
              matchesDate =
                normalizeMovementDate(itemDateMvt) === normalizedTargetDate;
          } else {
              matchesDate = true;
            }
          }

          if (code && matchesNumMvt && matchesDate) {
            const quantity = extractMovementQuantity(item);
            const famille = extractMovementFamille(item);
            const depot = extractMovementDepot(item);
            const nature = extractMovementNature(item);
            const compositeKey = buildCompositeKey(code, famille, depot);
            const codeOnlyKey = normalizeArticleCode(code || '');

            if (!map.has(compositeKey) || quantity > 0) {
              map.set(compositeKey, { quantity, raw: item, codeart: code, famille, depot, structure: nature });
            }

            if (!map.has(codeOnlyKey) || quantity > 0) {
              map.set(codeOnlyKey, { quantity, raw: item, codeart: code, famille, depot, structure: nature });
            }
          }

          if (!code || !matchesNumMvt || !matchesDate) {
            traverse(item);
          }
        }
      });
      return;
    }

    Object.values(node).forEach((value) => {
      if (value && typeof value === 'object') {
        traverse(value);
      }
    });
  };

  traverse(data);
  return map;
};

// StructureList component - Design uniforme avec StockEntry
const StructureList = React.memo(({ items, activeItem, onItemClick, loading, isArabic }) => {
  const { t: tField } = useTranslationField();
  
  return (
    <div
      className="structure-list-container"
      style={{
        borderRadius: '18px',
        background: 'linear-gradient(180deg, rgba(240, 253, 250, 0.95) 0%, rgba(224, 242, 254, 0.9) 100%)',
        boxShadow: '0 14px 32px rgba(15, 118, 110, 0.12)',
        border: '1.5px solid rgba(13, 148, 136, 0.18)',
        height: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="structure-list-header p-2 rounded-top-3 d-flex align-items-center"
           style={{
             background: 'rgba(255,255,255,0.85)',
             borderBottom: '1px solid rgba(13, 148, 136, 0.12)'
           }}>
        <FaIcon icon="fa-sitemap" className={isArabic ? "me-2" : "ms-2"} style={{ color: '#0d9488', fontSize: '14px' }} />
        <div>
          <div className="fw-bold" style={{ fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>{isArabic ? "مراكز التكلفة" : "Centres de coût"}</div>
          <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isArabic ? "اختر مركزاً لعرض تفاصيله" : "Sélectionnez un centre pour voir ses détails"}</small>
        </div>
      </div>
      <div
        className="structure-list bg-white rounded-bottom-3"
        style={{ 
          border: '1px solid rgba(13, 148, 136, 0.12)',
          borderTop: 'none',
          padding: '12px 14px',
          borderRadius: '0 0 18px 18px',
          background: 'rgba(255,255,255,0.9)',
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {loading ? (
          <div className="text-center p-4">
            <CSpinner size="sm" color="primary" />
            <div className="mt-2 text-muted" style={{fontSize: '12px'}}>{isArabic ? "جاري تحميل المراكز..." : "Chargement des centres..."}</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-4 text-muted">
            <FaIcon icon="fa-inbox" className="fs-1 mb-2 opacity-50" />
            <div style={{fontSize: '12px'}}>{isArabic ? "لا توجد مراكز تكلفة متاحة" : "Aucun centre de coût disponible"}</div>
          </div>
        ) : (
          <div className="d-flex flex-column" style={{ gap: '8px' }}>
            {items.map((item, index) => (
              <div
                key={item.id || `${item.code}-${index}`}
                className={`structure-list-item px-3 py-3 cursor-pointer ${
                  activeItem === item.code ? 'active' : ''
                }`}
                onClick={() => onItemClick(item.code)}
                role="button"
                style={{ 
                  width: '100%',
                  borderRadius: '12px',
                  border: activeItem === item.code ? '2px solid rgb(231 101 88)' : '1px solid rgba(231, 101, 88, 0.15)',
                  background: activeItem === item.code
                    ? 'linear-gradient(135deg, rgba(231, 101, 88, 0.15) 0%, rgba(231, 101, 88, 0.08) 100%)'
                    : '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: activeItem === item.code 
                    ? '0 4px 12px rgba(231, 101, 88, 0.2)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (activeItem !== item.code) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = 'rgba(231, 101, 88, 0.3)';
                    e.currentTarget.style.transform = 'translateX(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeItem !== item.code) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(231, 101, 88, 0.15)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                    <div className="structure-badge rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: activeItem === item.code ? 'rgb(231 101 88)' : 'rgba(231, 101, 88, 0.1)',
                        color: activeItem === item.code ? '#fff' : 'rgb(231 101 88)',
                        fontSize: '14px',
                        boxShadow: activeItem === item.code ? '0 4px 12px rgba(231, 101, 88, 0.3)' : 'none'
                      }}
                    >
                      <FaIcon icon="fa-building" />
                    </div>
                    <div className="d-flex flex-column">
                      <span className="structure-name fw-bold" style={{ 
                        fontSize: '13px', 
                        color: activeItem === item.code ? 'rgb(231 101 88)' : '#1e293b'
                      }}>
                        {isArabic ? (item.libarabe || item.libelle || '') : (item.libelle || item.libarabe || '')}
                      </span>
                      {item.code && (
                        <span className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                          {item.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <FaIcon 
                    icon={isArabic ? "fa-chevron-right" : "fa-chevron-left"} 
                    style={{ 
                      color: activeItem === item.code ? 'rgb(231 101 88)' : '#94a3b8',
                      fontSize: '12px'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Composant QuantityInput optimisé
const QuantityInput = React.memo(({ 
  value, 
  onChange, 
  min = 0, 
  max: _max, // eslint-disable-line no-unused-vars
  disabled = false,
  className = '',
  isArabic = false
}) => {
  const numericMin = Number(min);
  const safeMin = Number.isFinite(numericMin) ? numericMin : 0;

  const normalizeQuantityValue = useCallback((val) => {
    if (val === '' || val == null) {
      return safeMin;
    }
    const parsed = Number(val);
    return Number.isNaN(parsed) ? safeMin : parsed;
  }, [safeMin]);

  const [inputValue, setInputValue] = useState(() => normalizeQuantityValue(value));

  useEffect(() => {
    setInputValue(normalizeQuantityValue(value));
  }, [value, normalizeQuantityValue]);

  const clampToMin = (val) => {
    const parsed = Number(val);
    const sanitized = Number.isNaN(parsed) ? safeMin : parsed;
    return Math.max(safeMin, sanitized);
  };

  const getCurrentValue = () => {
    if (inputValue === '' || inputValue == null) {
      return safeMin;
    }
    const parsed = Number(inputValue);
    return Number.isNaN(parsed) ? safeMin : parsed;
  };

  const updateQuantity = (val) => {
    const sanitized = clampToMin(val);
    setInputValue(sanitized);
    onChange(sanitized);
  };

  const handleIncrement = () => {
    const current = getCurrentValue();
    updateQuantity(current + 1);
  };

  const handleDecrement = () => {
    const current = getCurrentValue();
    updateQuantity(current - 1);
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setInputValue('');
      return;
    }

    const parsedValue = Number(rawValue);
    const normalizedValue = Number.isNaN(parsedValue) ? safeMin : parsedValue;
    setInputValue(normalizedValue);
    onChange(normalizedValue);
  };

  const handleInputBlur = () => {
    updateQuantity(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const dir = isArabic ? 'rtl' : 'ltr';
  return (
    <div className={`quantity-input-group ${className}`} style={{ display: 'flex', alignItems: 'center', direction: dir }} dir={dir}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || getCurrentValue() <= safeMin}
        className="quantity-btn"
        style={{
          padding: '4px 10px',
          border: '2px solid #d1d5db',
          [isArabic ? 'borderLeft' : 'borderRight']: 'none',
          borderRadius: isArabic ? '0 6px 6px 0' : '6px 0 0 6px',
          background: (disabled || getCurrentValue() <= safeMin) ? '#f1f5f9' : '#f8fafc',
          cursor: (disabled || getCurrentValue() <= safeMin) ? 'not-allowed' : 'pointer',
          color: (disabled || getCurrentValue() <= safeMin) ? '#94a3b8' : '#1e293b',
          fontSize: '12px',
          fontWeight: '700',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          if (!disabled && getCurrentValue() > safeMin) {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && getCurrentValue() > safeMin) {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        -
      </button>
      
      <input
        type="number"
        value={inputValue ?? safeMin}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        min={safeMin}
        disabled={disabled}
        className="quantity-input-field"
        dir={dir}
        style={{
          width: '70px',
          padding: '4px 6px',
          border: '2px solid #d1d5db',
          borderRadius: '6px',
          textAlign: isArabic ? 'right' : 'left',
          fontSize: '12px',
          fontWeight: '700',
          background: disabled ? '#f8fafc' : '#ffffff',
          margin: 0,
          height: '32px',
          direction: dir,
          color: '#1e293b',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        onFocus={(e) => {
          e.target.select();
          e.target.style.borderColor = 'rgb(231 101 88)';
          e.target.style.boxShadow = '0 0 0 3px rgba(231, 101, 88, 0.1)';
        }}
        onBlur={(e) => {
          handleInputBlur();
          if (!e.target.disabled) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
          }
        }}
      />
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled}
        className="quantity-btn"
        style={{
          padding: '4px 10px',
          border: '2px solid #d1d5db',
          [isArabic ? 'borderRight' : 'borderLeft']: 'none',
          borderRadius: isArabic ? '6px 0 0 6px' : '0 6px 6px 0',
          background: disabled ? '#f1f5f9' : '#f8fafc',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: disabled ? '#94a3b8' : '#1e293b',
          fontSize: '12px',
          fontWeight: '700',
          minWidth: '32px',
          height: '32px',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        +
      </button>
    </div>
  );
});

// Optimized InputGroup component
const InputGroup = React.memo(({ children, title, subtitle, icon, className = '', compact = false, highlight = false, isArabic = false }) => (
  <div
    className={`input-group-container ${className}`}
    style={{
      background: highlight ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : 'var(--card-bg)',
      borderRadius: '10px',
      padding: compact ? '12px' : '16px',
      border: highlight ? '2px solid #5087a8' : '1.5px solid var(--border-color)',
      boxShadow: highlight ? '0 2px 8px rgba(80, 135, 168, 0.15)' : 'var(--shadow-xs)',
      height: compact ? '100%' : 'auto',
    }}
  >
    <ModernTitle icon={icon} size={compact ? 'small' : 'medium'} className="mb-2" isArabic={isArabic}>
      {title}
    </ModernTitle>
    {subtitle && (
      <p className="text-muted mb-2 small" style={{ fontSize: '12px', lineHeight: '1.4', fontWeight: '500' }}>
        {subtitle}
      </p>
    )}
    <div className="input-group-content">{children}</div>
  </div>
));

// Optimized ProfessionalInputField component
const ProfessionalInputField = React.memo(
  ({ 
    label, 
    type, 
    name, 
    value, 
    onChange, 
    placeholder = '--', 
    min, 
    max, 
    step, 
    invalid, 
    feedback, 
    required = false, 
    disabled = false, 
    readOnly = false, 
    icon = null, 
    className = '', 
    compact = false, 
    children,
    isArabic = false
  }) => {
    
    const safeValue = value ?? '';
    const isEmpty = safeValue === '' || safeValue === null;
    const effectivePlaceholder = placeholder || '--';
    const effectiveValue = (readOnly || disabled) && isEmpty ? '' : safeValue;
    
    return (
      <div className={`professional-input-field mb-2 ${className}`}>
        <div className="d-flex align-items-center" style={{ gap: '8px' }}>
          <CFormLabel className="input-label fw-bold mb-0 text-nowrap" style={{ 
            color: 'var(--text-primary)', 
            fontSize: '12px',
            lineHeight: '1.3',
            minWidth: '85px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {icon && <span className="input-label-icon" style={{ color: 'var(--accent-color)', fontSize: '12px' }}>{icon}</span>}
            <span>{label}</span>
            {required && <span className="text-danger">*</span>}
          </CFormLabel>
          <div className="input-container position-relative flex-grow-1">
            {type === 'select' ? (
              <CFormSelect
                name={name}
                value={effectiveValue}
                onChange={onChange}
                invalid={invalid}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className="enhanced-input w-100"
                style={{
                  padding: '3px 4px',
                  border: readOnly ? '1.5px solid #cbd5e1' : '1.5px solid #d1d5db',
                  borderRadius: '7px',
                  background: readOnly ? '#f1f5f9' : '#ffffff',
                  fontSize: '13px',
                  height: '36px',
                  boxShadow: readOnly ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  textAlign: isArabic ? 'right' : 'left',
                  fontWeight: '500',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
                aria-describedby={`${name}-feedback`}
              >
                {children}
              </CFormSelect>
            ) : type === 'textarea' ? (
              <CFormTextarea
                name={name}
                value={safeValue}
                onChange={onChange}
                placeholder={placeholder}
                invalid={invalid}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className="enhanced-input w-100"
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  padding: '3px 4px',
                  border: 'none',
                  borderRadius: '7px',
                  background: readOnly ? '#f1f5f9' : '#ffffff',
                  fontSize: '13px',
                  boxShadow: readOnly ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  textAlign: isArabic ? 'right' : 'left',
                  direction: isArabic ? 'rtl' : 'ltr',
                  fontWeight: '500',
                  color: '#1e293b'
                }}
                aria-describedby={`${name}-feedback`}
              />
            ) : (
              <CFormInput
                type={type}
                name={name}
                value={effectiveValue}
                onChange={onChange}
                placeholder={effectivePlaceholder}
                min={min}
                max={max}
                step={step}
                invalid={invalid}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className="enhanced-input w-100"
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  padding: '3px 4px',
                  border: readOnly ? '1.5px solid #cbd5e1' : '1.5px solid #d1d5db',
                  borderRadius: '7px',
                  background: readOnly ? '#f1f5f9' : '#ffffff',
                  fontSize: '13px',
                  height: '36px',
                  boxShadow: readOnly ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  textAlign: isArabic ? 'right' : 'left',
                  direction: isArabic ? 'rtl' : 'ltr',
                  fontWeight: '500',
                  color: '#1e293b'
                }}
                aria-describedby={`${name}-feedback`}
              />
            )}
          </div>
        </div>
        {feedback && (
          <CFormFeedback id={`${name}-feedback`} className="feedback-text mt-1" invalid style={{ fontSize: '10px', color: 'var(--danger)', marginRight: '93px' }}>
            {feedback}
          </CFormFeedback>
        )}
      </div>
    );
  }
);

// Enhanced RadioButtonGroup component
const RadioButtonGroup = React.memo(({ label, name, value, onChange, options, invalid, feedback, required = false, icon = null, isArabic = false, hideLabel = false }) => (
  <div className="radio-group-wrapper mb-3">
    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center mb-2" style={{ gap: '6px' }}>
      {!hideLabel && (
        <CFormLabel className="input-label fw-semibold mb-1 mb-md-0 text-nowrap" style={{ 
          color: 'var(--text-primary)', 
          minWidth: '60px',
          maxWidth: '90px',
          fontSize: '12px'
        }}>
          {icon && <span className={`input-label-icon ${isArabic ? 'me-1' : 'ms-1'}`} style={{ color: 'var(--accent-color)' }}>{icon}</span>}
          {label}
          {required && <span className={`text-danger ${isArabic ? 'ms-1' : 'me-1'}`}>*</span>}
        </CFormLabel>
      )}
      <div className={`radio-options d-flex flex-column flex-md-row justify-content-end gap-1 gap-md-2 flex-wrap ${hideLabel ? 'w-100' : ''}`} style={{ flexGrow: 1, ...(hideLabel ? { [isArabic ? 'marginRight' : 'marginLeft']: 'auto' } : {}) }}>
        {options.map((option) => (
          <label key={option.value} className="radio-option position-relative m-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="radio-input position-absolute opacity-0"
            />
            <span
              className="radio-custom d-flex align-items-center justify-content-center rounded-2 border w-100"
              style={{
                minWidth: '90px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                fontWeight: '500',
                border: '1px solid var(--border-color)',
                backgroundColor: value === option.value ? 'var(--accent-color)' : 'var(--card-bg)',
                color: value === option.value ? 'white' : 'var(--text-primary)',
              }}
            >
              {option.icon && <span className="ms-1" style={{ fontSize: '10px' }}>{option.icon}</span>}
              <span className="radio-label">{option.label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
    {feedback && (
      <CFormFeedback className="feedback-text mt-1 text-start" invalid style={{ fontSize: '10px', color: 'var(--danger)' }}>
        {feedback}
      </CFormFeedback>
    )}
  </div>
));

// Composant Panier ultra compact et élégant
const CartPanel = React.memo(({ 
  cartItems, 
  onRemoveFromCart, 
  onUpdateQuantity, 
  onClearCart, 
  existingMovementsMap, 
  isProductionStructure = false,
  productionDailyLimit = 0,
  className = '',
  resolveBaseAvailableQuantityFn,
  getRemainingAdditionCapacityFn,
  resolveStructureCodeFn,
  isArabic = false
}) => {
  const { t: tField } = useTranslationField();
  const totalItems = cartItems.length;
  const parsePositiveQuantity = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
  };

  const totalProductionQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const resolvedStructure = resolveStructureCodeFn
        ? resolveStructureCodeFn(item)
        : normalizeArticleCode(
            item.cnature ||
            item.cNature ||
            item.CNature ||
            item.c_nature ||
            item.C_NATURE ||
            item.Nature ||
            item.structure ||
            item.Structure ||
            ''
          );
      if (resolvedStructure !== '006') {
        return sum;
      }
      return sum + parsePositiveQuantity(item.quantity ?? item.QteArt ?? item.qteart ?? item.Qte);
    }, 0);
  }, [cartItems, resolveStructureCodeFn]);

  const isProductionOverLimit = productionDailyLimit > 0 && totalProductionQuantity > productionDailyLimit;
  
  return (
    <div 
      className={`cart-panel ${className}`}
      style={{
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '12px',
        height: '260px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Header compact */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <div 
            className={`cart-icon-container ${isArabic ? 'me-2' : 'ms-2'} d-flex align-items-center justify-content-center rounded-circle`}
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--accent-color)',
              color: 'white',
              fontSize: '11px'
            }}
          >
            <FaIcon icon="fa-list-alt" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{isArabic ? "قائمة المواد" : "Liste des matériaux"}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{totalItems} {isArabic ? "عنصر" : "élément"}</div>
          </div>
        </div>
        {cartItems.length > 0 && (
          <CButton
            color="outline-danger"
            size="sm"
            onClick={onClearCart}
            style={{ 
              fontSize: '9px', 
              padding: '2px 6px',
              border: '1px solid var(--danger)',
              borderRadius: '4px'
            }}
          >
            <FaIcon icon="fa-trash" className={isArabic ? "me-1" : "ms-1"} />
            {isArabic ? "إفراغ" : "Vider"}
          </CButton>
        )}
      </div>

      {productionDailyLimit > 0 && (
        <div
          className="mb-2"
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: isProductionOverLimit ? 'var(--danger)' : 'var(--text-primary)',
            background: isProductionOverLimit ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-light)',
            border: `1px solid ${isProductionOverLimit ? 'rgba(239, 68, 68, 0.4)' : 'var(--container-border-color)'}`,
            borderRadius: '6px',
            padding: '6px 8px',
          }}
        >
          {isArabic ? "إجمالي منتجات الإنتاج" : "Total produits de production"}: {totalProductionQuantity.toLocaleString()} / {productionDailyLimit.toLocaleString()}
          {isProductionOverLimit && (
            <div style={{ marginTop: '4px' }}>
              {isArabic ? "❌ الكمية الإجمالية للمنتجات الإنتاجية تجاوزت العدد اليومي المسموح." : "❌ La quantité totale des produits de production dépasse l'effectif quotidien autorisé."}
            </div>
          )}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center p-3 text-muted d-flex flex-column justify-content-center align-items-center flex-grow-1" 
             style={{ 
               background: 'var(--bg-light)', 
               borderRadius: '6px',
               border: '1px dashed var(--border-color)'
             }}>
          <FaIcon icon="fa-list-alt" className="mb-2 opacity-50" style={{ color: 'var(--accent-color)', fontSize: '20px' }} />
          <div style={{fontSize: '11px', fontWeight: '500'}}>{isArabic ? "القائمة فارغة" : "La liste est vide"}</div>
          <div style={{fontSize: '9px', color: 'var(--text-muted)'}}>{isArabic ? "أضف عناصر من الجدول" : "Ajoutez des éléments du tableau"}</div>
        </div>
      ) : (
        <>
          <div
            className="cart-items flex-grow-1"
            style={{ 
              overflowY: 'auto',
              maxHeight: '160px'
            }}
          >
            {cartItems.map((item, index) => {
              const normalizedCode = normalizeArticleCode(item.codeart || item.CodeArt || item.codeArt || '');
              const existingMovement = existingMovementsMap?.get(normalizedCode);
              const existingQuantity = existingMovement?.quantity;
              const hasExistingQuantity = existingQuantity != null && existingQuantity > 0;
              const baseAvailableQuantity = resolveBaseAvailableQuantityFn
                ? resolveBaseAvailableQuantityFn(item)
                : Number(item.qteart ?? item.QteArt ?? item.qteArt ?? item.Qte ?? 0);
              const resolvedBaseAvailable = Number.isFinite(Number(baseAvailableQuantity)) && Number(baseAvailableQuantity) >= 0
                ? Number(baseAvailableQuantity)
                : 0;
              const resolvedStructureCode = resolveStructureCodeFn
                ? resolveStructureCodeFn(item)
                : '';

              return (
              <div
                key={`${item.codeart}-${index}`}
                className="cart-item p-2 mb-1 rounded"
                style={{
                  background: hasExistingQuantity ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-light)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '5px',
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-truncate" style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      marginBottom: '2px'
                    }}>
                      {isArabic ? (item.libarabe || '') : (item.desart || '')}
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-muted" style={{ fontSize: '9px' }}>
                        {item.codeart}
                      </div>
                      <div className="text-success" style={{ fontSize: '9px' }}>
                        {isArabic ? "متاح" : "Disponible"}: {resolvedBaseAvailable.toLocaleString()}
                      </div>
                    </div>
                    {hasExistingQuantity && (
                      <div
                        className="text-primary"
                        style={{ fontSize: '9px', fontWeight: 600 }}
                      >
                        {isArabic ? "مسجل سابقًا" : "Enregistré précédemment"}: {existingQuantity.toLocaleString()}
                      </div>
                    )}
                    <div className="text-muted" style={{ fontSize: '9px' }}>
                      {isArabic ? "الهيكل" : "Structure"}: {resolvedStructureCode || (isArabic ? 'غير معروف' : 'Inconnu')}
                    </div>
                  </div>
                  <div className={`d-flex align-items-center gap-1 ${isArabic ? 'ms-2' : 'me-2'}`}>
                    <QuantityInput
                      value={item.quantity ?? 0}
                      onChange={(newQuantity) => onUpdateQuantity(item.codeart, newQuantity)}
                      min={0}
                      max={isProductionStructure ? undefined : baseAvailableQuantity}
                      isArabic={isArabic}
                    />
                    <CButton
                      color="danger"
                      size="sm"
                      onClick={() => onRemoveFromCart(item.codeart)}
                      style={{
                        padding: '1px 3px',
                        fontSize: '8px',
                        minWidth: 'auto',
                        borderRadius: '3px',
                        background: 'var(--danger)',
                        border: 'none'
                      }}
                    >
                      <FaIcon icon="fa-times" />
                    </CButton>
                  </div>
                </div>
              </div>
            )})}
          </div>
          
          {/* Footer minimal */}
          <div className="cart-summary mt-2 p-1 rounded text-center" 
               style={{ 
                 background: 'var(--accent-light)',
               }}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: '600',
              color: 'var(--accent-color)'
            }}>
              إجمالي العناصر: {totalItems}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

// Configuration constants
const FORM_CONFIG = {
  initialData: {
    mortality: '',
    added: '',
    removed: '',
    sale: '',
    weight: '',
    water: '',
    amount: '',
    temperature: '',
    humidity: '',
    naturalLight: '',
    internalLight: '',
    notes: '',
    tsemaine: '',
    tjour: '',
    effectif: '',
    lotStatus: 'encours',
    souche: '',
    teffectif_global: '',
    tdate: new Date().toISOString().split('T')[0],
    nummvt: '',
    numLot: '',
    tcodeesp: '',
    tespece: '',
    tespecearabe: '',
    tmtv: '',
    tpoidsoeuf: '',
    tqtev: '',
    tpoidsv: '',
    tmortalite: '',
    talimrest: '',
    tconseaulot: '',
    ttemperlot: '',
    thumiditelot: '',
    teclairlot: '',
    tintlumlot: '',
    teffajout: '',
    teffretire: '',
    teffectifj: '',
    tmortmale: '',
    tstockoeuf: '',
    tstockplat: '',
    tnomjour: '',
    effectif_paramsouche: '',
    tnbralveole: ''
  },
  lotStatusOptions: [
    { value: 'encours', label: 'قيد التنفيذ', icon: <FaIcon icon="fa-play-circle" /> },
    { value: 'cloturee', label: 'مغلقة', icon: <FaIcon icon="fa-check-circle" /> },
  ]
};

// Clé pour le localStorage
const CART_STORAGE_KEY = 'layer_dashboard_cart';
const SELECTIONS_STORAGE_KEY = 'layer_dashboard_selections';

// Main LayerDashboard component
const LayerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { t: tField } = useTranslationField();
  
  // State declarations
  const [miseplaces, setMiseplaces] = useState([]);
  const [structures, setStructures] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryDepot, setInventoryDepot] = useState({ code: '', label: '' });
  const [uniqueSiteOptions, setUniqueSiteOptions] = useState([]);
  const [miseplacesError, setMiseplacesError] = useState(null);
  
  // Restaurer les sélections depuis localStorage (sans selectedSite et selectedBatiment)
  const restoreSelections = () => {
    try {
      const savedSelections = localStorage.getItem(SELECTIONS_STORAGE_KEY);
      if (savedSelections) {
        const parsed = JSON.parse(savedSelections);
        return {
          selectedStructure: parsed.selectedStructure || '',
          quantityInputs: parsed.quantityInputs || {},
          enteredQuantities: parsed.enteredQuantities || {},
          formDataFields: parsed.formDataFields || {}
        };
      }
    } catch (err) {
      console.warn('⚠️ Impossible de parser les sélections depuis le stockage local:', err);
    }
    return {
      selectedStructure: '',
      quantityInputs: {},
      enteredQuantities: {},
      formDataFields: {}
    };
  };

  const restoredSelections = restoreSelections();
  
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBatiment, setSelectedBatiment] = useState('');
  const [selectedStructure, setSelectedStructure] = useState(restoredSelections.selectedStructure);
  const nomBaseStockSession = getDatabaseChoice();
  
  const [formData, setFormData] = useState(() => {
    const initialData = { ...FORM_CONFIG.initialData };
    Object.keys(initialData).forEach(key => {
      if (initialData[key] === undefined) {
        initialData[key] = '';
      }
    });
    // Restaurer les champs sauvegardés
    if (restoredSelections.formDataFields) {
      Object.keys(restoredSelections.formDataFields).forEach(key => {
        if (restoredSelections.formDataFields[key] !== undefined && restoredSelections.formDataFields[key] !== '') {
          initialData[key] = restoredSelections.formDataFields[key];
        }
      });
    }
    // Toujours forcer lotStatus à 'encours' par défaut
    initialData.lotStatus = 'encours';
    return initialData;
  });
  
  const [enteredQuantities, setEnteredQuantities] = useState(restoredSelections.enteredQuantities);
  const [formErrors, setFormErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [jourEnCoursData, setJourEnCoursData] = useState(null);
  const [jourEnCoursError, setJourEnCoursError] = useState(null);
  const [lmvtMovements, setLmvtMovements] = useState([]);
  const [lmvtLoading, setLmvtLoading] = useState(false);
  const [lmvtError, setLmvtError] = useState(null);
  
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      return [];
    }
    try {
      const parsed = JSON.parse(savedCart);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const normalized = parsed.map((item) => ({
        ...item,
        libdep: item.depotCode || item.codeDep || '',
        depotCode: item.depotCode || item.codeDep  ||  '',
        depotLabel: item.depotLabel || item.libDep || ''
      }));
      return sortCartItemsByCode(normalized);
    } catch (err) {
      console.warn('⚠️ Impossible de parser le panier depuis le stockage local:', err);
      return [];
    }
  });
  
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [quantityInputs, setQuantityInputs] = useState(restoredSelections.quantityInputs);
  const [quantityErrors, setQuantityErrors] = useState({});
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  
  // États pour la pagination du DataTable
  const [inventoryCurrentPage, setInventoryCurrentPage] = useState(1);
  const [inventoryItemsPerPage, setInventoryItemsPerPage] = useState(10);
  const [inventorySortConfig, setInventorySortConfig] = useState({ key: null, direction: 'asc' });

  const [loading, setLoading] = useState({
    validation: false,
  });
  const [activeDate, setActiveDate] = useState(() => FORM_CONFIG.initialData.tdate || getTodayIsoDate());
  const [activeJour, setActiveJour] = useState(null);
  const [activeSemaine, setActiveSemaine] = useState(null);
  const [activeNumMvt, setActiveNumMvt] = useState('');
  const [dayNavigationLoading, setDayNavigationLoading] = useState(false);
  
  // Référence pour suivre si c'est la première restauration
  const isInitialRestore = useRef(true);
  
  // Référence pour suivre les valeurs précédentes du jour
  const prevDayRef = useRef({ activeJour: null, activeDate: null, activeSemaine: null });

  const todayIsoDate = useMemo(() => getTodayIsoDate(), []);
  const isNavigationContextReady = useMemo(
    () => Boolean(selectedSite && selectedBatiment && formData.numLot),
    [selectedSite, selectedBatiment, formData.numLot]
  );
  const isCurrentDayClosed = useMemo(() => {
    if (!jourEnCoursData) {
      return false;
    }
    
    // Vérifier directement les valeurs de clôture en priorité absolue
    // Si cloture ou tcloturer existent, on les utilise et on ignore les autres champs
    const clotureValue = jourEnCoursData.cloture;
    const tcloturerValue = jourEnCoursData.tcloturer;
    
    // Test direct pour cloture (priorité absolue)
    // Si cloture est une valeur numérique 0/1 valide, on l'utilise directement
    // Si cloture est une date (null), on l'ignore et on cherche dans les autres candidats
    if (clotureValue !== undefined && clotureValue !== null) {
      const interpreted = interpretClosureValue(clotureValue);
      console.log('🔍 cloture détecté:', clotureValue, 'type:', typeof clotureValue, 'interprété:', interpreted);
      // Si c'est une valeur valide (0/1), on l'utilise directement
      if (interpreted !== null) {
        return interpreted;
      }
      // Si c'est une date (null), on continue à chercher dans les autres candidats
      // Ne pas retourner false ici, continuer la recherche
    }
    
    // Test direct pour tcloturer (priorité absolue)
    // Si tcloturer est une valeur numérique 0/1 valide, on l'utilise directement
    // Si tcloturer est une date (null), on l'ignore et on cherche dans les autres candidats
    if (tcloturerValue !== undefined && tcloturerValue !== null) {
      const interpreted = interpretClosureValue(tcloturerValue);
      console.log('🔍 tcloturer détecté:', tcloturerValue, 'type:', typeof tcloturerValue, 'interprété:', interpreted);
      // Si c'est une valeur valide (0/1), on l'utilise directement
      if (interpreted !== null) {
        return interpreted;
      }
      // Si c'est une date (null), on continue à chercher dans les autres candidats
      // Ne pas retourner false ici, continuer la recherche
    }
    
    // Si cloture ou tcloturer n'existent pas, chercher dans les autres candidats
    const candidates = [
      jourEnCoursData?.isCloture,
      jourEnCoursData?.jourCloture,
      jourEnCoursData?.jour_cloture,
      jourEnCoursData?.jourStatus,
      jourEnCoursData?.statusJour,
      jourEnCoursData?.etatJour,
      jourEnCoursData?.etatjour,
      jourEnCoursData?.etat_jour,
      jourEnCoursData?.etat,
      jourEnCoursData?.status,
      jourEnCoursData?.isClosed,
      // Ne pas utiliser lotStatus car il peut être "encours" même si le jour est clôturé
      // jourEnCoursData?.lotStatus,
      // jourEnCoursData?.LotStatus,
      // formData?.lotStatus,
    ];
    
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (candidate === undefined || candidate === null) {
        continue;
      }
      const interpreted = interpretClosureValue(candidate);
      if (interpreted !== null) {
        console.log('✅ Jour clôturé détecté via candidat:', i, 'valeur:', candidate);
        return interpreted;
      }
    }
    
    // Si aucune valeur n'est trouvée, retourner false (jour non clôturé)
    console.log('⚠️ Aucune valeur de clôture détectée. Données:', {
      cloture: jourEnCoursData?.cloture,
      tcloturer: jourEnCoursData?.tcloturer,
      typeCloture: typeof jourEnCoursData?.cloture,
      typeTcloturer: typeof jourEnCoursData?.tcloturer
    });
    return false;
  }, [jourEnCoursData, formData?.lotStatus]);
  const displayedDate = formData.tdate || activeDate || '';
  const activeDateLabel = useMemo(() => {
    if (!displayedDate) {
      return '';
    }
    const tjourValue = formData.tjour || jourEnCoursData?.tjour || activeJour;
    const tsemaineValue = formData.tsemaine || jourEnCoursData?.tsemaine || activeSemaine;
    
    // Vérifier que les valeurs sont valides (non vides, non nulles, et > 0 pour les nombres)
    const tjour = (tjourValue !== null && tjourValue !== undefined && tjourValue !== '' && Number(tjourValue) > 0) ? tjourValue : null;
    const tsemaine = (tsemaineValue !== null && tsemaineValue !== undefined && tsemaineValue !== '' && Number(tsemaineValue) > 0) ? tsemaineValue : null;
    
    const parts = [];
    if (displayedDate) {
      parts.push(displayedDate);
    }
    if (tsemaine) {
      parts.push(isArabic ? `الأسبوع: ${tsemaine}` : `Semaine: ${tsemaine}`);
    }
    if (tjour) {
      parts.push(isArabic ? `اليوم: ${tjour}` : `Jour: ${tjour}`);
    }
    return parts.length > 0 ? parts.join(' - ') : displayedDate;
  }, [displayedDate, formData.tjour, formData.tsemaine, jourEnCoursData?.tjour, jourEnCoursData?.tsemaine, activeJour, activeSemaine, isArabic]);
  // Common validation for navigation
  const navigationValidationError = useMemo(() => {
    if (!isNavigationContextReady) {
      return isArabic ? 'يرجى اختيار الموقع والحظيرةوالدفعة أولاً' : 'Veuillez d\'abord sélectionner le centre, le bâtiment et le lot';
    }
    if (!displayedDate) {
      return isArabic ? 'لا يوجد تاريخ محدد لهذا اليوم' : 'Aucune date spécifiée pour ce jour';
    }
    return '';
  }, [isNavigationContextReady, displayedDate, isArabic]);

  const previousButtonDisabledReason = useMemo(() => {
    if (navigationValidationError) {
      return navigationValidationError;
    }
    // Allow navigation to previous day regardless of closure status
    return '';
  }, [navigationValidationError]);
  
  const canNavigateBackward = useMemo(
    () => previousButtonDisabledReason === '',
    [previousButtonDisabledReason]
  );
  
  const nextButtonDisabledReason = useMemo(() => {
    if (navigationValidationError) {
      return navigationValidationError;
    }
    // Le bouton suivant est accessible seulement si le jour actuel est clôturé
    if (!isCurrentDayClosed) {
      return isArabic ? 'يجب تأكيد اختتام اليوم الحالي قبل الانتقال إلى اليوم التالي' : 'Vous devez valider et clôturer le jour actuel avant de passer au jour suivant';
    }
    // Si le jour est clôturé, le bouton est accessible
    return '';
  }, [navigationValidationError, isCurrentDayClosed, isArabic]);
  const canNavigateForward = useMemo(
    () => nextButtonDisabledReason === '',
    [nextButtonDisabledReason]
  );

  const itemsPerPage = 6;

  // Define fetchMiseplaces before using it in useEffect
  const fetchMiseplaces = useCallback(async (numcentre, lotStatusOverride) => {
    if (!numcentre) return;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
      const statusToUse = lotStatusOverride ?? formData?.lotStatus ?? FORM_CONFIG.initialData.lotStatus;
      const lotStatusAlpha = (statusToUse === 'encours') ? 'N' : 'O';
      const response = await api.get(`${API_ENDPOINTS.miseplaces}?numcentre=${numcentre}&lotStatus=${lotStatusAlpha}&codeuser=${encodeURIComponent(codeuser)}`);
      if (response.data.success) {
        const miseplacesData = response.data.miseplaces || response.data.data?.miseplaces || [];
        setMiseplaces(normalizeApiResponseDates(miseplacesData));
        if (miseplacesData.length > 0) {
          setMiseplacesError(null);
        } else {
          setSelectedBatiment('');
          setMiseplacesError(isArabic ? 'لا توجد مباني متاحة لهذا الموقع' : 'Aucun bâtiment disponible pour ce centre');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des miseplaces:', error);
      const status = error?.response?.status;
      if (status === 401) {
        navigate('/login');
        return;
      }
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      const msg = status === 500 ? (isArabic ? 'خطأ خادم داخلي' : 'Erreur serveur interne') : serverMsg || (isArabic ? 'فشل في تحميل البيانات' : 'Échec du chargement des données');
      setMiseplacesError(msg);
    }
  }, [formData?.lotStatus, navigate]);

  // Initialize from navigation state if coming from Miseplaces list
  useEffect(() => {
    if (location.state && location.state.fromMiseplacesList) {
      const { 
        selectedSite: navSite, 
        selectedBatiment: navBatiment, 
        selectedMiseplace,
        numMvt,
        numLot,
        libellecentre,
        libbat,
        filterStatus,
        lotStatus: navLotStatus
      } = location.state;

      const resolvedLotStatus = filterStatus || navLotStatus || 'encours';

      setFormData(prev => ({
        ...prev,
        lotStatus: resolvedLotStatus,
        nummvt: selectedMiseplace?.nummvt || numMvt || prev.nummvt || '',
        numLot: selectedMiseplace?.numlot || numLot || prev.numLot || '',
      }));
      
      // Show success notification
      setAlertMessage(isArabic ? `تم تحميل بيانات ${libellecentre || 'الموقع'} - ${libbat || 'الحظيرة'} بنجاح` : `Données de ${libellecentre || 'centre'} - ${libbat || 'bâtiment'} chargées avec succès`);
      setAlertType('info');
      setShowAlert(true);
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      
      if (navSite) {
        setSelectedSite(navSite);
        // Fetch miseplaces for this site
        fetchMiseplaces(navSite, resolvedLotStatus);
      }
      
      if (navBatiment) {
        setSelectedBatiment(navBatiment);
      }
      
      // Clear the navigation state to prevent re-initialization on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchMiseplaces]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Sauvegarder les sélections dans localStorage (sans selectedSite et selectedBatiment)
  useEffect(() => {
    const selectionsToSave = {
      selectedStructure,
      quantityInputs,
      enteredQuantities,
      formDataFields: {
        numLot: formData.numLot,
        lotStatus: formData.lotStatus,
        nummvt: formData.nummvt,
        tdate: formData.tdate
      }
    };
    localStorage.setItem(SELECTIONS_STORAGE_KEY, JSON.stringify(selectionsToSave));
  }, [selectedStructure, quantityInputs, enteredQuantities, formData.numLot, formData.lotStatus, formData.nummvt, formData.tdate]);

  useEffect(() => {
    if (!selectedStructure && structures.length > 0) {
      const firstStructureCode = structures[0]?.code || structures[0]?.Code || '';
      if (firstStructureCode) {
        setSelectedStructure(firstStructureCode);
      }
    }
  }, [structures, selectedStructure]);

  const selectedMiseplace = useMemo(() => {
    return miseplaces.find((m) => m.numbat === selectedBatiment);
  }, [miseplaces, selectedBatiment]);

  const isProductionStructure = useMemo(
    () => normalizeArticleCode(selectedStructure) === '006',
    [selectedStructure]
  );

  const productionDailyLimit = useMemo(() => {
    const candidates = [
      formData?.teffectifj,
      jourEnCoursData?.teffectifj,
      formData?.effectif,
      jourEnCoursData?.effectif,
    ];
    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 0;
  }, [formData?.effectif, formData?.teffectifj, jourEnCoursData?.effectif, jourEnCoursData?.teffectifj]);

  const targetMovementFilters = useMemo(() => {
    const candidateNumMvt =
      selectedMiseplace?.nummvt ||
      formData?.nummvt ||
      jourEnCoursData?.NumMvt ||
      jourEnCoursData?.nummvt ||
      '';

    const rawDate =
      selectedMiseplace?.datemvt ||
      jourEnCoursData?.datemvt ||
      jourEnCoursData?.DateMvt ||
      jourEnCoursData?.dateMvt ||
      formData?.tdate ||
      '';

    const normalizedDate = resolveApiDate(rawDate, formData?.tdate);

    return {
      targetNumMvt: candidateNumMvt,
      targetDate: normalizedDate,
    };
  }, [selectedMiseplace, formData, jourEnCoursData]);

  const { targetNumMvt, targetDate } = targetMovementFilters;

  const jourMovementsMap = useMemo(
    () => extractMovementsMap(jourEnCoursData, { targetNumMvt, targetDate }),
    [jourEnCoursData, targetNumMvt, targetDate]
  );

  const lmvtMovementsMap = useMemo(
    () => extractMovementsMap(lmvtMovements, { targetNumMvt, targetDate }),
    [lmvtMovements, targetNumMvt, targetDate]
  );

  useEffect(() => {
    if (!targetNumMvt || !targetDate) {
      setLmvtError(null);
      setLmvtMovements([]);
      setLmvtLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchLmvtMovements = async () => {
      try {
        setLmvtLoading(true);
        setLmvtError(null);

        const params = new URLSearchParams({ nummvt: targetNumMvt, date: targetDate });

        const response = await api.get(`${API_ENDPOINTS.lmvt}?${params.toString()}`);
        if (isCancelled) {
          return;
        }

        if (response?.data?.success) {
          const payload =
            response.data.data ??
            response.data.lignes ??
            response.data.lmvt ??
            response.data.items ??
            [];

          setLmvtMovements(Array.isArray(payload) ? normalizeApiResponseDates(payload) : []);
        } else {
          const fallbackMessage =
            response?.data?.message ||
            response?.data?.error ||
            'فشل في تحميل الحركات السابقة';
          setLmvtMovements([]);
          setLmvtError(fallbackMessage);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error('Erreur lors du chargement des mouvements LMVT:', error);
        const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
        const fallbackMessage = serverMsg || error?.message || (isArabic ? 'فشل في تحميل الحركات السابقة' : 'Échec du chargement des mouvements précédents');
        setLmvtMovements([]);
        setLmvtError(fallbackMessage);
      } finally {
        if (!isCancelled) {
          setLmvtLoading(false);
        }
      }
    };

    fetchLmvtMovements();

    return () => {
      isCancelled = true;
    };
  }, [targetNumMvt, targetDate]);

  const existingMovementsMap = useMemo(() => {
    if (!jourMovementsMap.size && !lmvtMovementsMap.size) {
      return new Map();
    }

    const merged = new Map(jourMovementsMap);
    lmvtMovementsMap.forEach((value, key) => {
      merged.set(key, value);
    });
    return merged;
  }, [jourMovementsMap, lmvtMovementsMap]);

  const resolveInventoryIdentifiers = useCallback((item) => {
    if (!item || typeof item !== 'object') {
      return { code: '', famille: '', depot: '' };
    }

    const code = normalizeArticleCode(item.codeart || item.CodeArt || item.codeArt || '');
    const famille = (item.famille || item.Famille || item.codefam || item.codeFamille || '').toString().trim().toUpperCase();
    const depot = (item.codeDep || item.codeDepBat || item.depotCode || '').toString().trim().toUpperCase();
    return { code, famille, depot };
  }, []);

  const resolveBaseAvailableQuantity = useCallback((sourceItem) => {
    if (!sourceItem || typeof sourceItem !== 'object') {
      return 0;
    }

    const candidates = [
      sourceItem.qteart,
      sourceItem.QteArt,
      sourceItem.qteArt,
      sourceItem.Qte,
      sourceItem.available,
      sourceItem.availableQuantity,
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 0;
  }, []);

  const isMovementProduction = useMemo(() => {
    const normalizedNum = normalizeMovementIdentifier(
      targetMovementFilters?.targetNumMvt ||
      jourEnCoursData?.NumMvt ||
      formData?.nummvt ||
      ''
    );
    return normalizedNum.startsWith('RP');
  }, [formData?.nummvt, jourEnCoursData?.NumMvt, targetMovementFilters?.targetNumMvt]);

  const resolveStructureCode = useCallback(
    (sourceItem) => {
      const value =
        sourceItem?.cnature ||
        sourceItem?.cNature ||
        sourceItem?.CNature ||
        sourceItem?.c_nature ||
        sourceItem?.C_NATURE ||
        sourceItem?.Nature ||
        sourceItem?.structure ||
        sourceItem?.Structure ||
        (isMovementProduction ? '006' : selectedStructure) ||
        '';
      return normalizeArticleCode(value);
    },
    [isMovementProduction, selectedStructure]
  );

  // Calculer la quantité totale de production et vérifier si elle dépasse la limite
  const totalProductionQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const resolvedStructure = resolveStructureCode(item);
      if (resolvedStructure !== '006') {
        return sum;
      }
      const quantity = Number(item.quantity ?? item.QteArt ?? item.qteart ?? item.Qte ?? 0);
      return sum + (Number.isFinite(quantity) && quantity >= 0 ? quantity : 0);
    }, 0);
  }, [cartItems, resolveStructureCode]);

  const isProductionOverLimit = productionDailyLimit > 0 && totalProductionQuantity > productionDailyLimit;

  const getExistingMovementQuantityForItem = useCallback(
    (item) => {
      if (!item) {
        return 0;
      }

      const { code, famille, depot } = resolveInventoryIdentifiers(item);
      if (!code) {
        return 0;
      }

      const compositeKey = buildCompositeKey(code, famille, depot);
      const movement =
        existingMovementsMap.get(compositeKey) ||
        existingMovementsMap.get(code);

      const quantity = Number(movement?.quantity);
      return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    },
    [existingMovementsMap, resolveInventoryIdentifiers]
  );

  const getRemainingAdditionCapacity = useCallback(
    (item) => {
      const baseAvailable = resolveBaseAvailableQuantity(item);
      if (isMovementProduction || resolveStructureCode(item) === '006') {
        return baseAvailable;
      }
      const existingMovementQuantity = getExistingMovementQuantityForItem(item);
      const remaining = baseAvailable - existingMovementQuantity;
      return remaining > 0 ? remaining : 0;
    },
    [isMovementProduction, resolveBaseAvailableQuantity, getExistingMovementQuantityForItem, resolveStructureCode]
  );

  useEffect(() => {
    if (!existingMovementsMap.size) {
      return;
    }

    setCartItems((prevCart) => {
      if (!Array.isArray(prevCart)) {
        return prevCart;
      }

      const cartMap = new Map();
      prevCart.forEach((cartItem) => {
        const normalizedCode = normalizeArticleCode(cartItem.codeart || cartItem.CodeArt || '');
        if (!normalizedCode) {
          return;
        }
        cartMap.set(normalizedCode, cartItem);
      });

      let hasChange = false;
      const processedCodes = new Set();

      existingMovementsMap.forEach((movementValue) => {
        const rawMovement = movementValue?.raw || movementValue;
        const normalizedCode = normalizeArticleCode(
          movementValue?.codeart ||
            movementValue?.CodeArt ||
            movementValue?.codeArt ||
            rawMovement?.CodeArt ||
            rawMovement?.codeart ||
            ''
        );

        if (!normalizedCode || processedCodes.has(normalizedCode)) {
          return;
        }
        processedCodes.add(normalizedCode);

        const quantityCandidates = [
          movementValue?.quantity,
          rawMovement?.Qte,
          rawMovement?.qte,
          rawMovement?.qteart,
          rawMovement?.QteArt,
        ];
        const resolvedQuantity = quantityCandidates.reduce((acc, candidate) => {
          if (acc > 0) {
            return acc;
          }
          const parsed = Number(candidate);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : acc;
        }, 0);

        if (resolvedQuantity <= 0) {
          return;
        }

        const movementFamille = (movementValue?.famille || rawMovement?.famille || '').toString().trim().toUpperCase();
        const movementDepot = (movementValue?.depot || movementValue?.codedep || rawMovement?.codedep || rawMovement?.codeDep || '').toString().trim().toUpperCase();

        const inventoryMatch =
          inventory.find((inv) => {
            const invCode = normalizeArticleCode(inv.codeart || inv.CodeArt || '');
            if (invCode !== normalizedCode) {
              return false;
            }
            const invFamille = (inv.famille || inv.Famille || inv.codefam || inv.codeFamille || '').toString().trim().toUpperCase();
            const invDepot = (inv.codeDep || inv.codeDepBat || inv.depotCode || '').toString().trim().toUpperCase();

            if (movementFamille && invFamille && movementFamille !== invFamille) {
              return false;
            }

            if (movementDepot && invDepot && movementDepot !== invDepot) {
              return false;
            }

            return true;
          }) ||
          inventory.find((inv) => normalizeArticleCode(inv.codeart || inv.CodeArt || '') === normalizedCode);

        const existingCartItem = cartMap.get(normalizedCode);

        const resolvedDepotCode =
          inventoryMatch?.codeDep ||
          inventoryMatch?.codeDepBat ||
          inventoryMatch?.depotCode ||
          movementValue?.codedep ||
          movementValue?.depot ||
          rawMovement?.codedep ||
          rawMovement?.codeDep ||
          existingCartItem?.depotCode ||
          '';

        const resolvedDepotLabel =
          inventoryMatch?.libDep ||
          inventoryMatch?.depotLabel ||
          rawMovement?.libdep ||
          existingCartItem?.depotLabel ||
          existingCartItem?.libdep ||
          '';

        const resolvedFamille =
          (inventoryMatch?.famille ||
            inventoryMatch?.Famille ||
            inventoryMatch?.codefam ||
            movementValue?.famille ||
            rawMovement?.famille ||
            existingCartItem?.famille ||
            existingCartItem?.Famille ||
            '').toString().trim();

        const resolvedNature =
          movementValue?.structure ||
          movementValue?.cnature ||
          movementValue?.cNature ||
          movementValue?.CNature ||
          movementValue?.c_nature ||
          movementValue?.C_NATURE ||
          movementValue?.Nature ||
          rawMovement?.cnature ||
          rawMovement?.cNature ||
          rawMovement?.CNature ||
          rawMovement?.c_nature ||
          rawMovement?.C_NATURE ||
          rawMovement?.Nature ||
          existingCartItem?.cnature ||
          existingCartItem?.cNature ||
          existingCartItem?.CNature ||
          existingCartItem?.c_nature ||
          existingCartItem?.C_NATURE ||
          inventoryMatch?.cnature ||
          inventoryMatch?.cNature ||
          inventoryMatch?.CNature ||
          inventoryMatch?.c_nature ||
          inventoryMatch?.C_NATURE ||
          inventoryMatch?.Nature ||
          (isMovementProduction ? '006' : selectedStructure) ||
          '';

        const resolvedDescription =
          inventoryMatch?.desart ||
          inventoryMatch?.Libelle ||
          rawMovement?.desart ||
          rawMovement?.Libelle ||
          existingCartItem?.desart ||
          normalizedCode;
        
        const resolvedLibarabe =
          inventoryMatch?.libarabe ||
          rawMovement?.libarabe ||
          existingCartItem?.libarabe ||
          '';

        if (existingCartItem && existingCartItem.quantity === resolvedQuantity) {
          return;
        }

        const nextItem = {
          ...(inventoryMatch || rawMovement || existingCartItem || {}),
          codeart: inventoryMatch?.codeart || rawMovement?.codeart || existingCartItem?.codeart || normalizedCode,
          desart: resolvedDescription,
          libarabe: resolvedLibarabe,
          qteart: inventoryMatch?.qteart ?? existingCartItem?.qteart ?? rawMovement?.qteart ?? existingCartItem?.qteart ?? 0,
          quantity: resolvedQuantity,
          libdep: resolvedDepotLabel || resolvedDepotCode,
          depotLabel: resolvedDepotLabel || resolvedDepotCode,
          depotCode: resolvedDepotCode,
          famille: resolvedFamille,
          Famille: resolvedFamille,
          codefam: inventoryMatch?.codefam || inventoryMatch?.codeFamille || existingCartItem?.codefam || resolvedFamille,
          cnature: resolvedNature,
          cNature: resolvedNature,
          CNature: resolvedNature,
          c_nature: resolvedNature,
          C_NATURE: resolvedNature,
          Nature: resolvedNature,
        };

        cartMap.set(normalizedCode, nextItem);
        hasChange = true;
      });

      if (!hasChange) {
        return prevCart;
      }

      return sortCartItemsByCode(Array.from(cartMap.values()));
    });
  }, [existingMovementsMap, inventory, isMovementProduction, selectedStructure]);

  useEffect(() => {
    setSelectedItems((prev) => {
      const desired = new Set(cartItems.map((item) => item.codeart));
      if (desired.size === prev.size) {
        let identical = true;
        // eslint-disable-next-line no-loops/no-loops
        for (const code of prev) {
          if (!desired.has(code)) {
            identical = false;
            break;
          }
        }
        if (identical) {
          return prev;
        }
      }
      return desired;
    });
  }, [cartItems]);

  const debouncedEnteredQuantities = useDebounce(enteredQuantities, 500);

  // Fonction de tri pour l'inventaire
  const handleInventorySort = (key) => {
    let direction = 'asc';
    if (inventorySortConfig.key === key && inventorySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setInventorySortConfig({ key, direction });
  };

  // Filtrer et trier l'inventaire
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter((item) => {
      if (!articleSearchTerm) return true;
      const search = articleSearchTerm.toLowerCase();
      const code = (item.codeart || item.CodeArt || '').toLowerCase();
      const libelle = (item.desart || item.libelle || item.Libelle || item.libarabe || '').toLowerCase();
      return code.includes(search) || libelle.includes(search);
    });

    // Tri
    if (inventorySortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[inventorySortConfig.key] || '';
        let bValue = b[inventorySortConfig.key] || '';
        
        if (inventorySortConfig.key === 'codeart' || inventorySortConfig.key === 'desart') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (aValue < bValue) return inventorySortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return inventorySortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventory, articleSearchTerm, inventorySortConfig]);

  // Pagination de l'inventaire
  const inventoryTotalPages = Math.ceil(filteredAndSortedInventory.length / inventoryItemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
    return filteredAndSortedInventory.slice(startIndex, startIndex + inventoryItemsPerPage);
  }, [filteredAndSortedInventory, inventoryCurrentPage, inventoryItemsPerPage]);

  // Reset page quand la recherche change
  useEffect(() => {
    setInventoryCurrentPage(1);
  }, [articleSearchTerm]);

  useEffect(() => {
    if (!selectedSite || !selectedBatiment) {
      setFormData((prev) => ({ ...FORM_CONFIG.initialData, lotStatus: prev.lotStatus || 'encours' }));
      setJourEnCoursData(null);
      setInventory([]);
      setInventoryDepot({ code: '', label: '' });
      setCartItems([]);
      setSelectedItems(new Set());
      setQuantityInputs({});
    }
  }, [selectedSite, selectedBatiment]);

  useEffect(() => {
    setCartItems((prev) => {
      if (!prev.length) {
        return prev;
      }

      let hasChange = false;
      const updated = prev.map((item) => {
        const inventoryMatch = inventory.find((inv) => inv.codeart === item.codeart);

        const resolvedDepotCode = (
          inventoryMatch?.depotCode ||
          inventoryMatch?.codeDep ||
          item.depotCode ||
          inventoryDepot.code ||
          selectedMiseplace?.codeDepBat ||
          selectedMiseplace?.numbat ||
          ''
        ).toString().trim();

        const resolvedDepotLabel = (
          inventoryMatch?.depotLabel ||
          inventoryMatch?.libDep ||
          item.depotLabel ||
          inventoryDepot.label ||
          selectedMiseplace?.libDepBat ||
          selectedMiseplace?.libbat ||
          ''
        ).toString().trim();

        const currentDepotCode = (item.depotCode || item.libdep || '').toString().trim();
        const currentDepotLabel = (item.depotLabel || item.libDep || '').toString().trim();

        if (resolvedDepotCode && (resolvedDepotCode !== currentDepotCode || resolvedDepotCode !== item.libdep || resolvedDepotLabel !== currentDepotLabel)) {
          hasChange = true;
          return {
            ...item,
            libdep: resolvedDepotCode,
            depotCode: resolvedDepotCode,
            depotLabel: resolvedDepotLabel
          };
        }

        return item;
      });

      return hasChange ? sortCartItemsByCode(updated) : prev;
    });
  }, [inventory, inventoryDepot.code, inventoryDepot.label, selectedMiseplace]);

  const addToCart = useCallback((item, quantity = 0) => {
    const baseAvailableQuantity = resolveBaseAvailableQuantity(item);
    const existingMovementQuantity = getExistingMovementQuantityForItem(item);
    const isStructure006 = isMovementProduction || resolveStructureCode(item) === '006';
    const totalCapacity = isStructure006
      ? Number.MAX_SAFE_INTEGER
      : baseAvailableQuantity + existingMovementQuantity;
    const parsedQuantity = Number(quantity);
    const requestedQuantity = Number.isNaN(parsedQuantity) ? 0 : parsedQuantity;
    const sanitizedQuantity = Math.max(0, requestedQuantity);

    const resetQuantityInput = () => {
      setQuantityInputs((prev) => ({
        ...prev,
        [item.codeart]: 0,
      }));
    };

    if (sanitizedQuantity <= 0) {
      resetQuantityInput();
      setQuantityErrors((prev) => ({
        ...prev,
        [item.codeart]: isArabic ? 'يرجى إدخال كمية صالحة أكبر من الصفر' : 'Veuillez entrer une quantité valide supérieure à zéro'
      }));
      return;
    }

    if (!isStructure006 && sanitizedQuantity > totalCapacity) {
      resetQuantityInput();
      setQuantityErrors((prev) => ({
        ...prev,
        [item.codeart]: isArabic ? '⚠️ الكمية المدخلة أكبر من الرصيد المتاح.' : '⚠️ La quantité saisie dépasse le stock disponible.'
      }));
      return;
    }

    const resolveDepotCode = (sourceItem) => {
      const value =
        sourceItem.depotCode ||
        sourceItem.codeDep ||
        inventoryDepot.code ||
        selectedMiseplace?.codeDepBat ||
        sourceItem.libdep ||
        sourceItem.LibDep ||
        selectedMiseplace?.numbat ||
        '';
      return value ? value.toString().trim() : '';
    };

    const resolveDepotLabel = (sourceItem) => {
      const value =
        sourceItem.depotLabel ||
        sourceItem.libDep ||
        sourceItem.libdep ||
        inventoryDepot.label ||
        selectedMiseplace?.libDepBat ||
        selectedMiseplace?.libbat ||
        '';
      return value ? value.toString().trim() : '';
    };

    const resolveFamille = (sourceItem) => {
      const value =
        sourceItem.famille ||
        sourceItem.Famille ||
        sourceItem.codefam ||
        sourceItem.codeFamille ||
        sourceItem.fam ||
        sourceItem.famart ||
        '';
      return value ? value.toString().trim() : '';
    };

    const resolveNature = (sourceItem) => {
      const value =
        sourceItem.cnature ||
        sourceItem.cNature ||
        sourceItem.CNature ||
        sourceItem.c_nature ||
        sourceItem.C_NATURE ||
        sourceItem.Nature ||
        sourceItem.nature ||
        selectedStructure ||
        '';
      return value ? value.toString().trim() : '';
    };

    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.codeart === item.codeart);
      const depotCode = resolveDepotCode(item);
      const depotLabel = resolveDepotLabel(item);
      const famille = resolveFamille(item);
      const nature = resolveNature(item);
      const finalQuantity = isStructure006
        ? sanitizedQuantity
        : Math.min(sanitizedQuantity, totalCapacity);

      if (existingItem) {
        const updatedCart = prev.map((cartItem) => {
          if (cartItem.codeart !== item.codeart) {
            return cartItem;
          }

          const normalizedFamilleValue =
            famille || cartItem.famille || cartItem.Famille || '';
          const normalizedNatureValue =
            nature ||
            cartItem.cnature ||
            cartItem.cNature ||
            cartItem.CNature ||
            cartItem.c_nature ||
            cartItem.C_NATURE ||
            cartItem.Nature ||
            selectedStructure ||
            '';

          return {
            ...cartItem,
            quantity: finalQuantity,
            libdep: depotCode || cartItem.libdep,
            depotCode: depotCode || cartItem.depotCode,
            depotLabel: depotLabel || cartItem.depotLabel,
            famille: normalizedFamilleValue,
            Famille: normalizedFamilleValue,
            codefam: cartItem.codefam ?? cartItem.codeFamille ?? normalizedFamilleValue,
            cnature: normalizedNatureValue,
            cNature: normalizedNatureValue,
            CNature: normalizedNatureValue,
            c_nature: normalizedNatureValue,
            C_NATURE: normalizedNatureValue,
            Nature: normalizedNatureValue,
          };
        });
        return sortCartItemsByCode(updatedCart);
      }

      const normalizedFamilleValue =
        famille || item.famille || item.Famille || '';
      const normalizedNatureValue =
        nature ||
        item.cnature ||
        item.cNature ||
        item.CNature ||
        item.c_nature ||
        item.C_NATURE ||
        item.Nature ||
        selectedStructure ||
        '';

      const nextCart = [
        ...prev,
        {
          ...item,
          quantity: finalQuantity,
          libdep: depotCode,
          depotCode,
          depotLabel,
          famille: normalizedFamilleValue,
          Famille: normalizedFamilleValue,
          codefam: item.codefam ?? item.codeFamille ?? normalizedFamilleValue,
          cnature: normalizedNatureValue,
          cNature: normalizedNatureValue,
          CNature: normalizedNatureValue,
          c_nature: normalizedNatureValue,
          C_NATURE: normalizedNatureValue,
          Nature: normalizedNatureValue
        }
      ];
      return sortCartItemsByCode(nextCart);
    });

    setSelectedItems((prev) => new Set(prev).add(item.codeart));
    setQuantityInputs((prev) => ({ ...prev, [item.codeart]: sanitizedQuantity }));
    setQuantityErrors((prev) => {
      if (!prev[item.codeart]) return prev;
      const updated = { ...prev };
      delete updated[item.codeart];
      return updated;
    });
  }, [getExistingMovementQuantityForItem, inventoryDepot.code, inventoryDepot.label, isMovementProduction, resolveBaseAvailableQuantity, resolveStructureCode, selectedMiseplace, selectedStructure]);

  const removeFromCart = useCallback((codeart) => {
    setCartItems(prev => sortCartItemsByCode(prev.filter(item => item.codeart !== codeart)));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeart);
      return newSet;
    });
    setQuantityInputs(prev => {
      if (prev[codeart] === undefined) return prev;
      const updated = { ...prev };
      delete updated[codeart];
      return updated;
    });
    setQuantityErrors(prev => {
      if (!prev[codeart]) return prev;
      const updated = { ...prev };
      delete updated[codeart];
      return updated;
    });
  }, []);

  const updateCartQuantity = useCallback((codeart, quantity) => {
    let exceeded = false;

    setCartItems((prev) =>
      sortCartItemsByCode(prev.map((item) => {
        if (item.codeart !== codeart) {
          return item;
        }

        const baseAvailableQuantity = resolveBaseAvailableQuantity(item);
        const existingMovementQuantity = getExistingMovementQuantityForItem(item);
        const isStructure006 = isMovementProduction || resolveStructureCode(item) === '006';
        const totalCapacity = isStructure006
          ? Number.MAX_SAFE_INTEGER
          : baseAvailableQuantity + existingMovementQuantity;
        const parsedQuantity = Number(quantity);
        const sanitizedQuantity = Math.max(0, Number.isNaN(parsedQuantity) ? 0 : parsedQuantity);
        const constrainedQuantity = isStructure006
          ? sanitizedQuantity
          : Math.min(sanitizedQuantity, totalCapacity);

        if (!isStructure006 && sanitizedQuantity > constrainedQuantity) {
          exceeded = true;
        }

        return {
          ...item,
          quantity: constrainedQuantity
        };
      }))
    );

    if (exceeded) {
      setQuantityErrors((prev) => ({
        ...prev,
        [codeart]: isArabic ? 'الكمية المختارة تتجاوز المخزون المتاح' : 'La quantité sélectionnée dépasse le stock disponible'
      }));
      return;
    }

    setQuantityErrors((prev) => {
      if (!prev[codeart]) return prev;
      const updated = { ...prev };
      delete updated[codeart];
      return updated;
    });
  }, [getExistingMovementQuantityForItem, isMovementProduction, resolveBaseAvailableQuantity, resolveStructureCode]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedItems(new Set());
    setQuantityInputs({});
    setQuantityErrors({});
  }, []);

  const isItemInCart = useCallback((codeart) => {
    return selectedItems.has(codeart);
  }, [selectedItems]);

  const handleQuantityInputChange = useCallback((item, quantity) => {
    const parsedQuantity = Number(quantity);
    const safeQuantity = Number.isNaN(parsedQuantity) ? 0 : parsedQuantity;
    const normalizedQuantity = Math.max(0, safeQuantity);

    const baseAvailableQuantity = resolveBaseAvailableQuantity(item);
    const existingMovementQuantity = getExistingMovementQuantityForItem(item);
    const totalCapacity = baseAvailableQuantity + existingMovementQuantity;
    const isStructure006 = isMovementProduction || resolveStructureCode(item) === '006';

    const revertToZero = (message) => {
      // Remettre la quantité à 0 quand elle dépasse la quantité disponible
      setQuantityInputs((prev) => ({
        ...prev,
        [item.codeart]: 0
      }));
      setCartItems((prev) => {
        const exists = prev.some((cartItem) => cartItem.codeart === item.codeart);
        if (!exists) {
          return prev;
        }
        const next = prev.map((cartItem) =>
          cartItem.codeart === item.codeart
            ? { ...cartItem, quantity: 0 }
            : cartItem
        );
        return sortCartItemsByCode(next);
      });
      setQuantityErrors((prev) => ({
        ...prev,
        [item.codeart]: message
      }));
    };

    // Validation : empêcher les quantités supérieures à la quantité disponible (sauf pour les produits de production)
    if (!isStructure006 && normalizedQuantity > totalCapacity) {
      revertToZero(isArabic ? '⚠️ الكمية المدخلة أكبر من الرصيد المتاح.' : '⚠️ La quantité saisie dépasse le stock disponible.');
      return;
    }

    setQuantityErrors((prev) => {
      if (!prev[item.codeart]) return prev;
      const updated = { ...prev };
      delete updated[item.codeart];
      return updated;
    });

    setQuantityInputs((prev) => ({
      ...prev,
      [item.codeart]: normalizedQuantity
    }));

    setCartItems((prev) => {
      const exists = prev.some((cartItem) => cartItem.codeart === item.codeart);
      if (!exists) {
        return prev;
      }
      const next = prev.map((cartItem) =>
        cartItem.codeart === item.codeart
          ? { ...cartItem, quantity: normalizedQuantity }
          : cartItem
      );
      return sortCartItemsByCode(next);
    });
  }, [getExistingMovementQuantityForItem, isMovementProduction, resolveBaseAvailableQuantity, resolveStructureCode]);

  const handleAddToCartWithQuantity = useCallback((item) => {
    if (quantityErrors[item.codeart]) {
      return;
    }

    const draftValue = quantityInputs[item.codeart];
    const parsedQuantity = Number(draftValue);
    const sanitizedQuantity = Math.max(0, Number.isNaN(parsedQuantity) ? 0 : parsedQuantity);

    addToCart(item, sanitizedQuantity);
  }, [addToCart, quantityErrors, quantityInputs]);

  const handleQuickAddToCart = useCallback((item) => {
    const baseAvailableQuantity = resolveBaseAvailableQuantity(item);
    const existingMovementQuantity = getExistingMovementQuantityForItem(item);
    const isStructure006 = isMovementProduction || resolveStructureCode(item) === '006';
    const totalCapacity = isStructure006
      ? Number.MAX_SAFE_INTEGER
      : baseAvailableQuantity + existingMovementQuantity;
    const cartItem = cartItems.find((cartEntry) => cartEntry.codeart === item.codeart);
    const currentQuantity = Number.isFinite(Number(cartItem?.quantity))
      ? Number(cartItem.quantity)
      : (
          Number.isFinite(Number(quantityInputs[item.codeart]))
            ? Number(quantityInputs[item.codeart])
            : (Number.isFinite(Number(existingMovementQuantity)) ? Number(existingMovementQuantity) : 0)
        );
    const nextQuantity = currentQuantity + 1;

    if (!isStructure006 && nextQuantity > totalCapacity) {
      const fallbackQuantity = existingMovementQuantity > 0 ? existingMovementQuantity : 0;
      setQuantityInputs((prev) => ({
        ...prev,
        [item.codeart]: fallbackQuantity,
      }));
      setQuantityErrors((prev) => ({
        ...prev,
        [item.codeart]: isArabic ? '⚠️ الكمية المدخلة أكبر من الرصيد المتاح.' : '⚠️ La quantité saisie dépasse le stock disponible.'
      }));
      return;
    }

    addToCart(item, nextQuantity);
    setQuantityInputs((prev) => ({
      ...prev,
      [item.codeart]: nextQuantity
    }));
    setQuantityErrors((prev) => {
      if (!prev[item.codeart]) return prev;
      const updated = { ...prev };
      delete updated[item.codeart];
      return updated;
    });
  }, [addToCart, cartItems, getExistingMovementQuantityForItem, isMovementProduction, quantityInputs, resolveBaseAvailableQuantity, resolveStructureCode]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const finalValue = value ?? '';
    
    if (name === 'lotStatus' && type === 'radio') {
      setFormData({ ...FORM_CONFIG.initialData, lotStatus: finalValue });
      setSelectedSite('');
      setSelectedBatiment('');
      setMiseplaces([]);
      setInventory([]);
      setCartItems([]);
      setSelectedItems(new Set());
      setQuantityInputs({});
      setJourEnCoursData(null);
      setJourEnCoursError(null);
      setFormErrors({});
      
      (async () => {
        try {
          const user = JSON.parse(sessionStorage.getItem('user') || '{}');
          const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
          const lotStatusAlpha = finalValue === 'encours' ? 'N' : 'O';
          const batimentsRes = await api.get(API_ENDPOINTS.batiments, { params: { lotStatus: lotStatusAlpha, codeuser } });
          if (batimentsRes?.data?.success) {
            const batimentsData = batimentsRes.data.batiments || batimentsRes.data.data?.batiments || [];
            const uniqueSites = [];
            const seenSiteNumbers = new Set();
            batimentsData.forEach((batiment) => {
              const siteNumber = batiment.numcentre || batiment.numeroCentre || batiment.libelleCentre;
              if (siteNumber && !seenSiteNumbers.has(siteNumber)) {
                uniqueSites.push({ 
                  numcentre: siteNumber, 
                  libellecentre: batiment.libellecentre || batiment.libelleCentre,
                  libCentarabe: batiment.libcentarabe || batiment.libCentarabe, // Ajouter le champ arabe (variantes)
                  batiment: batiment // Garder la référence pour la traduction
                });
                seenSiteNumbers.add(siteNumber);
              }
            });
            setUniqueSiteOptions(uniqueSites);
          } else {
            setUniqueSiteOptions([]);
          }
        } catch (err) {
          console.error('Erreur lors du rechargement des sites:', err);
          setUniqueSiteOptions([]);
        }
      })();
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleQuantityChange = useCallback((codeart, value) => {
    setEnteredQuantities((prev) => ({
      ...prev,
      [codeart]: (value === '' || value == null) ? 0 : value,
    }));
  }, []);

  const handleSiteChange = (e) => {
    const siteId = e.target.value || '';
    setSelectedSite(siteId);
    setSelectedBatiment('');
    setInventory([]);
    if (!siteId) {
      setMiseplacesError(isArabic ? 'لا توجد مباني متاحة لهذا الموقع' : 'Aucun bâtiment disponible pour ce centre');
      setMiseplaces([]);
      return;
    }
    fetchMiseplaces(siteId);
  };

  const handleBatimentChange = (e) => {
    const batimentId = e.target.value || '';
    setSelectedBatiment(batimentId);
  };

  const handleStructureClick = (structureCode) => {
    setSelectedStructure(structureCode || '');
  };

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > Math.ceil(inventory.length / itemsPerPage)) return;
      setCurrentPage(page);
    },
    [inventory.length]
  );

  const fetchInventory = async (structureCode, nummvt, numcentre, numbat, nomBaseStockSession) => {
    if (!structureCode || !nummvt || !numcentre || !numbat || !nomBaseStockSession) {
      setInventory([]);
      setInventoryDepot({ code: '', label: '' });
      return;
    }

    try {
      setInventory([]);
      const params = new URLSearchParams();
      params.append('structure', structureCode);
      params.append('nummvt', nummvt);
      params.append('numcentre', numcentre);
      params.append('numbat', numbat);
      params.append('nomBaseStockSession', nomBaseStockSession);
      const response = await api.get(`${API_ENDPOINTS.inventory}?${params.toString()}`);
      if (response.data.success) {
        const inventoryDataRaw = response.data.inventory || response.data.data?.inventory || [];
        const normalizedInventoryData = normalizeApiResponseDates(inventoryDataRaw);
        const mappedInventory = normalizedInventoryData.map((item) => {
          const rawDepotCode = item.codeDep ?? item.depotCode  ?? '';
          const rawDepotLabel = item.libDep ?? item.depotLabel ?? item.libdep ?? '';
          const rawFamille =
            item.famille ??
            item.Famille ??
            item.codefam ??
            item.codeFamille ??
           
            '';

          const rawNature =
            item.cnature ??
            item.cNature ??
            item.CNature ??
            item.c_nature ??
            item.C_NATURE ??
            item.Nature ??
            item.nature ??
            structureCode ??
            '';

          const normalizedDepotCode = rawDepotCode ? rawDepotCode.toString().trim() : '';
          const normalizedDepotLabel = rawDepotLabel ? rawDepotLabel.toString().trim() : '';
          const normalizedFamille = rawFamille ? rawFamille.toString().trim() : '';
          const normalizedNature = rawNature ? rawNature.toString().trim() : '';

          return {
            ...item,
            codeDep: normalizedDepotCode,
            libDep: normalizedDepotLabel,
            depotCode: normalizedDepotCode,
            depotLabel: normalizedDepotLabel,
            famille: normalizedFamille,
            Famille: normalizedFamille,
            codefam: item.codefam ?? item.codeFamille ?? normalizedFamille,
            cnature: normalizedNature,
            cNature: normalizedNature,
            CNature: normalizedNature,
            c_nature: normalizedNature,
            C_NATURE: normalizedNature,
            Nature: normalizedNature
          };
        });

        const rawDepotCode = response.data.codeDepBat ?? response.data.data?.codeDepBat ?? mappedInventory[0]?.codeDep ?? mappedInventory[0]?.depotCode ?? '';
        const rawDepotLabel = response.data.libDepBat ?? response.data.data?.libDepBat ?? mappedInventory[0]?.libDep ?? mappedInventory[0]?.depotLabel ?? '';

        const resolvedDepotCode = rawDepotCode ? rawDepotCode.toString().trim() : '';
        const resolvedDepotLabel = rawDepotLabel ? rawDepotLabel.toString().trim() : '';

        setInventory(mappedInventory);
        setInventoryDepot({
          code: resolvedDepotCode,
          label: resolvedDepotLabel
        });
      } else {
        setInventory([]);
        setInventoryDepot({ code: '', label: '' });
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'inventaire:", error);
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }
      setInventoryDepot({ code: '', label: '' });
    }
  };

  const validateForm = useCallback((data) => {
    const errors = {};
    const requiredMsg = isArabic ? 'مطلوب' : 'Requis';
    const betweenMsg = (min, max) => isArabic ? `يجب أن تكون بين ${min} و${max}` : `Doit être entre ${min} et ${max}`;
    const positiveMsg = isArabic ? 'يجب أن تكون قيمة موجبة' : 'Doit être une valeur positive';
    
    // Champs obligatoires
    if (!data.tmortalite && data.tmortalite !== 0) errors.tmortalite = requiredMsg;
    if (!data.teffajout && data.teffajout !== 0) errors.added = requiredMsg;
    if (!data.tsemaine) errors.tsemaine = requiredMsg;
    if (!data.tjour) errors.tjour = requiredMsg;
    if (!data.teffectifj && data.teffectifj !== 0) errors.effectif = requiredMsg;
    if (!data.lotStatus) errors.lotStatus = requiredMsg;
    if (!data.souche) errors.souche = requiredMsg;
    if (!data.teffectif_global) errors.teffectif_global = requiredMsg;
    if (!data.tdate) errors.tdate = requiredMsg;
    if (!data.tqtev && data.tqtev !== 0) errors.tqtev = requiredMsg;
    
    // Validations de format
    if (data.temperature && (data.temperature < 0 || data.temperature > 50)) errors.temperature = betweenMsg(0, 50);
    if (data.humidity && (data.humidity < 0 || data.humidity > 100)) errors.humidity = betweenMsg(0, 100);
    if (data.tpoidsv && data.tpoidsv < 0) errors.tpoidsv = positiveMsg;
    if (data.tmtv && data.tmtv < 0) errors.tmtv = positiveMsg;
    if (data.tconseaulot && data.tconseaulot < 0) errors.tconseaulot = positiveMsg;
    if (data.teclairlot && data.teclairlot < 0) errors.teclairlot = positiveMsg;
    if (data.tintlumlot && data.tintlumlot < 0) errors.tintlumlot = positiveMsg;
    
    return errors;
  }, [isArabic]);

  const handleDayNavigation = useCallback((direction) => {
    if (!direction) {
      return;
    }

    if (!isNavigationContextReady) {
      setAlertMessage(isArabic ? 'يرجى اختيار الموقع والحظيرةوالدفعة أولاً قبل التنقل بين الأيام' : 'Veuillez d\'abord sélectionner le centre, le bâtiment et le lot avant de naviguer entre les jours');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    // Prevent navigation to next day if current day is not closed
    if (direction > 0 && !isCurrentDayClosed) {
      setAlertMessage(isArabic ? 'يجب تأكيد اختتام اليوم الحالي قبل الانتقال إلى اليوم التالي' : 'Vous devez valider et clôturer le jour actuel avant de passer au jour suivant');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    // Allow navigation to previous day regardless of closure status

    const referenceJour =
      Number.isFinite(activeJour) ? activeJour :
      Number(formData.tjour) || Number(jourEnCoursData?.tjour) || 1;
    const nextJour = referenceJour + direction;

    if (nextJour < 1) {
      setAlertMessage(isArabic ? 'لا يمكن الانتقال إلى يوم قبل اليوم الأول' : 'Impossible de naviguer vers un jour avant le premier jour');
      setAlertType('info');
      setShowAlert(true);
      return;
    }

    if (!activeNumMvt && !jourEnCoursData?.tnummvt && !formData?.nummvt) {
      setAlertMessage(isArabic ? 'لا يوجد رقم حركة صالح للتنقل بين الأيام' : 'Aucun numéro de mouvement valide pour naviguer entre les jours');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    setActiveJour(nextJour);
  }, [
    activeJour,
    activeNumMvt,
    formData.nummvt,
    formData.tjour,
    isCurrentDayClosed,
    isNavigationContextReady,
    jourEnCoursData,
    setAlertMessage,
    setAlertType,
    setShowAlert
  ]);

  const handleValidateJournee = useCallback(async () => {
    if (!selectedSite || !selectedBatiment) {
      setAlertMessage(isArabic ? 'يرجى اختيار الموقع والحظيرة' : 'Veuillez sélectionner le centre et le bâtiment');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    const selectedMiseplace = miseplaces.find((m) => m.numbat === selectedBatiment);
    if (!selectedMiseplace?.nummvt) {
      setAlertMessage(isArabic ? 'يرجى اختيار مبنى صالح' : 'Veuillez sélectionner un bâtiment valide');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    const confirmation = await Swal.fire({
      title: isArabic ? 'تأكيد العملية' : 'Confirmation de l\'opération',
      text: isArabic ? 'هل أنت متأكد من تأكيد واختتام هذا اليوم؟' : 'Êtes-vous sûr de vouloir valider et clôturer cette journée ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isArabic ? 'نعم، تأكيد' : 'Oui, confirmer',
      cancelButtonText: isArabic ? 'إلغاء' : 'Annuler',
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      },
      buttonsStyling: false
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, validation: true }));
      
      // Récupérer l'utilisateur connecté
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeUser = user.codeuser || user.codeUser || user.code || user.id || '';
      
      if (!codeUser) {
        setAlertMessage(isArabic ? '❌ لم يتم العثور على معلومات المستخدم. يرجى إعادة تسجيل الدخول' : '❌ Informations utilisateur introuvables. Veuillez vous reconnecter');
        setAlertType('danger');
        setShowAlert(true);
        return;
      }

      // Validation des champs obligatoires
      const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setShowAlert(false);
      return;
    }

      const parseQuantity = (value) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
      };

      const computeAvailableQuantity = (sourceItem) => {
        if (!sourceItem || typeof sourceItem !== 'object') {
          return 0;
        }
        const candidates = [
          sourceItem.qteart,
          sourceItem.QteArt,
          sourceItem.qteArt,
          sourceItem.Qte
        ];

        for (const candidate of candidates) {
          const parsed = parseQuantity(candidate);
          if (parsed > 0) {
            return parsed;
          }
        }
        return 0;
      };

      if (!isMovementProduction && cartItems.length > 0) {
        const quantityIssues = [];

        cartItems.forEach((item) => {
          if (resolveStructureCode(item) === '006') {
            return;
          }
          const normalizedCode = normalizeArticleCode(item.codeart || item.CodeArt || '');
          const requestedQuantity = parseQuantity(
            item.quantity ?? item.QteArt ?? item.qteart ?? item.Qte
          );
          let availableQuantity = computeAvailableQuantity(item);
          const existingMovementQuantity = getExistingMovementQuantityForItem(item);

          if (availableQuantity <= 0 && normalizedCode) {
            const inventoryMatch = inventory.find(
              (inv) =>
                normalizeArticleCode(inv.codeart || inv.CodeArt || '') === normalizedCode
            );

            if (inventoryMatch) {
              availableQuantity = computeAvailableQuantity(inventoryMatch);
            }
          }

          const totalCapacity = availableQuantity + existingMovementQuantity;

          if (requestedQuantity > totalCapacity) {
            quantityIssues.push({
              code: normalizedCode || (isArabic ? 'بدون كود' : 'Sans code'),
              requested: requestedQuantity,
              available: totalCapacity,
            });
          }
        });

        if (quantityIssues.length > 0) {
          const details = quantityIssues
            .map(({ code, requested, available }) => `${code}: ${requested} / ${available}`)
            .join(' | ');

          setAlertMessage(isArabic ? `❌ تعذّر التأكيد: بعض الكميات تتجاوز المخزون المتاح (${details}).` : `❌ Échec de la confirmation: certaines quantités dépassent le stock disponible (${details}).`);
          setAlertType('danger');
          setShowAlert(true);
          return;
        }
    }

      if (isMovementProduction) {
        const dailyEffectif = parseQuantity(
          formData.teffectifj ??
          jourEnCoursData?.teffectifj ??
          formData.effectif ??
          jourEnCoursData?.effectif
        );

        if (dailyEffectif > 0) {
          const totalProductionQuantity = cartItems.reduce((sum, item) => {
            if (resolveStructureCode(item) === '006') {
              return sum + parseQuantity(item.quantity ?? item.QteArt ?? item.qteart ?? item.Qte);
            }
            return sum;
          }, 0);

          if (totalProductionQuantity > dailyEffectif) {
            setAlertMessage(isArabic ? `❌ الكمية الإجمالية للمنتجات الإنتاجية (${totalProductionQuantity.toLocaleString()}) تجاوزت العدد اليومي (${dailyEffectif.toLocaleString()}).` : `❌ La quantité totale des produits de production (${totalProductionQuantity.toLocaleString()}) a dépassé l'effectif quotidien (${dailyEffectif.toLocaleString()}).`);
            setAlertType('danger');
            setShowAlert(true);
            return;
          }
        }
    }

      // Préparer les données du panier avec les champs attendus par le backend
      const siteLabel = uniqueSiteOptions.find((option) => option.numcentre === selectedSite)?.libellecentre
        || selectedMiseplace?.libcentre
        || "";

      const resolvedFamilleFallback = selectedStructure || "";
      const resolvedNatureFallback = selectedStructure || "";

      const cartItemsForRequest = cartItems.map((item, index) => {
        const rawCodeArt = item.codeart || item.CodeArt || "";
        const rawFamille = item.famille || item.Famille || item.codefam || item.codeFamille || item.fam || item.famart || resolvedFamilleFallback;
        const rawLibDep = item.depotCode || item.codeDep || inventoryDepot.code || selectedMiseplace?.codeDepBat   || "";
        const rawVille = item.ville || item.Ville || siteLabel;
        const rawNature =
          item.cnature ||
          item.cNature ||
          item.CNature ||
          item.c_nature ||
          item.C_NATURE ||
          item.Nature ||
          item.nature ||
          resolvedNatureFallback;

        const normalizedCodeArt = rawCodeArt ? rawCodeArt.toString().trim() : "";
        const normalizedFamille = rawFamille ? rawFamille.toString().trim() : "";
        const normalizedLibDep = rawLibDep ? rawLibDep.toString().trim() : "";
        const normalizedVille = rawVille ? rawVille.toString().trim() : "";
        const normalizedNature = rawNature ? rawNature.toString().trim() : "";

        const quantityToSend = parseQuantity(
          item.quantity ?? item.QteArt ?? item.qteart ?? item.Qte ?? 0
        );

        // Préparer les données de base avec français dans le champ par défaut
        const cartItemData = {
          CodeArt: normalizedCodeArt,
          Famille: normalizedFamille,
          LibDep: normalizedLibDep,
          QteArt: quantityToSend,
          DesArt: item.desart || item.DesArt || "", // Champ français par défaut
          NLigne: index + 1,
          Ville: normalizedVille,
          Puttc: Number(item.puttc ?? item.Puttc ?? 0),
          CNature: normalizedNature
        };

        // Toujours ajouter libarabe (désart en arabe) si disponible, indépendamment de la langue
        if (item.libarabe || item.Libarabe) {
          cartItemData.Libarabe = item.libarabe || item.Libarabe || "";
        }

        return cartItemData;
      });

      const cartIssues = cartItemsForRequest.filter((item) => !item.CodeArt || !item.Famille || !item.LibDep);
      if (cartIssues.length > 0) {
        console.warn('⚠️ Cart items manquants (CodeArt/Famille  ):', cartIssues);
        setAlertMessage(isArabic ? '❌ تعذّر التأكيد: بعض عناصر القائمة تفتقد معلومات المستودع أو العائلة. تأكد من اختيار هيكل صالح أو إعادة تحميل المخزون.' : '❌ Échec de la confirmation: certains éléments du panier manquent d\'informations sur le dépôt ou la famille. Assurez-vous de sélectionner une structure valide ou de recharger l\'inventaire.');
        setAlertType('danger');
        setShowAlert(true);
        return;
      }

      // Vérifier que nummvt est disponible
      const resolvedNumMvt = 
        selectedMiseplace?.nummvt || 
        formData.nummvt || 
        activeNumMvt || 
        jourEnCoursData?.nummvt || 
        jourEnCoursData?.NumMvt || 
        jourEnCoursData?.tnummvt || 
        '';

      if (!resolvedNumMvt) {
        setAlertMessage(isArabic ? '❌ تعذّر التأكيد: رقم الحركة (nummvt) مطلوب. يرجى اختيار حركة صالحة.' : '❌ Échec de la confirmation: le numéro de mouvement (nummvt) est requis. Veuillez sélectionner un mouvement valide.');
        setAlertType('danger');
        setShowAlert(true);
        setLoading((prev) => ({ ...prev, validation: false }));
        return;
      }

      // Préparer TOUTES les données avec mapping correct
      const requestData = {
        // === DONNÉES DE BASE ===
        nummvt: resolvedNumMvt, // Format attendu par l'API (minuscules)
        NumMvt: resolvedNumMvt, // Format alternatif pour compatibilité
        NumLot: formData.numLot || selectedMiseplace?.numlot || '',
        Date: formData.tdate || new Date().toISOString().split('T')[0],
        Jour: parseInt(formData.tjour) || 1,
        Semaine: parseInt(formData.tsemaine) || 1,
        CodeUser: codeUser,
        NomBaseStockSession: nomBaseStockSession,
        
        // === DONNÉES DE MORTALITÉ ET EFFECTIFS ===
        Mortalite: parseFloat(formData.tmortalite) || 0,
        MortMale: parseFloat(formData.tmortmale) || 0,
        EffAjout: parseFloat(formData.teffajout) || 0,
        EffRetire: parseFloat(formData.teffretire) || 0,
        Effectif: parseFloat(formData.teffectifj) || 0,
        EffectifGlobal: parseFloat(formData.teffectif_global) || 0,
        
        // === DONNÉES DE PRODUCTION ET VENTE ===
        QteVendu: parseFloat(formData.tqtev) || 0,
        PoidsVendu: parseFloat(formData.tpoidsv) || 0,
        MtVente: parseFloat(formData.tmtv) || 0,
        PoidsOeuf: parseFloat(formData.tpoidsoeuf) || 0,
        StockOeuf: parseFloat(formData.tstockoeuf) || 0,
        StockPlat: parseFloat(formData.tstockplat) || 0,
        
        // === DONNÉES ENVIRONNEMENTALES ===
        TemperLot: formData.temperature?.toString() || "",
        HumiditeLot: formData.humidity?.toString() || "",
        ConseauLot: parseFloat(
          formData.tconseaulot ||
          formData.water ||
          jourEnCoursData?.tconseaulot ||
          0
        ),
        IntLumLot:
          formData.tintlumlot?.toString() ||
          formData.internalLight?.toString() ||
          jourEnCoursData?.tintlumlot?.toString() ||
          "",
        EclairLot:
          formData.teclairlot?.toString() ||
          formData.naturalLight?.toString() ||
          jourEnCoursData?.teclairlot?.toString() ||
          "",
        
        // === DONNÉES SUPPLÉMENTAIRES ===
        AlimRestant: parseFloat(formData.talimrest) || 0,
        Souche: formData.souche || "",
        CodeEspece: formData.tcodeesp || jourEnCoursData?.tcodeesp || "",
        Espece: formData.tespece || jourEnCoursData?.tespece || "",
        Notes: formData.notes || "",
        NomJour: formData.tnomjour || jourEnCoursData?.tnomjour || "",
        EffectifParamSouche: parseFloat(formData.effectif_paramsouche) || parseFloat(jourEnCoursData?.effectif_paramsouche) || 0,
        NbrAlveole: parseFloat(formData.tnbralveole) || 0,
        
        // === INFORMATIONS DE DÉPÔT ===
        CodeDepBat: inventoryDepot.code || selectedMiseplace?.codeDepBat  || '',
        LibDepBat: inventoryDepot.label || selectedMiseplace?.libDepBat || selectedMiseplace?.libbat || '',
        NumBE: resolvedNumMvt,
        NumCentre: selectedSite,
        
        // === STATUT DU LOT ===
        LotStatus: formData.lotStatus || 'encours',
        
        // === DONNÉES DU PANIER ===
        CartItems: cartItemsForRequest,

        // === CHAMPS ADDITIONNELS POUR ASSURER LA COMPATIBILITÉ ===
        TEffectif: parseFloat(formData.teffectifj) || 0,
        TMortalite: parseFloat(formData.tmortalite) || 0,
        TQteV: parseFloat(formData.tqtev) || 0,
        TPoidsV: parseFloat(formData.tpoidsv) || 0,
        TMtv: parseFloat(formData.tmtv) || 0,
        TSouche: formData.souche || "",
        TCodeEsp: formData.tcodeesp || jourEnCoursData?.tcodeesp || "",
        TEspece: formData.tespece || jourEnCoursData?.tespece || "",
        TEffAjout: parseFloat(formData.teffajout) || 0,
        TEffRetire: parseFloat(formData.teffretire) || 0,
        TEffectifJ: parseFloat(formData.teffectifj) || 0,
        TMortMale: parseFloat(formData.tmortmale) || 0,
        TNomJour: formData.tnomjour || jourEnCoursData?.tnomjour || "",
        TEffectifParamSouche: parseFloat(formData.effectif_paramsouche) || parseFloat(jourEnCoursData?.effectif_paramsouche) || 0,
        TNbrAlveole: parseFloat(formData.tnbralveole) || 0
      };

      console.log('📤 Envoi des données complètes:', requestData);
      
      const response = await api.post('/api/rapportjournalier/valider-journee', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Réponse reçue:', response.data);
      
      if (response.data.success) {
        setAlertMessage(isArabic ? 'تم تأكيد اختتام هذا اليوم بنجاح' : 'Journée validée et clôturée avec succès');
        setAlertType('success');
        setShowAlert(true);
        
        // Conserver les valeurs de jour et semaine avant la réinitialisation
        const currentTjour = formData.tjour || activeJour;
        const currentTsemaine = formData.tsemaine || activeSemaine;
        const currentTdate = formData.tdate || activeDate;
        const currentNumLot = formData.numLot;
        const currentNumMvt = formData.nummvt || activeNumMvt;
        
        // Réinitialiser le formulaire après un court délai pour que l'utilisateur voie le message
        setTimeout(() => {
          setFormData({
            ...FORM_CONFIG.initialData,
            lotStatus: 'encours',
            tjour: currentTjour || '',
            tsemaine: currentTsemaine || '',
            tdate: currentTdate || getTodayIsoDate(),
            numLot: currentNumLot || '',
            nummvt: currentNumMvt || ''
          });
          // Conserver aussi les valeurs dans les états actifs
          if (currentTjour) {
            setActiveJour(Number(currentTjour));
          }
          if (currentTsemaine) {
            setActiveSemaine(Number(currentTsemaine));
          }
          if (currentTdate) {
            setActiveDate(currentTdate);
          }
          if (currentNumMvt) {
            setActiveNumMvt(currentNumMvt);
          }
          setCartItems([]);
          setSelectedItems(new Set());
          setQuantityInputs({});
          setQuantityErrors({});
          setFormErrors({});
          setInventory([]);
          setInventoryDepot({ code: '', label: '' });
          
          // Ne pas réinitialiser les sélections de site et bâtiment pour permettre la navigation
          // setSelectedSite('');
          // setSelectedBatiment('');
          // setSelectedStructure('');
        }, 2000);
        
        // Garder le message visible pendant 5 secondes
        setTimeout(() => {
          setShowAlert(false);
        }, 5000);
        
      } else {
        setAlertMessage(isArabic ? '❌ فشل في الإرسال: ' + (response.data.message || 'خطأ غير معروف') : '❌ Échec de l\'envoi: ' + (response.data.message || 'Erreur inconnue'));
        setAlertType('danger');
      }
      
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      
      let errorMessage = isArabic ? 'خطأ غير معروف' : 'Erreur inconnue';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Erreur ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = isArabic ? 'لا يوجد اتصال بالخادم' : 'Aucune connexion au serveur';
      } else {
        errorMessage = error.message || (isArabic ? 'خطأ في الإعداد' : 'Erreur de configuration');
      }
      
      setAlertMessage(isArabic ? '❌ فشل في الإرسال: ' + errorMessage : '❌ Échec de l\'envoi: ' + errorMessage);
      setAlertType('danger');
    } finally {
      setLoading((prev) => ({ ...prev, validation: false }));
      setShowAlert(true);
    }
  }, [
    selectedSite, selectedBatiment, miseplaces, formData, 
    nomBaseStockSession, cartItems, jourEnCoursData, validateForm,
    uniqueSiteOptions, inventoryDepot, inventory, isProductionStructure, getExistingMovementQuantityForItem, resolveStructureCode, selectedStructure
  ]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nummvt: selectedMiseplace?.nummvt || '',
      numLot: selectedMiseplace?.numlot || selectedMiseplace?.nummvt || selectedMiseplace?.numbat || selectedMiseplace?.libbat || '',
    }));
    if (selectedMiseplace?.nummvt) {
      setActiveNumMvt(selectedMiseplace.nummvt);
    }
  }, [selectedMiseplace]);

  useEffect(() => {
    if (!selectedSite || !selectedBatiment || !formData.numLot) {
      return;
    }
    setActiveDate(getTodayIsoDate());
    setActiveJour(null);
    setActiveSemaine(null);
    setActiveNumMvt(selectedMiseplace?.nummvt || formData?.nummvt || '');
  }, [selectedSite, selectedBatiment, formData.numLot]);

  useEffect(() => {
    setEnteredQuantities({});
    setCurrentPage(1);
    setQuantityInputs({});
    setQuantityErrors({});
  }, [selectedStructure]);

  // Réinitialiser le panier lors du changement de jour
  useEffect(() => {
    const prevDay = prevDayRef.current;
    const hasDayChanged = 
      prevDay.activeJour !== activeJour ||
      prevDay.activeDate !== activeDate ||
      prevDay.activeSemaine !== activeSemaine;
    
    // Ne réinitialiser que si le jour a vraiment changé (pas au premier rendu)
    if (hasDayChanged && (prevDay.activeJour !== null || prevDay.activeDate || prevDay.activeSemaine !== null)) {
      setCartItems([]);
      setSelectedItems(new Set());
      setQuantityInputs({});
      setQuantityErrors({});
      setEnteredQuantities({});
    }
    
    // Mettre à jour la référence avec les valeurs actuelles
    prevDayRef.current = { activeJour, activeDate, activeSemaine };
  }, [activeJour, activeDate, activeSemaine]);

  useEffect(() => {
    let isCancelled = false;

    const getJourEnCours = async () => {
      if (!selectedSite || !selectedBatiment || !formData.numLot) {
        if (!isCancelled) {
          setJourEnCoursData(null);
          setJourEnCoursError(null);
          setDayNavigationLoading(false);
        }
        return;
      }

      try {
        if (!isCancelled) {
          setDayNavigationLoading(true);
          setJourEnCoursError(null);
        }
        const nomBaseStockSession = getDatabaseChoice();
        const params = new URLSearchParams({
          numLot: formData.numLot,
          nomBaseStockSession,
          numCentre: selectedSite,
          numBatiment: selectedBatiment,
          departement: selectedSite,
          departmnt: selectedSite,
        });
        if (activeDate) {
          params.append('date', activeDate);
        }
        if (Number.isFinite(activeJour)) {
          params.append('tjour', activeJour);
        } else if (formData.tjour) {
          params.append('tjour', formData.tjour);
        }
        if (Number.isFinite(activeSemaine)) {
          params.append('tsemaine', activeSemaine);
        } else if (formData.tsemaine) {
          params.append('tsemaine', formData.tsemaine);
        }
        const tnummvt =
          activeNumMvt ||
          jourEnCoursData?.tnummvt ||
          jourEnCoursData?.nummvt ||
          formData?.nummvt ||
          selectedMiseplace?.nummvt ||
          '';
        if (tnummvt) {
          params.append('tnummvt', tnummvt);
        }
        const response = await api.get(`${API_ENDPOINTS.jourEnCours}?${params.toString()}`);

        if (isCancelled) {
          return;
        }

        if (response.data.success) {
          const jourEnCoursApiResponse = response.data.data;
          setJourEnCoursData(normalizeApiResponseDates(jourEnCoursApiResponse) || null);
          const resolvedDate = resolveApiDate(
            jourEnCoursApiResponse?.tdate,
            activeDate
          );
          if (resolvedDate) {
            setActiveDate((prev) => (prev !== resolvedDate ? resolvedDate : prev));
          }
          const resolvedJourValue = Number(jourEnCoursApiResponse?.tjour);
          setActiveJour(Number.isFinite(resolvedJourValue) ? resolvedJourValue : null);
          const resolvedSemaineValue = Number(jourEnCoursApiResponse?.tsemaine);
          setActiveSemaine(Number.isFinite(resolvedSemaineValue) ? resolvedSemaineValue : null);
          const resolvedNumMvt =
            jourEnCoursApiResponse?.tnummvt ||
            jourEnCoursApiResponse?.nummvt ||
            tnummvt ||
            '';
          setActiveNumMvt(resolvedNumMvt);
          setFormData((prev) => {
            const newFormData = {
              ...prev,
              tdate: resolvedDate || prev.tdate,
              tsemaine: jourEnCoursApiResponse?.tsemaine ?? '',
              tjour: jourEnCoursApiResponse?.tjour ?? '',
              tmortalite: jourEnCoursApiResponse?.tmortalite ?? '',
              teffajout: jourEnCoursApiResponse?.teffajout ?? '',
              teffretire: jourEnCoursApiResponse?.teffretire ?? '',
              tqtev: jourEnCoursApiResponse?.tqtev ?? '',
              tpoidsv: jourEnCoursApiResponse?.tpoidsv ?? '',
              tmtv: jourEnCoursApiResponse?.tmtv ?? '',
              tstockoeuf: jourEnCoursApiResponse?.tstockoeuf ?? '',
              teffectifj: jourEnCoursApiResponse?.teffectifj ?? '',
              souche: jourEnCoursApiResponse?.tsouche ?? '',
              temperature: jourEnCoursApiResponse?.ttemperlot ?? '',
              humidity: jourEnCoursApiResponse?.thumiditelot ?? '',
              naturalLight: jourEnCoursApiResponse?.teclairlot ?? '',
              internalLight: jourEnCoursApiResponse?.tintlumlot ?? '',
              tcodeesp: jourEnCoursApiResponse?.tcodeesp ?? '',
              tespece: jourEnCoursApiResponse?.tespece ?? '',
              tespecearabe: jourEnCoursApiResponse?.tespecearabe ?? '',
              tpoidsoeuf: jourEnCoursApiResponse?.tpoidsoeuf ?? '',
              tstockplat: jourEnCoursApiResponse?.tstockplat ?? '',
              teffectif_global: jourEnCoursApiResponse?.teffectif_global ?? '',
              talimrest: jourEnCoursApiResponse?.talimrest ?? '',
              tconseaulot: jourEnCoursApiResponse?.tconseaulot ?? '',
              ttemperlot: jourEnCoursApiResponse?.ttemperlot ?? '',
              thumiditelot: jourEnCoursApiResponse?.thumiditelot ?? '',
              teclairlot: jourEnCoursApiResponse?.teclairlot ?? '',
              tintlumlot: jourEnCoursApiResponse?.tintlumlot ?? '',
              tmortmale: jourEnCoursApiResponse?.tmortmale ?? '',
              tnomjour: jourEnCoursApiResponse?.tnomjour ?? '',
              effectif_paramsouche: jourEnCoursApiResponse?.effectif_paramsouche ?? '',
              tnbralveole: jourEnCoursApiResponse?.tnbralveole ?? ''
            };
            return newFormData;
          });
        } else {
          setJourEnCoursError(response.data.message || (isArabic ? 'فشل في تحميل بيانات اليوم الحالي' : 'Échec du chargement des données du jour actuel'));
          setJourEnCoursData(null);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching jour-en-cours:', error);
          setJourEnCoursError(error.message || (isArabic ? 'خطأ في جلب بيانات اليوم الحالي' : 'Erreur lors de la récupération des données du jour actuel'));
          setJourEnCoursData(null);
        }
      } finally {
        if (!isCancelled) {
          setDayNavigationLoading(false);
        }
      }
    };

    getJourEnCours();

    return () => {
      isCancelled = true;
    };
  }, [selectedSite, selectedBatiment, formData.numLot, activeDate, activeJour, activeSemaine, activeNumMvt]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
        // Par défaut, utiliser 'encours' si lotStatus n'est pas défini
        const defaultLotStatus = formData?.lotStatus || 'encours';
        const lotStatusAlpha = (defaultLotStatus === 'encours') ? 'N' : 'O';
        const [batimentsRes, structuresRes] = await Promise.allSettled([
          api.get(API_ENDPOINTS.batiments, { params: { lotStatus: lotStatusAlpha, codeuser } }),
          api.get(API_ENDPOINTS.structures),
        ]);

        if (batimentsRes.status === 'fulfilled' && batimentsRes.value.data && batimentsRes.value.data.success) {
          const batimentsData = batimentsRes.value.data.batiments || batimentsRes.value.data.data?.batiments || [];
          const uniqueSites = [];
          const seenSiteNumbers = new Set();
          batimentsData.forEach((batiment) => {
            const siteNumber = batiment.numcentre || batiment.numeroCentre || batiment.libelleCentre;
            if (siteNumber && !seenSiteNumbers.has(siteNumber)) {
              uniqueSites.push({ 
                numcentre: siteNumber, 
                libellecentre: batiment.libellecentre || batiment.libelleCentre,
                libCentarabe: batiment.libcentarabe || batiment.libCentarabe // Ajouter le champ arabe (variantes)
              });
              seenSiteNumbers.add(siteNumber);
            }
          });
          setUniqueSiteOptions(uniqueSites);
        }

        if (structuresRes.status === 'fulfilled' && structuresRes.value.data.success) {
          const structuresData = structuresRes.value.data.structures || structuresRes.value.data.data?.structures || [];
          const uniqueStructures = structuresData.filter(
            (structure, index, self) => index === self.findIndex((s) => s.code === structure.code)
          );
          setStructures(uniqueStructures);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        const status = error?.response?.status;
        if (status === 401) {
          navigate('/login');
          return;
        }
        const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
        const msg = status === 500 ? (isArabic ? 'خطأ خادم داخلي' : 'Erreur serveur interne') : serverMsg || (isArabic ? 'فشل في تحميل البيانات' : 'Échec du chargement des données');
        setAlertMessage(msg);
        setAlertType('danger');
        setShowAlert(true);
      }
    };

    fetchAllData();
  }, [navigate, formData.lotStatus]);

  useEffect(() => {
    if (selectedStructure && selectedBatiment && selectedSite) {
      const selectedMiseplace = miseplaces.find((m) => m.numbat === selectedBatiment);
      if (selectedMiseplace?.nummvt) {
        fetchInventory(selectedStructure, selectedMiseplace.nummvt, selectedSite, selectedBatiment, nomBaseStockSession );
      }
    }
  }, [selectedStructure, selectedBatiment, selectedSite, miseplaces, nomBaseStockSession ]);

  return (
    <div
      className="modern-dashboard"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: 'var(--dashboard-bg)',
        minHeight: '100vh',
        padding: '12px',
        direction: isArabic ? 'rtl' : 'ltr',
      }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <style>
        {`
          :root {
            /* NOUVELLE PALETTE (Sombre & Moderne) */
            --primary: #ef2b1d;
            --accent-color: #ef2b1d;
            --accent-light: rgba(239, 43, 29, 0.12);
            --secondary: #593e35;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #06b6d4;
            --text-primary: #2b2b2b;
            --text-muted: #6b7280;
            --card-bg: #ffffff;
            --input-bg: #f9fafb;
            --bg-light: #f5f6fa;
            --border-color: #644942;
            --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
            --dashboard-bg: #f5f6fa;
            
            /* Variables pour header/nav */
            --header-gradient-start: #212631;
            --header-gradient-end: #212631;
            --header-shadow: 0 4px 12px rgba(33, 38, 49, 0.3);
            
            /* Variables pour sidebar */
            --sidebar-bg: #212631;
            --sidebar-text: #ffffff;
            --sidebar-active: #ef2b1d;
            --sidebar-hover: rgba(255, 255, 255, 0.12);
          }

          /* ============================================
             SUGGESTIONS DE PALETTES DE COULEURS
             ============================================
             
             Pour utiliser une palette, remplacez simplement les valeurs dans :root ci-dessus.
             Le header et la navigation utiliseront automatiquement les nouvelles couleurs.
             
             PALETTE 1: MODERNE VERT ÉMERAUDE (Professionnel & Frais)
             --primary: #10b981;
             --accent-color: #059669;
             --accent-light: #d1fae5;
             --header-gradient-start: #059669;
             --header-gradient-end: #047857;
             --header-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
             
             PALETTE 2: ÉLÉGANT VIOLET (Moderne & Créatif)
             --primary: #8b5cf6;
             --accent-color: #7c3aed;
             --accent-light: #ede9fe;
             --header-gradient-start: #7c3aed;
             --header-gradient-end: #6d28d9;
             --header-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
             
             PALETTE 3: CHALEUREUX ORANGE (Énergique & Accueillant)
             --primary: #f97316;
             --accent-color: #ea580c;
             --accent-light: #ffedd5;
             --header-gradient-start: #ea580c;
             --header-gradient-end: #c2410c;
             --header-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
             
             PALETTE 4: PROFESSIONNEL BLEU FONCÉ (Corporate & Fiable)
             --primary: #1e40af;
             --accent-color: #1e3a8a;
             --accent-light: #dbeafe;
             --header-gradient-start: #1e3a8a;
             --header-gradient-end: #1e293b;
             --header-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
             
             PALETTE 5: SOFISTIQUÉ ROSE (Féminin & Élégant)
             --primary: #ec4899;
             --accent-color: #db2777;
             --accent-light: #fce7f3;
             --header-gradient-start: #db2777;
             --header-gradient-end: #be185d;
             --header-shadow: 0 4px 12px rgba(219, 39, 119, 0.3);
             
             PALETTE 6: NATUREL TEAL (Calme & Équilibré)
             --primary: #14b8a6;
             --accent-color: #0d9488;
             --accent-light: #ccfbf1;
             --header-gradient-start: #0d9488;
             --header-gradient-end: #0f766e;
             --header-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
             
             PALETTE 7: ROYAL INDIGO (Professionnel & Distingué)
             --primary: #6366f1;
             --accent-color: #4f46e5;
             --accent-light: #e0e7ff;
             --header-gradient-start: #4f46e5;
             --header-gradient-end: #4338ca;
             --header-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
             
             PALETTE 8: MODERNE CYAN (Technologique & Frais)
             --primary: #06b6d4;
             --accent-color: #0891b2;
             --accent-light: #cffafe;
             --header-gradient-start: #0891b2;
             --header-gradient-end: #0e7490;
             --header-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
             
             PALETTE 9: ÉLÉGANT SLATE (Minimaliste & Professionnel)
             --primary: #475569;
             --accent-color: #334155;
             --accent-light: #f1f5f9;
             --header-gradient-start: #334155;
             --header-gradient-end: #1e293b;
             --header-shadow: 0 4px 12px rgba(51, 65, 85, 0.3);
             
             PALETTE 10: VIBRANT ROUGE CORAIL (Dynamique & Attractif)
             --primary: #f43f5e;
             --accent-color: #e11d48;
             --accent-light: #ffe4e6;
             --header-gradient-start: #e11d48;
             --header-gradient-end: #be123c;
             --header-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
             
             ============================================ */

          @keyframes pulse-border {
            0%, 100% {
              box-shadow: 0 0 0 3px rgba(252, 165, 165, 0.1);
            }
            50% {
              box-shadow: 0 0 0 6px rgba(252, 165, 165, 0.2);
            }
          }

          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          .cursor-pointer {
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .cursor-pointer:hover {
            transform: translateY(-1px);
          }

          .table-responsive {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow-xs);
          }


          .cart-item-added {
            background-color: #e8f5e8 !important;
            border-left: 3px solid var(--success) !important;
            animation: fadeIn 0.3s ease;
          }

          .existing-mvt-row {
            position: relative;
          }

          .existing-mvt-row td {
            background-color: rgba(59, 130, 246, 0.14);
          }

          .quantity-input-group {
            display: flex;
            align-items: center;
          }
          
          .quantity-btn {
            transition: all 0.2s ease;
          }
          
          .quantity-btn:hover:not(:disabled) {
            background: var(--accent-color);
            color: white;
            transform: scale(1.1);
          }
          
          .quantity-btn:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          
          .quantity-input-field:focus {
            outline: none;
            border-color: #5087a8;
            box-shadow: 0 0 0 3px rgba(80, 135, 168, 0.1);
          }
          
          .quantity-input-field::-webkit-outer-spin-button,
          .quantity-input-field::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          .quantity-input-field[type=number] {
            -moz-appearance: textfield;
          }

          .input-group-container {
            transition: all 0.3s ease;
            border-color: var(--border-color) !important;
          }

          .input-group-container:hover {
            box-shadow: var(--shadow-sm);
            transform: translateY(-1px);
            border-color: var(--border-color) !important;
          }

          .structure-list-item {
            transition: all 0.2s ease;
          }

          .structure-list-item:hover {
            background: var(--accent-light) !important;
            transform: translateX(-3px);
          }

          .validate-button {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .validate-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .validate-button:hover:not(:disabled)::before {
            width: 300px;
            height: 300px;
          }

          .validate-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
          }

          .validate-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .alert-notification {
            animation: slideInRight 0.4s ease-out;
          }

          .enhanced-input {
            transition: all 0.2s ease;
          }

          .enhanced-input:focus {
            border-color: #5087a8 !important;
            box-shadow: 0 0 0 4px rgba(80, 135, 168, 0.15) !important;
            outline: none;
          }

          .form-select:focus {
            border-color: #5087a8 !important;
            box-shadow: 0 0 0 4px rgba(80, 135, 168, 0.15) !important;
            outline: none;
          }

          .form-select option {
            padding: 10px;
            background: white;
            color: #1e293b;
          }

          .form-select option:hover {
            background: #f0f9ff;
          }

          .cart-panel {
            transition: all 0.3s ease;
          }

          .cart-panel:hover {
            box-shadow: var(--shadow-md);
          }

          /* Styles SweetAlert - Design amélioré */
          .swal2-popup {
            border-radius: 16px !important;
            padding: 2rem !important;
            font-family: 'Tahoma', 'Arial', sans-serif !important;
          }
          
          .swal2-title {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            margin-bottom: 1rem !important;
          }
          
          .swal2-content {
            font-size: 1rem !important;
            color: #475569 !important;
            line-height: 1.6 !important;
          }
          
          .swal-confirm-button,
          .swal-cancel-button {
            border-radius: 10px !important;
            padding: 12px 28px !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            transition: all 0.3s ease !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            margin: 0 8px !important;
          }
          
          .swal-confirm-button {
            background: linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%) !important;
            color: #fff !important;
          }
          
          .swal-confirm-button:hover {
            background: linear-gradient(135deg, rgb(200 80 70) 0%, rgb(180 60 50) 100%) !important;
            color: #fff !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(231, 101, 88, 0.4) !important;
          }
          
          .swal-cancel-button {
            background: #f1f5f9 !important;
            color: #475569 !important;
            border: 2px solid #e2e8f0 !important;
          }
          
          .swal-cancel-button:hover {
            background: #e2e8f0 !important;
            color: #1e293b !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }
          
          .swal2-confirm,
          .swal2-cancel {
            border-radius: 10px !important;
            padding: 12px 28px !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            transition: all 0.3s ease !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          .swal2-confirm {
            background: linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%) !important;
            color: #fff !important;
          }
          
          .swal2-confirm:hover {
            background: linear-gradient(135deg, rgb(200 80 70) 0%, rgb(180 60 50) 100%) !important;
            color: #fff !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(231, 101, 88, 0.4) !important;
          }
          
          .swal2-cancel {
            background: #f1f5f9 !important;
            color: #475569 !important;
            border: 2px solid #e2e8f0 !important;
          }
          
          .swal2-cancel:hover {
            background: #e2e8f0 !important;
            color: #1e293b !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }

          @media (max-width: 768px) {
            .modern-dashboard {
              padding: 8px;
            }

            .alert-notification-wrapper {
              right: 10px !important;
              left: 10px !important;
              min-width: auto !important;
            }

            .alert-notification {
              min-width: auto !important;
              max-width: 100% !important;
            }
          }
        `}
      </style>

      {showAlert && (
        <div
          className="alert-notification-wrapper"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            animation: 'slideInRight 0.4s ease-out',
          }}
        >
          <CAlert
            className="alert-notification"
            color={alertType}
            dismissible
            onClose={() => setShowAlert(false)}
            style={{
              minWidth: '320px',
              maxWidth: '450px',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: alertType === 'success' 
                ? '0 8px 24px rgba(16, 185, 129, 0.25)' 
                : alertType === 'danger'
                ? '0 8px 24px rgba(239, 68, 68, 0.25)'
                : '0 8px 24px rgba(0, 0, 0, 0.15)',
              border: 'none',
              padding: '16px 20px',
              background: alertType === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : alertType === 'danger'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
            }}
          >
            <div className="d-flex align-items-start">
              <div 
                className={`${isArabic ? 'me-3' : 'ms-3'} d-flex align-items-center justify-content-center`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  flexShrink: 0,
                }}
              >
                <FaIcon 
                  icon={
                    alertType === 'success' ? 'fa-check-circle' :
                    alertType === 'danger' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                  } 
                  style={{ fontSize: '18px', color: 'white' }}
                />
              </div>
              <div className="flex-grow-1">
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  marginBottom: '4px',
                  lineHeight: '1.4'
                }}>
                  {alertType === 'success' ? (isArabic ? '✅ نجاح العملية' : '✅ Opération réussie') : 
                   alertType === 'danger' ? (isArabic ? '❌ خطأ' : '❌ Erreur') : 
                   (isArabic ? 'ℹ️ إشعار' : 'ℹ️ Notification')}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.95,
                  lineHeight: '1.5'
                }}>
                  {alertMessage}
                </div>
              </div>
            </div>
          </CAlert>
        </div>
      )}

      <PageHeaderCard
        title={isArabic ? "تأكيد اختتام اليوم" : "Validation journée"}
        icon={<FaIcon icon="fa-layer-group" />}
      />

      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          marginBottom: '28px',
          marginTop: '8px',
          padding: '20px',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <SectionHeader 
          icon={<FaIcon icon="fa-cog" />}
          title={isArabic ? "الإعدادات الأساسية" : "Paramètres de base"}
          subtitle={isArabic ? "تحديد إعدادات الدورة والمعلومات الأساسية" : "Définir les paramètres de la session et les informations de base"}
          isArabic={isArabic}
        />

        <div className="row g-2">
          <div className="col-12">
            <InputGroup title={isArabic ? "حالة الدورة" : "État de la session"} icon={<FaIcon icon="fa-flag" />} highlight={true} isArabic={isArabic}>
              <RadioButtonGroup
                label={isArabic ? "حالة الدورة" : "État de la session"}
                name="lotStatus"
                value={formData.lotStatus}
                onChange={handleInputChange}
                options={FORM_CONFIG.lotStatusOptions.map(opt => ({
                  ...opt,
                  label: isArabic ? opt.label : (opt.value === 'encours' ? 'En cours' : 'Clôturée')
                }))}
                invalid={!!formErrors.lotStatus}
                feedback={formErrors.lotStatus}
                required
                icon={<FaIcon icon="fa-flag" />}
                isArabic={isArabic}
                hideLabel={true}
              />
            </InputGroup>
          </div>

          <div className="col-lg-6 col-md-12">
            <div
              style={{
                background: !selectedSite || !selectedBatiment 
                  ? 'linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)'
                  : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderRadius: '12px',
                padding: '18px',
                border: !selectedSite || !selectedBatiment 
                  ? '2px solid #fca5a5' 
                  : '2px solid #86efac',
                boxShadow: !selectedSite || !selectedBatiment 
                  ? '0 0 0 3px rgba(252, 165, 165, 0.1)' 
                  : '0 0 0 3px rgba(134, 239, 172, 0.1)',
                animation: !selectedSite || !selectedBatiment ? 'pulse-border 2s infinite' : 'none'
              }}
            >
              {!selectedSite || !selectedBatiment ? (
                <div className="mb-3 d-flex align-items-center" style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                  <FaIcon icon="fa-exclamation-triangle" className={isArabic ? "me-2" : "ms-2"} style={{ fontSize: '14px' }} />
                  {isArabic ? "يجب اختيار الموقع والحظيرةللمتابعة" : "Veuillez sélectionner le centre et le bâtiment pour continuer"}
                </div>
              ) : (
                <div className="mb-3 d-flex align-items-center" style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                  <FaIcon icon="fa-check-circle" className={isArabic ? "me-2" : "ms-2"} style={{ fontSize: '14px' }} />
                  {isArabic ? "تم اختيار الموقع والحظيرةبنجاح" : "Centre et bâtiment sélectionnés avec succès"}
                </div>
              )}
              
              <div className="row g-2">
                <div className="col-md-7 col-12">
                  <div className="mb-2">
                    <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                      <label className="form-label fw-bold mb-0 text-nowrap d-flex align-items-center" style={{ 
                        fontSize: '13px', 
                        color: '#1f2937',
                        minWidth: '80px',
                        gap: '5px'
                      }}>
                        <FaIcon icon="fa-map-marker-alt" style={{ color: '#3b82f6', fontSize: '14px' }} />
                        <span>{isArabic ? "الموقع" : "Centre"}</span>
                        <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select flex-grow-1"
                        value={selectedSite}
                        onChange={handleSiteChange}
                        style={{
                          padding: '7px 12px',
                          border: !selectedSite ? '2px solid #f87171' : '2px solid #10b981',
                          borderRadius: '8px',
                          background: !selectedSite ? '#fef2f2' : '#ffffff',
                          fontSize: '13px',
                          height: '38px',
                          textAlign: isArabic ? 'right' : 'left',
                          fontWeight: '600',
                          boxShadow: !selectedSite 
                            ? '0 0 0 3px rgba(248, 113, 113, 0.1)' 
                            : '0 1px 3px rgba(0, 0, 0, 0.08)',
                          color: '#1e293b',
                          cursor: 'pointer'
                        }}
                        dir={isArabic ? 'rtl' : 'ltr'}
                      >
                        <option value="" style={{ color: '#94a3b8' }}>{isArabic ? "⚠️ يرجى اختيار الموقع..." : "⚠️ Veuillez sélectionner un centre..."}</option>
                        {uniqueSiteOptions.map((site, index) => (
                          <option key={site.numcentre || `site-${index}`} value={site.numcentre || site.libellecentre}>
                            📍 {site.batiment ? tField(site.batiment, 'libelleCentre') : tField(site, 'libellecentre')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-md-5 col-12">
                  {miseplacesError ? (
                    <div className="alert alert-warning p-2 mb-0" style={{ fontSize: '11px' }}>
                      <FaIcon icon="fa-info-circle" className={isArabic ? "me-2" : "ms-2"} />
                      {miseplacesError}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        <label className="form-label fw-bold mb-0 text-nowrap d-flex align-items-center" style={{ 
                          fontSize: '12px', 
                          color: '#1f2937',
                          minWidth: '70px',
                          gap: '4px'
                        }}>
                          <FaIcon icon="fa-warehouse" style={{ color: '#f59e0b', fontSize: '13px' }} />
                          <span>{isArabic ? "الحظيرة" : "Bâtiment"}</span>
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select flex-grow-1"
                          value={selectedBatiment}
                          onChange={handleBatimentChange}
                          disabled={miseplaces.length === 0}
                          style={{
                            padding: '6px 10px',
                            border: !selectedBatiment ? '2px solid #f87171' : '2px solid #10b981',
                            borderRadius: '7px',
                            background: !selectedBatiment ? '#fef2f2' : '#ffffff',
                            fontSize: '13px',
                            height: '34px',
                            textAlign: isArabic ? 'right' : 'left',
                            fontWeight: '600',
                            boxShadow: !selectedBatiment 
                              ? '0 0 0 3px rgba(248, 113, 113, 0.1)' 
                              : '0 1px 3px rgba(0, 0, 0, 0.08)',
                            cursor: miseplaces.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: miseplaces.length === 0 ? 0.6 : 1,
                            color: '#1e293b'
                          }}
                          dir={isArabic ? 'rtl' : 'ltr'}
                        >
                          <option value="" style={{ color: '#94a3b8' }}>{isArabic ? "⚠️ اختر الحظيرة..." : "⚠️ Sélectionnez un bâtiment..."}</option>
                          {miseplaces.map((miseplace, index) => (
                            <option key={miseplace.numbat || `${miseplace.numcentre}-${index}`} value={miseplace.numbat || miseplace.libbat}>
                              🏢 {tField(miseplace, 'libbat')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {miseplacesError && (
                <div className="alert alert-warning p-2 mt-2 mb-0" style={{ fontSize: '11px' }}>
                  <FaIcon icon="fa-info-circle" className={isArabic ? "me-2" : "ms-2"} />
                  {miseplacesError}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <InputGroup title={isArabic ? "معلومات الدورة" : "Informations de la session"} icon={<FaIcon icon="fa-info-circle" />} highlight={true} isArabic={isArabic}>
              <div className="row g-2">
                <div className="col-md-6 col-12">
                  <ProfessionalInputField
                    label={isArabic ? "رقم الحركة" : "Numéro de lot"}
                    type="text"
                    name="nummvt"
                    value={selectedMiseplace?.nummvt || ''}
                    readOnly
                    icon={<FaIcon icon="fa-list-ol" />}
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-md-6 col-12">
                  <ProfessionalInputField
                    label={isArabic ? "العدد الجملي" : "Effectif global"}
                    isArabic={isArabic}
                    type="number"
                    name="teffectif_global"
                    value={formData.teffectif_global}
                    placeholder="--"
                    min="0"
                    invalid={!!formErrors.teffectif_global}
                    feedback={formErrors.teffectif_global}
                    required
                    readOnly
                    icon={<FaIcon icon="fa-chart-bar" />}
                  />
                </div>
              </div>
            </InputGroup>
          </div>
        </div>

      </div>

      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          marginBottom: '28px',
          marginTop: '8px',
          padding: '20px',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <SectionHeader 
          icon={<FaIcon icon="fa-edit" />}
          title={isArabic ? "إدخال البيانات اليومية" : "Saisie des données quotidiennes"}
          subtitle={isArabic ? "إدخال البيانات والإحصائيات اليومية" : "Saisir les données et statistiques quotidiennes"}
          isArabic={isArabic}
        />

        <div
          className="day-navigation-wrapper d-flex flex-column align-items-center gap-2 mb-4"
          style={{ textAlign: 'center' }}
        >
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-3">
            <CButton
              color="primary"
              className="fw-bold text-white d-flex align-items-center gap-2"
              onClick={() => handleDayNavigation(-1)}
              disabled={!canNavigateBackward || dayNavigationLoading}
              style={{ minWidth: '140px' }}
            >
              <CIcon icon={isArabic ? cilChevronRight : cilChevronLeft} />
              <span>{isArabic ? "اليوم السابق" : "Jour précédent"}</span>
            </CButton>

            <div
              className="px-4 py-2 rounded-pill fw-semibold text-secondary bg-light border"
              style={{
                minWidth: '220px',
                borderColor: 'var(--border-color)',
              }}
            >
              <span style={{ fontSize: '13px' }}>
                {activeDateLabel || activeDate || '—'}
              </span>
            </div>

            <CButton
              color="primary"
              className="fw-bold text-white d-flex align-items-center gap-2"
              onClick={() => handleDayNavigation(1)}
              disabled={!canNavigateForward || dayNavigationLoading}
              style={{ minWidth: '140px' }}
            >
              <span>{isArabic ? "اليوم التالي" : "Jour suivant"}</span>
              <CIcon icon={isArabic ? cilChevronLeft : cilChevronRight} />
            </CButton>
          </div>

          {dayNavigationLoading && (
            <div className="text-muted small d-flex align-items-center gap-2">
              <CSpinner size="sm" />
              <span>{isArabic ? "جاري تحديث بيانات اليوم..." : "Mise à jour des données du jour..."}</span>
            </div>
          )}

          {!dayNavigationLoading && (
            <>
              {!canNavigateBackward && previousButtonDisabledReason && 
               previousButtonDisabledReason !== nextButtonDisabledReason && (
                <div className="text-warning small d-flex align-items-center gap-2">
                  <FaIcon icon="fa-exclamation-triangle" />
                  <span>{previousButtonDisabledReason}</span>
                </div>
              )}

              {!canNavigateForward && nextButtonDisabledReason && (
                <div className="text-warning small d-flex align-items-center gap-2">
                  <FaIcon icon="fa-info-circle" />
                  <span>{nextButtonDisabledReason}</span>
                </div>
              )}
            </>
          )}

          {jourEnCoursError && (
            <div className="text-danger small">{jourEnCoursError}</div>
          )}
        </div>

        <div className="row mb-3">
          <div className="col-lg-6 col-md-12 mb-3">
            <InputGroup title={isArabic ? "المعلومات الزمنية" : "Informations temporelles"} icon={<FaIcon icon="fa-calendar" />} highlight={true} isArabic={isArabic}>
              <div className="row g-2">
                <div className="col-md-6 col-12">
                  <ProfessionalInputField
                    label={isArabic ? "التاريخ" : "Date"}
                    type="date"
                    name="tdate"
                    value={formData.tdate}
                    onChange={handleInputChange}
                    readOnly
                    icon={<FaIcon icon="fa-calendar-alt" />}
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-md-3 col-6">
                  <div className="professional-input-field mb-2">
                    <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                      <CFormLabel className="input-label fw-bold mb-0 text-nowrap" style={{ 
                        color: 'var(--text-primary)', 
                        fontSize: '11px',
                        minWidth: '55px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <FaIcon icon="fa-calendar-week" style={{ color: 'var(--accent-color)', fontSize: '11px' }} />
                        <span>{isArabic ? "الأسبوع" : "Semaine"}</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        name="tsemaine"
                        value={formData.tsemaine}
                        onChange={handleInputChange}
                        min="1"
                        max="52"
                        readOnly
                        className="enhanced-input"
                        style={{
                          padding: '4px 8px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          fontSize: '13px',
                          height: '28px',
                          textAlign: 'center',
                          fontWeight: '600',
                          width: '55px',
                          color: '#475569'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="professional-input-field mb-2">
                    <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                      <CFormLabel className="input-label fw-bold mb-0 text-nowrap" style={{ 
                        color: 'var(--text-primary)', 
                        fontSize: '11px',
                        minWidth: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <FaIcon icon="fa-calendar-day" style={{ color: 'var(--accent-color)', fontSize: '11px' }} />
                        <span>{isArabic ? "اليوم" : "Jour"}</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        name="tjour"
                        value={formData.tjour}
                        onChange={handleInputChange}
                        min="1"
                        readOnly
                        className="enhanced-input"
                        style={{
                          padding: '4px 0px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          fontSize: '13px',
                          height: '28px',
                          textAlign: 'center',
                          fontWeight: '600',
                          width: '50px',
                          color: '#475569'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </InputGroup>
          </div>

          <div className="col-lg-6 col-md-12 mb-3">
            <InputGroup title={isArabic ? "بيانات النوع والسلالة" : "Données d'espèce et de souche"} icon={<FaIcon icon="fa-dna" />} highlight={true} isArabic={isArabic}>
              <div className="row g-2">
                <div className="col-md-6 col-12">
                  <ProfessionalInputField
                    label={isArabic ? "النوع" : "Espèce"}
                    type="text"
                    name="tespece"
                    value={`${jourEnCoursData?.tcodeesp || ''} - ${isArabic ? (jourEnCoursData?.tespecearabe || jourEnCoursData?.tespece || '') : (jourEnCoursData?.tespece || jourEnCoursData?.tespecearabe || '')}`}
                    readOnly
                    icon={<FaIcon icon="fa-dove" />}
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-md-6 col-12">
                  <ProfessionalInputField
                    label={isArabic ? "السلالة" : "Souche"}
                    type="text"
                    name="souche"
                    value={formData.souche}
                    placeholder="--"
                    invalid={!!formErrors.souche}
                    feedback={formErrors.souche}
                    required
                    readOnly
                    icon={<FaIcon icon="fa-seedling" />}
                    isArabic={isArabic}
                  />
                </div>
              </div>
            </InputGroup>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-lg-4 col-md-6 col-12">
            <InputGroup title={isArabic ? "إحصائيات القطيع" : "Statistiques du troupeau"} icon={<FaIcon icon="fa-dove" />} compact={true} className="compact-flock-group" isArabic={isArabic}>
              <div className="row g-0 compact-flock-row">
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "النفوق" : "Mortalité"}
                    type="number"
                    name="tmortalite"
                    value={formData.tmortalite}
                    onChange={handleInputChange}
                    min="0"
                    invalid={!!formErrors.tmortalite}
                    feedback={formErrors.tmortalite}
                    required
                    icon={<FaIcon icon="fa-heartbeat" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "نفوق الذكور" : "Mortalité mâles"}
                    type="number"
                    name="tmortmale"
                    value={formData.tmortmale}
                    onChange={handleInputChange}
                    min="0"
                    icon={<FaIcon icon="fa-heart-broken" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "المضاف" : "Ajouté"}
                    type="number"
                    name="teffajout"
                    value={formData.teffajout}
                    onChange={handleInputChange}
                    min="0"
                    invalid={!!formErrors.added}
                    feedback={formErrors.added}
                    required
                    icon={<FaIcon icon="fa-plus-circle" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "المسحوب" : "Retiré"}
                    type="number"
                    name="teffretire"
                    value={formData.teffretire}
                    onChange={handleInputChange}
                    min="0"
                    icon={<FaIcon icon="fa-minus-circle" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-12">
                  <ProfessionalInputField
                    label={isArabic ? "العدد اليومي" : "Effectif quotidien"}
                    type="number"
                    name="teffectifj"
                    value={formData.teffectifj || jourEnCoursData?.teffectifj || ''}
                    onChange={handleInputChange}
                    icon={<FaIcon icon="fa-hashtag" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
              </div>
            </InputGroup>
          </div>

          <div className="col-lg-4 col-md-6 col-12">
            <InputGroup title={isArabic ? "مقاييس الإنتاج" : "Mesures de production"} icon={<FaIcon icon="fa-chart-line" />} compact={true} isArabic={isArabic}>
              <div className="row g-1">
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "كمية البيع" : "Quantité vendue"}
                    type="number"
                    name="tqtev"
                    value={formData.tqtev}
                    min="0"
                    invalid={!!formErrors.tqtev}
                    feedback={formErrors.tqtev}
                    required
                    readOnly
                    icon={<FaIcon icon="fa-exchange-alt" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "وزن البيع" : "Poids de vente"}
                    type="number"
                    name="tpoidsv"
                    value={formData.tpoidsv}
                    step="0.01"
                    min="0"
                    invalid={!!formErrors.tpoidsv}
                    feedback={formErrors.tpoidsv}
                    readOnly
                    icon={<FaIcon icon="fa-weight" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "المبلغ" : "Montant"}
                    type="number"
                    name="tmtv"
                    value={formData.tmtv}
                    min="0"
                    invalid={!!formErrors.tmtv}
                    feedback={formErrors.tmtv}
                    readOnly
                    icon={<FaIcon icon="fa-money-bill-wave" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "وزن البيض" : "Poids des œufs"}
                    type="number"
                    name="tpoidsoeuf"
                    value={jourEnCoursData?.tpoidsoeuf || ''}
                    readOnly
                    icon={<FaIcon icon="fa-weight-hanging" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-12">
                  <ProfessionalInputField
                    label={isArabic ? "عدد الأطباق" : "Nombre d'alvéoles"}
                    type="number"
                    name="tnbralveole"
                    value={formData.tnbralveole}
                    min="0"
                    readOnly
                    icon={<FaIcon icon="fa-box" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
              </div>
            </InputGroup>
          </div>

          <div className="col-lg-4 col-md-6 col-12">
            <InputGroup title={isArabic ? "الظروف البيئية" : "Conditions environnementales"} icon={<FaIcon icon="fa-thermometer-half" />} compact={true} isArabic={isArabic}>
              <div className="row g-1">
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "درجة الحرارة" : "Température"}
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="50"
                    invalid={!!formErrors.temperature}
                    feedback={formErrors.temperature}
                    icon={<FaIcon icon="fa-thermometer-half" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "الرطوبة" : "Humidité"}
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    invalid={!!formErrors.humidity}
                    feedback={formErrors.humidity}
                    icon={<FaIcon icon="fa-tint" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "كمية الماء" : "Quantité d'eau"}
                    type="number"
                    name="tconseaulot"
                    value={formData.tconseaulot}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    invalid={!!formErrors.tconseaulot}
                    feedback={formErrors.tconseaulot}
                    icon={<FaIcon icon="fa-tint" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-6">
                  <ProfessionalInputField
                    label={isArabic ? "الإضاءة الطبيعية" : "Éclairage naturel"}
                    type="number"
                    name="teclairlot"
                    value={formData.teclairlot}
                    onChange={handleInputChange}
                    min="0"
                    invalid={!!formErrors.teclairlot}
                    feedback={formErrors.teclairlot}
                    icon={<FaIcon icon="fa-sun" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
                <div className="col-12">
                  <ProfessionalInputField
                    label={isArabic ? "الإضاءة الداخلية" : "Éclairage intérieur"}
                    type="number"
                    name="tintlumlot"
                    value={formData.tintlumlot}
                    onChange={handleInputChange}
                    min="0"
                    invalid={!!formErrors.tintlumlot}
                    feedback={formErrors.tintlumlot}
                    icon={<FaIcon icon="fa-lightbulb" />}
                    compact
                    isArabic={isArabic}
                  />
                </div>
              </div>
            </InputGroup>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-12">
            <InputGroup title={isArabic ? "الملاحظات" : "Notes"} icon={<FaIcon icon="fa-sticky-note" />} isArabic={isArabic}>
              <CFormTextarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                placeholder="--"
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'var(--input-bg)',
                  fontSize: '11px',
                  minHeight: '60px',
                  textAlign: isArabic ? 'right' : 'left',
                  direction: isArabic ? 'rtl' : 'ltr',
                  resize: 'vertical',
                }}
              />
            </InputGroup>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-lg-4 col-md-12">
          <StructureList items={structures} activeItem={selectedStructure} onItemClick={handleStructureClick} loading={false} isArabic={isArabic} />
        </div>

        <div className="col-lg-8 col-md-12">
          <CCard style={{
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CCardBody style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div className="d-flex align-items-center mb-3" style={{ 
                borderBottom: '2px solid #f1f5f9', 
                paddingBottom: '12px'
              }}>
                <div style={{ 
                  width: '4px', 
                  height: '24px', 
                  background: 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)',
                  borderRadius: '2px',
                  [isArabic ? 'marginRight' : 'marginLeft']: '12px'
                }}></div>
                <div>
                  <div className="fw-bold d-flex align-items-center" style={{ 
                    fontSize: '16px', 
                    color: '#1e293b',
                    fontWeight: '700'
                  }}>
                    <FaIcon icon="fa-clipboard-check" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)', fontSize: '18px' }} />
                    {isArabic ? "جرد المخزون" : "Inventaire du stock"}
                  </div>
                  <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    {isArabic ? "إدارة المخزون والمواد المستهلكة" : "Gestion des stocks et des consommables"}
                  </small>
                </div>
              </div>

                {lmvtLoading && (
                  <div
                    className="alert alert-info py-1 px-2 my-2"
                    style={{ fontSize: '10px', borderRadius: '6px' }}
                  >
                    <FaIcon icon="fa-spinner" className={isArabic ? "me-1" : "ms-1"} style={{ animation: 'spin 1s linear infinite' }} />
                    {isArabic ? "يتم تحميل الحركات المسجلة..." : "Chargement des mouvements enregistrés..."}
                  </div>
                )}

                {!lmvtLoading && lmvtMovements.length > 0 && (
                  <div
                    className="alert alert-primary py-1 px-2 my-2"
                    style={{ fontSize: '10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}
                  >
                    <FaIcon icon="fa-database" className={isArabic ? "me-1" : "ms-1"} />
                    {isArabic ? `تم العثور على ${lmvtMovements.length.toLocaleString()} عنصر(عناصر) مسجل في الحركة الحالية.` : `Trouvé ${lmvtMovements.length.toLocaleString()} élément(s) enregistré(s) dans le mouvement actuel.`}
                  </div>
                )}

                {lmvtError && (
                  <div
                    className="alert alert-warning py-1 px-2 my-2"
                    style={{ fontSize: '10px', borderRadius: '6px' }}
                  >
                    <FaIcon icon="fa-triangle-exclamation" className={isArabic ? "me-1" : "ms-1"} />
                    {lmvtError}
                  </div>
                )}

                {inventory.length === 0 ? (
                  <div className="text-center p-3 text-muted d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <FaIcon icon="fa-box-open" className="mb-2 opacity-50" style={{ fontSize: '32px' }} />
                    <div className="fw-bold" style={{fontSize: '12px'}}>{isArabic ? "لا توجد عناصر في المخزون" : "Aucun élément en stock"}</div>
                  </div>
                ) : (
                  <>
                    {/* Barre de recherche pour les articles */}
                    <div className="mb-3" style={{ padding: '0 4px' }}>
                      <CInputGroup>
                        <CFormInput
                          type="text"
                          placeholder={isArabic ? "بحث عن منتوج (كود أو اسم)..." : "Rechercher un produit (code ou nom)..."}
                          value={articleSearchTerm}
                          onChange={(e) => setArticleSearchTerm(e.target.value)}
                          dir={isArabic ? 'rtl' : 'ltr'}
                          style={{
                            fontSize: '13px',
                            padding: '10px 14px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            textAlign: isArabic ? 'right' : 'left',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                            direction: isArabic ? 'rtl' : 'ltr'
                          }}
                        />
                        <CButton
                          color="secondary"
                          variant="outline"
                          style={{
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            [isArabic ? 'borderRight' : 'borderLeft']: 'none',
                            [isArabic ? 'borderTopRightRadius' : 'borderTopLeftRadius']: '0',
                            [isArabic ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: '0'
                          }}
                        >
                          <CIcon icon={cilSearch} />
                        </CButton>
                      </CInputGroup>
                    </div>

                    <div className="table-responsive" style={{ 
                      borderRadius: '12px',
                      overflow: 'auto',
                      border: '1px solid #f1f5f9',
                      direction: isArabic ? 'rtl' : 'ltr',
                      maxHeight: '400px',
                      minHeight: '200px'
                    }}>
                      <table
                        className="table mb-0"
                        dir={isArabic ? 'rtl' : 'ltr'}
                        style={{
                          width: '100%',
                          borderCollapse: 'separate',
                          borderSpacing: '0',
                          fontSize: '12px',
                          direction: isArabic ? 'rtl' : 'ltr',
                          textAlign: isArabic ? 'right' : 'left'
                        }}
                      >
                        <thead>
                          <tr>
                            <th 
                              style={{ 
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                                padding: '12px', 
                                textAlign: 'center', 
                                fontWeight: '700', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                userSelect: 'none',
                                verticalAlign: 'middle'
                              }}
                              onClick={() => handleInventorySort('codeart')}
                            >
                              <div className="d-flex align-items-center justify-content-center">
                                <FaIcon icon="fa-barcode" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? "كود المنتوج" : "Code produit"}
                                {inventorySortConfig.key === 'codeart' && (
                                  <FaIcon 
                                    icon={inventorySortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} 
                                    className={isArabic ? "ms-2" : "me-2"} 
                                    style={{ fontSize: '10px', color: 'rgb(231 101 88)' }} 
                                  />
                                )}
                              </div>
                            </th>
                            <th 
                              style={{ 
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                                padding: '12px', 
                                textAlign: 'center', 
                                fontWeight: '700', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                fontSize: '12px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                verticalAlign: 'middle'
                              }}
                              onClick={() => handleInventorySort('desart')}
                            >
                              <div className="d-flex align-items-center justify-content-center">
                                <FaIcon icon="fa-box" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? "إسم المنتوج" : "Nom produit"}
                                {inventorySortConfig.key === 'desart' && (
                                  <FaIcon 
                                    icon={inventorySortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} 
                                    className={isArabic ? "ms-2" : "me-2"} 
                                    style={{ fontSize: '10px', color: 'rgb(231 101 88)' }} 
                                  />
                                )}
                              </div>
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '12px', 
                              textAlign: 'center', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '12px',
                              verticalAlign: 'middle'
                            }}>
                              <div className="d-flex align-items-center justify-content-center">
                                <FaIcon icon="fa-hashtag" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? "الكمية المتاحة" : "Quantité disponible"}
                              </div>
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '12px', 
                              textAlign: 'center', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '12px',
                              width: '160px',
                              verticalAlign: 'middle'
                            }}>
                              <div className="d-flex align-items-center justify-content-center">
                                <FaIcon icon="fa-edit" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? "الكمية المطلوبة" : "Quantité requise"}
                              </div>
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '12px', 
                              textAlign: 'center', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '12px',
                              verticalAlign: 'middle'
                            }}>
                              <div className="d-flex align-items-center justify-content-center">
                                <FaIcon icon="fa-cog" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? "الإجراءات" : "Actions"}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                <FaIcon icon="fa-inbox" className="mb-2" style={{ fontSize: '32px', opacity: 0.5 }} />
                                <div style={{ fontSize: '13px' }}>{isArabic ? "لا توجد نتائج" : "Aucun résultat"}</div>
                              </td>
                            </tr>
                          ) : (
                            currentItems.map((item, index) => {
                            const normalizedCode = normalizeArticleCode(item.codeart || item.CodeArt || '');
                            const itemFamille = (item.famille || item.Famille || item.codefam || item.codeFamille || '').toString().trim().toUpperCase();
                            const itemDepot = (item.codeDep || item.codeDepBat || item.depotCode || '').toString().trim().toUpperCase();
                            const compositeKey = buildCompositeKey(normalizedCode, itemFamille, itemDepot);
                            const existingMovement =
                              existingMovementsMap.get(compositeKey) ||
                              existingMovementsMap.get(normalizedCode);
                            const existingMovementQuantity = Number.isFinite(Number(existingMovement?.quantity))
                              ? Number(existingMovement.quantity)
                              : 0;
                            const hasExistingMovement = existingMovementQuantity > 0;
                            const baseAvailableQuantity = resolveBaseAvailableQuantity(item);
                            const remainingAdditionCapacity = getRemainingAdditionCapacity(item);
                            const isInCart = isItemInCart(item.codeart);
                            const cartEntry = cartItems.find((cartItem) => cartItem.codeart === item.codeart);
                            const rawUserQuantity = quantityInputs[item.codeart];
                            const userQuantity = Number.isFinite(Number(rawUserQuantity)) ? Number(rawUserQuantity) : 0;
                            const hasUserQuantity = rawUserQuantity !== undefined;

                            let displayQuantity;
                            if (isInCart) {
                              const cartQuantity = cartEntry?.quantity ?? userQuantity;
                              displayQuantity = Number.isFinite(Number(cartQuantity)) ? Number(cartQuantity) : 0;
                            } else if (hasUserQuantity) {
                              displayQuantity = userQuantity;
                            } else if (hasExistingMovement) {
                              displayQuantity = existingMovementQuantity;
                            } else {
                              displayQuantity = 0;
                            }
                            const rowClasses = [
                              isInCart ? 'cart-item-added' : '',
                              hasExistingMovement ? 'existing-mvt-row' : ''
                            ].filter(Boolean).join(' ');

                            const rowStyle = hasExistingMovement ? { position: 'relative' } : {};

                            return (
                              <tr 
                                key={item.codeart}
                                className={rowClasses}
                                style={{
                                  ...rowStyle,
                                  borderBottom: index < currentItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#ffffff';
                                }}
                              >
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontSize: '12px', 
                                  color: 'rgb(231 101 88)', 
                                  fontWeight: '700',
                                  fontFamily: 'monospace',
                                  borderBottom: '1px solid #f1f5f9',
                                  verticalAlign: 'middle'
                                }}>
                                  {item.codeart}
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontSize: '12px', 
                                  color: '#1e293b',
                                  fontWeight: '500',
                                  borderBottom: '1px solid #f1f5f9',
                                  verticalAlign: 'middle'
                                }}>
                                  {isArabic ? (item.libarabe || '') : (item.desart || '')}
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontSize: '12px', 
                                  color: '#10b981', 
                                  fontWeight: '700',
                                  borderBottom: '1px solid #f1f5f9',
                                  verticalAlign: 'middle'
                                }}>
                                  {baseAvailableQuantity.toLocaleString()}
                                </td>
                                <td style={{ 
                                  padding: '8px 4px', 
                                  textAlign: 'center', 
                                  fontSize: '12px',
                                  borderBottom: '1px solid #f1f5f9',
                                  width: '160px',
                                  verticalAlign: 'middle'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                    <QuantityInput
                                      value={displayQuantity}
                                      onChange={(newQuantity) => handleQuantityInputChange(item, newQuantity)}
                                      min={0}
                                      isArabic={isArabic}
                                    />
                                    {quantityErrors[item.codeart] && (
                                      <div style={{ 
                                        color: 'var(--danger)', 
                                        fontSize: '8px', 
                                        marginTop: '1px',
                                        lineHeight: '1.1'
                                      }}>
                                        {quantityErrors[item.codeart]}
                                      </div>
                                    )}
                                    {hasExistingMovement && (
                                      <div
                                        style={{
                                          color: '#2563eb',
                                          fontSize: '8px',
                                          marginTop: '1px',
                                          fontWeight: 600,
                                          lineHeight: '1.1'
                                        }}
                                      >
                                        {isArabic ? "مسجل" : "Enregistré"}: {existingMovementQuantity.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  textAlign: 'center', 
                                  fontSize: '12px',
                                  borderBottom: '1px solid #f1f5f9',
                                  verticalAlign: 'middle'
                                }}>
                                  {isInCart ? (
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      <CBadge color="success" style={{ fontSize: '9px', padding: '4px 8px' }}>
                                        {isArabic ? "مضاف للقائمة" : "Ajouté à la liste"}
                                      </CBadge>
                                      <CButton
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeFromCart(item.codeart)}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '10px',
                                          minWidth: 'auto',
                                        }}
                                      >
                                        <FaIcon icon="fa-trash" />
                                      </CButton>
                                    </div>
                                  ) : (
                                    <div className="d-flex gap-1 justify-content-center">
                                      <CButton
                                        color="primary"
                                        size="sm"
                                        onClick={() => handleAddToCartWithQuantity(item)}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '11px',
                                        }}
                                      >
                                        <FaIcon icon="fa-cart-plus" className={isArabic ? "me-1" : "ms-1"} />
                                        {isArabic ? "إضافة" : "Ajouter"}
                                      </CButton>
                                      <CButton
                                        color="outline-primary"
                                        size="sm"
                                        onClick={() => handleQuickAddToCart(item)}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '10px',
                                        }}
                                        title={isArabic ? "إضافة كمية واحدة" : "Ajouter une quantité"}
                                      >
                                        +1
                                      </CButton>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {filteredAndSortedInventory.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{isArabic ? "عدد العناصر في الصفحة:" : "Éléments par page:"}</span>
                          <select
                            value={inventoryItemsPerPage}
                            onChange={(e) => {
                              setInventoryItemsPerPage(Number(e.target.value));
                              setInventoryCurrentPage(1);
                            }}
                            dir={isArabic ? 'rtl' : 'ltr'}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '12px',
                              direction: isArabic ? 'rtl' : 'ltr'
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {isArabic ? `عرض ${((inventoryCurrentPage - 1) * inventoryItemsPerPage) + 1} - ${Math.min(inventoryCurrentPage * inventoryItemsPerPage, filteredAndSortedInventory.length)} من ${filteredAndSortedInventory.length}` : `Affichage ${((inventoryCurrentPage - 1) * inventoryItemsPerPage) + 1} - ${Math.min(inventoryCurrentPage * inventoryItemsPerPage, filteredAndSortedInventory.length)} sur ${filteredAndSortedInventory.length}`}
                          </span>
                          <CPagination aria-label="Page navigation">
                            <CPaginationItem
                              disabled={inventoryCurrentPage === 1}
                              onClick={() => inventoryCurrentPage > 1 && setInventoryCurrentPage(inventoryCurrentPage - 1)}
                              style={{ cursor: inventoryCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <FaIcon icon={isArabic ? "fa-chevron-left" : "fa-chevron-right"} />
                            </CPaginationItem>
                            {[...Array(inventoryTotalPages)].map((_, i) => {
                              const page = i + 1;
                              if (
                                page === 1 ||
                                page === inventoryTotalPages ||
                                (page >= inventoryCurrentPage - 1 && page <= inventoryCurrentPage + 1)
                              ) {
                                return (
                                  <CPaginationItem
                                    key={page}
                                    active={inventoryCurrentPage === page}
                                    onClick={() => setInventoryCurrentPage(page)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {page}
                                  </CPaginationItem>
                                );
                              } else if (page === inventoryCurrentPage - 2 || page === inventoryCurrentPage + 2) {
                                return <CPaginationItem key={page} disabled>...</CPaginationItem>;
                              }
                              return null;
                            })}
                            <CPaginationItem
                              disabled={inventoryCurrentPage === inventoryTotalPages}
                              onClick={() => inventoryCurrentPage < inventoryTotalPages && setInventoryCurrentPage(inventoryCurrentPage + 1)}
                              style={{ cursor: inventoryCurrentPage === inventoryTotalPages ? 'not-allowed' : 'pointer' }}
                            >
                              <FaIcon icon={isArabic ? "fa-chevron-right" : "fa-chevron-left"} />
                            </CPaginationItem>
                          </CPagination>
                        </div>
                      </div>
                    )}
                  </>
                )}
            </CCardBody>
          </CCard>
        </div>

        <div className="col-lg-8 col-md-12">
          <div className="row g-2">
            <div className="col-12">
              <CartPanel 
                cartItems={cartItems}
                onRemoveFromCart={removeFromCart}
                onUpdateQuantity={updateCartQuantity}
                onClearCart={clearCart}
                existingMovementsMap={existingMovementsMap}
                isProductionStructure={isProductionStructure}
                productionDailyLimit={productionDailyLimit}
                resolveBaseAvailableQuantityFn={resolveBaseAvailableQuantity}
                getRemainingAdditionCapacityFn={getRemainingAdditionCapacity}
                resolveStructureCodeFn={resolveStructureCode}
                isArabic={isArabic}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 mb-4">
        <button
          className="validate-button"
          onClick={handleValidateJournee}
          disabled={loading.validation || !selectedSite || !selectedBatiment || isProductionOverLimit}
          style={{
            padding: '14px 32px',
            fontSize: '15px',
            fontWeight: '700',
            background: (loading.validation || !selectedSite || !selectedBatiment || isProductionOverLimit)
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            opacity: (loading.validation || !selectedSite || !selectedBatiment || isProductionOverLimit) ? 0.7 : 1,
            cursor: (loading.validation || !selectedSite || !selectedBatiment || isProductionOverLimit) ? 'not-allowed' : 'pointer',
            boxShadow: (loading.validation || !selectedSite || !selectedBatiment || isProductionOverLimit) 
              ? 'none' 
              : '0 4px 12px rgba(16, 185, 129, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {loading.validation ? (
            <>
              <CSpinner size="sm" />
              <span>{isArabic ? "جاري الحفظ والتحقق..." : "Enregistrement et vérification..."}</span>
            </>
          ) : (
            <>
              <FaIcon icon="fa-check-circle" style={{ fontSize: '16px' }} />
              <span>{isArabic ? "تأكيد واختتام اليوم" : "Valider et clôturer la journée"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LayerDashboard;