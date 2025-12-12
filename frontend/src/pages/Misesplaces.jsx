import React, { useState, useEffect, useMemo } from 'react';
import { 
  CCard, 
  CCardBody, 
  CRow, 
  CCol, 
  CTable, 
  CButton, 
  CSpinner, 
  CBadge,
  CFormSelect,
  CInputGroup,
  CFormInput,
  CPagination,
  CPaginationItem,
  CAlert
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTranslationField } from '../hooks/useTranslationField';
import { 
  cilSearch, 
  cilBuilding, 
  cilHome, 
  cilListNumbered,
  cilCalendar,
  cilArrowRight,
  cilFilter
} from '@coreui/icons';
import api from '../services/api.js';
import { API_ENDPOINTS } from '../config/api.js';
import { PageHeaderCard } from '../components/index.jsx';
// import './BuildingList.css';

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Normalize date fields in API response data
const normalizeDate = (value) => {
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

// Normalize all date fields in API response data
const normalizeApiResponseDates = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // List of common date field names that might contain dates with time
  const dateFieldPatterns = [
    /date/i,
    /Date/i,
    /eclo/i,
    /Eclo/i,
    /cloture/i,
    /Cloture/i,
    /mvt/i,
    /Mvt/i,
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
      const isDateField = dateFieldPatterns.some(pattern => pattern.test(key));

      if (isDateField && value != null && value !== '') {
        try {
          const normalizedDate = normalizeDate(value);
          normalized[key] = normalizedDate || value;
        } catch (e) {
          // If normalization fails, keep original value
          normalized[key] = value;
        }
      } else if (value && typeof value === 'object') {
        normalized[key] = normalizeObject(value, visited);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  };

  return normalizeObject(data);
};

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);


// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }) => {
  // Convertir la couleur hex en classe Bootstrap si possible
  const getColorClass = (color) => {
    const colorMap = {
      '#ef2b1d': 'danger',
      '#10b981': 'success',
      '#6b7280': 'secondary',
      '#f59e0b': 'warning',
      '#3b82f6': 'primary',
      '#06b6d4': 'info'
    };
    return colorMap[color] || '';
  };

  const colorClass = getColorClass(color);
  const bgClass = colorClass ? `bg-${colorClass} bg-opacity-10` : '';
  const textClass = colorClass ? `text-${colorClass}` : '';

  return (
    <CCard className="stat-card h-100">
      <CCardBody className="p-2 p-md-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="flex-grow-1">
            <div className={`stat-value h5 h4-md fw-bold mb-0 mb-md-1 ${textClass}`} style={!colorClass ? { color: color } : {}}>
              {value}
            </div>
            <div className="stat-title text-muted small fw-semibold">
              {title}
            </div>
          </div>
          <div className={`stat-icon p-2 p-md-2 rounded-2 rounded-md-3 d-flex align-items-center justify-content-center ${bgClass} ${textClass}`} style={!colorClass ? { backgroundColor: `${color}15`, color: color, width: '40px', height: '40px', fontSize: '16px' } : { width: '40px', height: '40px', fontSize: '16px' }}>
            {icon}
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

// Radio Button Group Component for Status - Matching SiteSettings design
const StatusRadioGroup = React.memo(({ value, onChange, isArabic }) => {
  const statusOptions = [
    { value: 'encours', label: isArabic ? 'قيد التنفيذ' : 'En cours', icon: <FaIcon icon="fa-play-circle" /> },
    { value: 'cloturee', label: isArabic ? 'مغلقة' : 'Clôturée', icon: <FaIcon icon="fa-check-circle" /> },
  ];

  return (
    <div className="d-flex align-items-center gap-1 gap-md-2" style={{ flexWrap: 'nowrap' }}>
      {statusOptions.map((option) => (
        <label 
          key={option.value} 
          className="radio-option position-relative m-0"
          style={{ cursor: 'pointer' }}
        >
          <input
            type="radio"
            name="statusFilter"
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="radio-input position-absolute opacity-0"
            style={{ width: 0, height: 0 }}
          />
          <span
            className="radio-custom d-flex align-items-center justify-content-center rounded-2 border"
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
              transition: 'all 0.2s ease'
            }}
          >
            {option.icon && <span className={isArabic ? "ms-1" : "me-1"} style={{ fontSize: '10px' }}>{option.icon}</span>}
            <span className="radio-label">{option.label}</span>
          </span>
        </label>
      ))}
    </div>
  );
});

// Filter Section Component - Matching SiteSettings design
const FilterSection = ({ 
  sites,
  batiments,
  selectedSite, 
  onSiteChange,
  selectedBatiment,
  onBatimentChange,
  selectedStatus,
  onStatusChange,
  searchTerm, 
  onSearchChange,
  isArabic
}) => {
  const { t: tField } = useTranslationField();
  
  return (
  <CCard className="filter-card mb-2 mb-md-3" style={{
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-xs)',
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
    e.currentTarget.style.transform = 'translateY(0)';
  }}>
    <CCardBody className="p-2 p-md-3">
      <div className="d-flex align-items-center gap-1 gap-md-2 flex-wrap" style={{ 
        overflowX: 'auto',
        scrollbarWidth: 'thin'
      }}>
        {/* Search Input */}
        <div style={{ 
          flex: '1 1 200px', 
          minWidth: '180px',
          position: 'relative'
        }}>
          <CInputGroup>
            <CFormInput
              placeholder={isArabic ? 'بحث...' : 'Rechercher...'}
              value={searchTerm}
              onChange={onSearchChange}
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                textAlign: isArabic ? 'right' : 'left',
                borderRadius: '8px',
                padding: '3px 4px',
                height: '38px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.2s ease',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-color)';
                e.target.style.boxShadow = '0 0 0 3px rgba(80, 135, 168, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'var(--shadow-xs)';
              }}
            />
          </CInputGroup>
        </div>

        {/* Site Select */}
        <div style={{ 
          flex: '0 1 170px', 
          minWidth: '150px'
        }}>
          <CFormSelect
            value={selectedSite}
            onChange={onSiteChange}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              textAlign: isArabic ? 'right' : 'left',
              borderRadius: '8px',
              padding: '3px 4px',
              height: '38px',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-color)';
              e.target.style.boxShadow = '0 0 0 3px rgba(80, 135, 168, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'var(--shadow-xs)';
            }}
          >
            <option value="" style={{ color: '#94a3b8' }}>{isArabic ? 'جميع المواقع' : 'Tous les sites'}</option>
            {sites.map((site, index) => (
              <option key={site.numcentre || `site-${index}`} value={site.numcentre}>
                {site.batiment ? tField(site.batiment, 'libelleCentre') : site.libellecentre}
              </option>
            ))}
          </CFormSelect>
        </div>

        {/* Batiment Select */}
        <div style={{ 
          flex: '0 1 170px', 
          minWidth: '150px'
        }}>
          <CFormSelect
            value={selectedBatiment}
            onChange={onBatimentChange}
            style={{
              background: batiments.length === 0 ? 'var(--bg-light)' : 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              textAlign: isArabic ? 'right' : 'left',
              borderRadius: '8px',
              padding: '3px 4px',
              height: '38px',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.2s ease',
              cursor: batiments.length === 0 ? 'not-allowed' : 'pointer',
              opacity: batiments.length === 0 ? 0.6 : 1,
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
            disabled={batiments.length === 0}
            onFocus={(e) => {
              if (batiments.length > 0) {
                e.target.style.borderColor = 'var(--accent-color)';
                e.target.style.boxShadow = '0 0 0 3px rgba(80, 135, 168, 0.1)';
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'var(--shadow-xs)';
            }}
          >
            <option value="" style={{ color: '#94a3b8' }}>{isArabic ? 'جميع الحظائر' : 'Tous les bâtiments'}</option>
            {batiments.map((bat, index) => (
              <option key={bat.optionKey || `${bat.numbat}-${index}`} value={bat.numbat}>
                {tField(bat, 'libbat')}
              </option>
            ))}
          </CFormSelect>
        </div>

        {/* Status Radio Buttons */}
        <div className="d-flex align-items-center gap-1 gap-md-2 px-2 px-md-3 py-1" style={{ 
          flex: '0 0 auto',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          height: '38px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <label className="mb-0 fw-semibold text-nowrap small" style={{ 
            color: 'var(--text-primary)',
            marginLeft: isArabic ? '0' : '4px',
            marginRight: isArabic ? '4px' : '0'
          }}>
            <FaIcon icon="fa-filter" className={`${isArabic ? "ms-1" : "me-1"} text-danger`} />
            {isArabic ? 'الحالة:' : 'Statut:'}
          </label>
          <StatusRadioGroup 
            value={selectedStatus} 
            onChange={onStatusChange}
            isArabic={isArabic}
          />
        </div>
      </div>
    </CCardBody>
  </CCard>
  );
};

const getStatusStyles = (isArabic) => ({
  encours: {
    label: isArabic ? 'قيد التنفيذ' : 'En cours',
    background: '#dcfce7',
    color: '#166534',
    border: '#bbf7d0',
    icon: 'fa-circle-play'
  },
  cloturee: {
    label: isArabic ? 'مغلقة' : 'Clôturée',
    background: '#f3f4f6',
    color: '#374151',
    border: '#e5e7eb',
    icon: 'fa-circle-check'
  }
});

// Building Table Row Component
const BuildingTableRow = ({ miseplace, index, onRowClick, isArabic }) => {
  const { t: tField } = useTranslationField();
  const statusStyles = getStatusStyles(isArabic);
  const statusStyle = statusStyles[miseplace.lotStatus] || statusStyles.encours;

  return (
    <tr 
      className="building-table-row cursor-pointer"
      onClick={() => onRowClick(miseplace)}
      style={{
        transition: 'all 0.2s ease',
        borderLeft: '4px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f9ff';
        e.currentTarget.style.borderLeftColor = '#ef2b1d';
        e.currentTarget.style.transform = 'translateX(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderLeftColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <td className="text-center fw-semibold text-muted small p-2 p-md-3">
        {index + 1}
      </td>
      <td className="p-2 p-md-3">
        <div className="d-flex align-items-center">
          <div className={`building-icon d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded ${isArabic ? 'me-2 me-md-3' : 'ms-2 ms-md-3'}`}>
            <FaIcon icon="fa-map-marker-alt" className="text-primary" />
          </div>
          <div>
            <div className="fw-bold text-dark small">
              {tField(miseplace, 'libellecentre') || (isArabic ? 'غير محدد' : 'Non spécifié')}
            </div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
              {tField(miseplace, 'adresse') || (isArabic ? 'الموقع' : 'Site')}
            </div>
          </div>
        </div>
      </td>
      <td className="p-2 p-md-3">
        <div className="d-flex align-items-center">
          <div className={`bat-icon d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded ${isArabic ? 'me-2' : 'ms-2'}`}>
            <FaIcon icon="fa-warehouse" className="text-warning" />
          </div>
          <div>
            <div className="fw-semibold text-dark small">
              {tField(miseplace, 'libbat')}
            </div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
              {miseplace.numbat}
            </div>
          </div>
        </div>
      </td>
      <td className="p-2 p-md-3">
        <div className="d-flex align-items-center">
          <div className="mvt-badge px-2 px-md-3 py-1 py-md-2 d-flex align-items-center bg-info bg-opacity-10 rounded border border-info border-opacity-25">
            <FaIcon icon="fa-barcode" className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"} text-info`} />
            <span className="fw-bold text-info small">
              {miseplace.nummvt}
            </span>
          </div>
        </div>
      </td>
      <td className="text-center p-2 p-md-3" style={{ minWidth: '140px' }}>
        <div
          className="d-inline-flex align-items-center px-2 px-md-3 py-1 py-md-2 rounded-3 fw-semibold small"
          style={{
            backgroundColor: statusStyle.background,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.color
          }}
        >
          <FaIcon icon={statusStyle.icon} className="me-1" />
          <span>{statusStyle.label}</span>
        </div>
      </td>
      <td className="text-center p-2 p-md-3">
        <CButton 
          color="primary" 
          size="sm"
          className="d-flex align-items-center justify-content-center mx-auto"
        >
          <FaIcon icon={isArabic ? "fa-arrow-left" : "fa-arrow-right"} className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"}`} />
          <span className="d-none d-md-inline">{isArabic ? 'عرض التفاصيل' : 'Voir les détails'}</span>
          <span className="d-md-none">{isArabic ? 'التفاصيل' : 'Détails'}</span>
        </CButton>
      </td>
    </tr>
  );
};

// Empty State Component
const EmptyState = ({ message, subtitle, isArabic }) => (
  <CCard className="empty-state-card">
    <CCardBody className="text-center py-5">
      <div 
        className="empty-icon mb-3 mx-auto d-flex align-items-center justify-content-center"
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f8fafc',
          borderRadius: '50%',
          color: '#9ca3af',
          fontSize: '32px'
        }}
      >
        <FaIcon icon="fa-inbox" />
      </div>
      <h5 className="empty-title mb-2" style={{ color: '#374151', fontWeight: '600' }}>
        {message}
      </h5>
      <p className="empty-subtitle text-muted" style={{ fontSize: '14px' }}>
        {subtitle}
      </p>
    </CCardBody>
  </CCard>
);

// Main Building List Component
const BuildingList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { t: tField } = useTranslationField();

  // State declarations
  const [miseplaces, setMiseplaces] = useState([]);
  const [filteredMiseplaces, setFilteredMiseplaces] = useState([]);
  const [sites, setSites] = useState([]);
  const [batiments, setBatiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBatiment, setSelectedBatiment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('encours');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (selectedBatiment && !batiments.some(b => b.numbat === selectedBatiment)) {
      setSelectedBatiment('');
    }
  }, [batiments, selectedBatiment]);

  // Filter miseplaces based on search term, site, batiment, and status
  useEffect(() => {
    let filtered = miseplaces;

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.libellecentre && item.libellecentre.toLowerCase().includes(searchLower)) ||
        (item.libbat && item.libbat.toLowerCase().includes(searchLower)) ||
        (item.nummvt && item.nummvt.toString().includes(searchLower)) ||
        (item.adresse && item.adresse.toLowerCase().includes(searchLower))
      );
    }

    const batimentMap = new Map();
    miseplaces.forEach(m => {
      if (selectedSite && m.numcentre !== selectedSite) {
        return;
      }
      if (!m.numbat) {
        return;
      }

      const mapKey = `${m.numcentre || 'all'}-${m.numbat}`;
      if (!batimentMap.has(mapKey)) {
        // Construire le label avec les champs français (tField gérera la traduction selon la langue)
        const baseLabel = m.libbat || `حضيرة ${m.numbat}`;
        const centreLabel = m.libellecentre || '';
        const label = selectedSite
          ? baseLabel
          : centreLabel
            ? `${baseLabel} - ${centreLabel}`
            : baseLabel;

        batimentMap.set(mapKey, {
          numbat: m.numbat,
          numcentre: m.numcentre,
          libbat: label, // Garder le champ français, tField gérera la traduction
          libBatarabe: m.libBatarabe || m.libbatarabe, // Ajouter le champ arabe (variantes)
          libellecentre: m.libellecentre,
          libCentarabe: m.libCentarabe || m.libcentarabe, // Ajouter le champ arabe (variantes)
          optionKey: mapKey
        });
      }
    });
    setBatiments(Array.from(batimentMap.values()));

    if (selectedSite) {
      filtered = filtered.filter(item => item.numcentre === selectedSite);
    }

    if (selectedBatiment) {
      filtered = filtered.filter(item => item.numbat === selectedBatiment);
    }

    if (selectedStatus && selectedStatus !== '') {
      filtered = filtered.filter(item => item.lotStatus === selectedStatus);
    }

    setFilteredMiseplaces(filtered);
    setCurrentPage(1);
  }, [miseplaces, debouncedSearchTerm, selectedSite, selectedBatiment, selectedStatus]);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';

        // Fetch batiments avec miseplace data
        const batimentsResponse = await api.get(API_ENDPOINTS.batimentsAvecMiseplace, {
          params: { codeuser }
        });

        if (batimentsResponse.data?.success) {
          // Normalize date fields in the response before processing
          const normalizedResponse = normalizeApiResponseDates(batimentsResponse.data);
          const batimentsData = normalizedResponse.data || [];

          // Transform batiments data to miseplaces format
          // Each batiment has multiple miseplaces, so we need to flatten the data
          const miseplacesData = [];
          batimentsData.forEach(batiment => {
            const miseplacesList = batiment.miseplaces || [];
            miseplacesList.forEach(miseplace => {
              miseplacesData.push({
                numcentre: batiment.numCentre,
                libellecentre: batiment.libelleCentre,
                libCentarabe: batiment.libcentarabe || batiment.libCentarabe, // Ajouter le champ arabe (variantes)
                numbat: batiment.numBatiment,
                libbat: batiment.libelleBatiment || batiment.libellebat, // Garder le champ français pour libbat
                libBatarabe: batiment.libbatarabe || batiment.libBatarabe, // Ajouter le champ arabe (variantes)
                nummvt: miseplace.numMvt,
                numlot: miseplace.numLot || miseplace.numMvt,
                lotStatus: (miseplace.codeFact === 'N' || miseplace.lotStatus === 'N') ? 'encours' : 'cloturee',
                effectif: miseplace.effectif,
                codeEspece: miseplace.codeEspece,
                adresse: batiment.adresse,
                adrarabe: batiment.adrarabe, // Ajouter le champ arabe pour l'adresse
                batiment: batiment, // Garder la référence pour la traduction
                miseplace: miseplace // Garder aussi la référence de miseplace
              });
            });
          });

          setMiseplaces(miseplacesData);

          // Extract unique sites
          const uniqueSites = [];
          const seenSites = new Set();
          batimentsData.forEach(batiment => {
            const siteKey = batiment.numCentre;
            if (siteKey && !seenSites.has(siteKey)) {
          uniqueSites.push({
            numcentre: siteKey,
            libellecentre: batiment.libelleCentre,
            libCentarabe: batiment.libcentarabe || batiment.libCentarabe, // Ajouter le champ arabe (variantes)
            batiment: batiment // Garder la référence pour la traduction
          });
              seenSites.add(siteKey);
            }
          });
          setSites(uniqueSites);
        } else {
          throw new Error('Failed to load data from server');
        }
      } catch (err) {
        console.error('Error fetching building data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle row click to navigate to settings page
  const handleRowClick = (miseplace) => {
    // Navigate to the settings page with miseplace data
    navigate('/settings', { 
      state: { 
        selectedMiseplace: miseplace,
        selectedSite: miseplace.numcentre,
        selectedBatiment: miseplace.numbat,
        numMvt: miseplace.nummvt,
        numLot: miseplace.numlot,
        libellecentre: miseplace.libellecentre,
        libbat: miseplace.libbat,
        lotStatus: miseplace.lotStatus,
        filterStatus: selectedStatus,
        activeFilters: {
          site: selectedSite,
          batiment: selectedBatiment,
          status: selectedStatus,
          search: searchTerm
        },
        fromMiseplacesList: true
      }
    });
  };

  // Pagination
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMiseplaces.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMiseplaces, currentPage]);

  const totalPages = Math.ceil(filteredMiseplaces.length / itemsPerPage);

  // Stats calculation
  const stats = useMemo(() => {
    const totalMiseplaces = miseplaces.length;
    const activeMiseplaces = miseplaces.filter(m => m.lotStatus === 'encours').length;
    const closedMiseplaces = miseplaces.filter(m => m.lotStatus === 'cloturee').length;
    
    return { totalMiseplaces, activeMiseplaces, closedMiseplaces };
  }, [miseplaces]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <CSpinner color="primary" size="lg" />
          <div className="mt-3 text-muted">{isArabic ? 'جاري تحميل البيانات...' : 'Chargement des données...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`building-list-container page-container container-fluid ${isArabic ? 'rtl' : 'ltr'}`} style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-light)'
    }}>
      <style>
        {`
          :root {
            --accent-color: #ef2b1d;
            --accent-light: rgba(239, 43, 29, 0.12);
            --secondary: #593e35;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #06b6d4;
            --text-primary: #2b2b2b;
            --text-muted: #6b7280;
            --card-bg: #ffffff;
            --input-bg: #f9fafb;
            --bg-light: #f5f6fa;
            --border-color: #e3e3e3;
            --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          /* Styles optimisés avec Bootstrap - Paddings réduits */
          .stat-card {
            transition: all 0.3s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          .filter-card {
            transition: all 0.3s ease;
          }
          
          .filter-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            transform: translateY(-2px);
          }
          
          .building-table-row {
            transition: all 0.2s ease;
          }
          
          .table-card {
            overflow: hidden;
          }
          
          .table-header-row {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 2px solid #e2e8f0;
          }

          .building-icon {
            width: 42px;
            height: 42px;
            font-size: 18px;
          }

          .bat-icon {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          /* Réduction des espacements sur grands écrans */
          @media (min-width: 992px) {
            .building-list-container {
              padding: 0.75rem 1rem;
            }
          }

          @media (min-width: 1200px) {
            .building-list-container {
              padding: 0.75rem 1.25rem;
            }
          }

          @media (min-width: 1400px) {
            .building-list-container {
              max-width: 1920px;
              margin: 0 auto;
              padding: 1rem 2rem;
            }
          }

          @media (min-width: 1600px) {
            .building-list-container {
              max-width: 2000px;
              padding: 1rem 2.5rem;
            }
          }

          /* Augmentation de la taille des textes pour les grands écrans (≥1300px) */
          @media (min-width: 1300px) {
            .building-list-container {
              font-size: 1.05rem;
            }

            .building-list-container h1,
            .building-list-container .h1,
            .building-list-container .page-header-title {
              font-size: 1.35rem !important;
            }

            .building-list-container h2,
            .building-list-container .h2 {
              font-size: 1.25rem !important;
            }

            .building-list-container h3,
            .building-list-container .h3 {
              font-size: 1.15rem !important;
            }

            .building-list-container h4,
            .building-list-container .h4 {
              font-size: 1.05rem !important;
            }

            .building-list-container h5,
            .building-list-container .h5 {
              font-size: 1rem !important;
            }

            .building-list-container p,
            .building-list-container .text-muted {
              font-size: 1rem !important;
            }

            .building-list-container .small {
              font-size: 0.95rem !important;
            }

            .building-list-container .table {
              font-size: 1rem !important;
            }

            .building-list-container .table th {
              font-size: 1rem !important;
            }

            .building-list-container .table td {
              font-size: 0.95rem !important;
            }

            .building-list-container .btn {
              font-size: 1rem !important;
            }

            .building-list-container .btn-sm {
              font-size: 0.95rem !important;
            }

            .building-list-container .form-label {
              font-size: 1rem !important;
            }

            .building-list-container .form-control,
            .building-list-container .form-select {
              font-size: 1rem !important;
            }

            .building-list-container .card-title {
              font-size: 1.15rem !important;
            }

            .building-list-container .badge {
              font-size: 0.9rem !important;
            }

            .stat-value {
              font-size: 1.75rem !important;
            }

            .stat-title {
              font-size: 0.95rem !important;
            }
          }

          /* Responsive avec Bootstrap breakpoints */
          @media (max-width: 991.98px) {
            .building-icon {
              width: 36px;
              height: 36px;
              font-size: 16px;
            }

            .bat-icon {
              width: 32px;
              height: 32px;
              font-size: 12px;
            }
          }

          @media (max-width: 767.98px) {
            .building-icon {
              width: 32px;
              height: 32px;
              font-size: 14px;
            }

            .bat-icon {
              width: 28px;
              height: 28px;
              font-size: 11px;
            }

            .table {
              min-width: 800px;
            }
          }

          @media (max-width: 575.98px) {
            .building-icon {
              width: 28px;
              height: 28px;
              font-size: 12px;
            }

            .bat-icon {
              width: 24px;
              height: 24px;
              font-size: 10px;
            }
          }

        `}
      </style>

      {/* Header */}
      <PageHeaderCard
        title={isArabic ? "قائمة المواقع والحظائر" : "Liste des centres et bâtiments"}
        icon={<FaIcon icon="fa-layer-group" />}
      />

      {/* Error Alert */}
      {error && (
        <CAlert color="danger" className="mb-2 mb-md-3" dismissible onClose={() => setError(null)}>
          <div className="d-flex align-items-center">
            <FaIcon icon="fa-exclamation-circle" className="me-2" />
            <span>{error}</span>
          </div>
        </CAlert>
      )}

      {/* Statistics Cards */}
      <div className="row g-2 g-md-3 mb-2 mb-md-3">
        <div className="col-12 col-sm-6 col-lg-4">
          <StatCard
            title={isArabic ? "إجمالي المواقع" : "Total des centres"}
            value={stats.totalMiseplaces.toLocaleString()}
            icon={<FaIcon icon="fa-layer-group" />}
            color="#ef2b1d"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <StatCard
            title={isArabic ? "المواقع النشطة" : "Centres actifs"}
            value={stats.activeMiseplaces.toLocaleString()}
            icon={<FaIcon icon="fa-play-circle" />}
            color="#10b981"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <StatCard
            title={isArabic ? "المواقع المغلقة" : "Centres fermés"}
            value={stats.closedMiseplaces.toLocaleString()}
            icon={<FaIcon icon="fa-check-circle" />}
            color="#6b7280"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterSection
        sites={sites}
        batiments={batiments}
        selectedSite={selectedSite}
        onSiteChange={(e) => setSelectedSite(e.target.value)}
        selectedBatiment={selectedBatiment}
        onBatimentChange={(e) => setSelectedBatiment(e.target.value)}
        selectedStatus={selectedStatus}
        onStatusChange={(e) => setSelectedStatus(e.target.value)}
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        isArabic={isArabic}
      />

      {/* Results Count */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-1 gap-md-2 mb-2 mb-md-3">
        <div className="text-muted small">
          {isArabic 
            ? `عرض ${Math.min(currentItems.length, itemsPerPage)} من ${filteredMiseplaces.length} نتيجة`
            : `Affichage de ${Math.min(currentItems.length, itemsPerPage)} sur ${filteredMiseplaces.length} résultats`
          }
        </div>
        {filteredMiseplaces.length > 0 && (
          <CBadge color="light" className="small">
            {isArabic ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} sur ${totalPages}`}
          </CBadge>
        )}
      </div>

      {/* Table */}
      {filteredMiseplaces.length === 0 ? (
        <EmptyState
          message={isArabic ? "لا توجد نتائج" : "Aucun résultat"}
          subtitle={miseplaces.length === 0 
            ? (isArabic ? "لا توجد مباني أو حضائر مسجلة في النظام" : "Aucun centre ou bâtiment enregistré dans le système")
            : (isArabic ? "لم نتمكن من العثور على أي نتائج تطابق معايير البحث الخاصة بك" : "Aucun résultat ne correspond à vos critères de recherche")
          }
          isArabic={isArabic}
        />
      ) : (
        <CCard className="table-card">
          <CCardBody className="p-0">
            <div className="table-responsive">
              <CTable hover className="mb-0">
                <thead>
                  <tr className="table-header-row">
                    <th className="text-center fw-bold small p-2 p-md-3" style={{ width: '60px' }}>
                      #
                    </th>
                    <th className="fw-bold small p-2 p-md-3">
                      <div className="d-flex align-items-center">
                        <FaIcon icon="fa-map-marker-alt" className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"} text-primary`} />
                        {isArabic ? "الموقع" : "Centre"}
                      </div>
                    </th>
                    <th className="fw-bold small p-2 p-md-3">
                      <div className="d-flex align-items-center">
                        <FaIcon icon="fa-warehouse" className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"} text-warning`} />
                        {isArabic ? "الحظيرة" : "Bâtiment"}
                      </div>
                    </th>
                    <th className="fw-bold small p-2 p-md-3">
                      <div className="d-flex align-items-center">
                        <FaIcon icon="fa-barcode" className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"} text-info`} />
                        {isArabic ? "رقم الحركة" : "N° Mouvement"}
                      </div>
                    </th>
                    <th className="fw-bold small p-2 p-md-3" style={{ minWidth: '160px' }}>
                      <div className="d-flex align-items-center">
                        <FaIcon icon="fa-toggle-on" className={`${isArabic ? "me-1 me-md-2" : "ms-1 ms-md-2"} text-success`} />
                        {isArabic ? "حالة الدورة" : "Statut du lot"}
                      </div>
                    </th>
                    <th className="text-center fw-bold small p-2 p-md-3" style={{ width: '150px' }}>
                      {isArabic ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((miseplace, index) => (
                    <BuildingTableRow
                      key={`${miseplace.numcentre}-${miseplace.numbat}-${miseplace.nummvt}`}
                      miseplace={miseplace}
                      index={(currentPage - 1) * itemsPerPage + index}
                      onRowClick={handleRowClick}
                      isArabic={isArabic}
                    />
                  ))}
                </tbody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-2 mt-md-3" style={{ flexWrap: 'wrap' }}>
          <CPagination className="pagination-responsive">
            <CPaginationItem 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <FaIcon icon="fa-chevron-right" />
            </CPaginationItem>
            
            {[...Array(totalPages)].map((_, index) => (
              <CPaginationItem
                key={index + 1}
                active={currentPage === index + 1}
                onClick={() => setCurrentPage(index + 1)}
                style={{ cursor: 'pointer' }}
                className="pagination-item-responsive"
              >
                {index + 1}
              </CPaginationItem>
            ))}
            
            <CPaginationItem 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <FaIcon icon="fa-chevron-left" />
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  );
};

export default BuildingList;