import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CCard, CCardBody, CRow, CCol, CFormInput, CButton, CAlert, CTable, CSpinner, CPagination, CPaginationItem, CBadge } from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { API_ENDPOINTS } from '../config/api.js';
import { getDatabaseChoice } from '../config/api.js';
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import { cilSave, cilTrash } from '@coreui/icons';
import { PageHeaderCard } from '../components/index.jsx';
import { useTranslation } from 'react-i18next';
import { useTranslationField } from '../hooks/useTranslationField';
import { getTranslatedField } from '../utils/translation';

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);

// Composant QuantityInput avec boutons +/- (identique à SiteSettings)
const QuantityInput = React.memo(({ 
  value, 
  onChange, 
  min = 0, 
  max: _max, // eslint-disable-line no-unused-vars
  disabled = false,
  className = '' 
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

  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div className={`quantity-input-group ${className}`} style={{ display: 'flex', alignItems: 'center', direction: isArabic ? 'rtl' : 'ltr' }} dir={isArabic ? 'rtl' : 'ltr'}>
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
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && getCurrentValue() > safeMin) {
            e.currentTarget.style.background = '#f8fafc';
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
        dir={isArabic ? 'rtl' : 'ltr'}
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
          direction: isArabic ? 'rtl' : 'ltr',
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
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#f8fafc';
          }
        }}
      >
        +
      </button>
    </div>
  );
});

// Composant de sélection de fournisseur avec recherche
const FournisseurSelect = ({ fournisseurs, selectedFournisseur, onSelect, loading, isArabic }) => {
  const { t } = useTranslationField();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFournisseurs = fournisseurs.filter(f => {
    const search = searchTerm.toLowerCase();
    const code = (f.code || f.codeFournisseur || '').toLowerCase();
    const libelle = (t(f, 'libelle') || f.nom || t(f, 'libelleFournisseur') || '').toLowerCase();
    return code.includes(search) || libelle.includes(search);
  });

  const selectedFournisseurData = fournisseurs.find(f => 
    (f.code || f.codeFournisseur) === selectedFournisseur
  );

  return (
    <div className="position-relative" ref={dropdownRef} style={{ width: '100%' }}>
      <CFormInput
        type="text"
        value={selectedFournisseurData ? (t(selectedFournisseurData, 'libelle') || selectedFournisseurData.nom || t(selectedFournisseurData, 'libelleFournisseur') || selectedFournisseurData.code || selectedFournisseurData.codeFournisseur) : ''}
        placeholder={isArabic ? "اختر المورد..." : "Choisir un fournisseur..."}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          cursor: 'pointer',
          background: !selectedFournisseur ? '#fef2f2' : '#ffffff',
          border: !selectedFournisseur ? '2px solid #f87171' : '2px solid #10b981',
          borderRadius: '7px',
          padding: '3px 4px',
          fontSize: '13px',
          height: '34px',
          textAlign: isArabic ? 'right' : 'left',
          fontWeight: '600',
          boxShadow: !selectedFournisseur 
            ? '0 0 0 3px rgba(248, 113, 113, 0.1)' 
            : '0 1px 3px rgba(0, 0, 0, 0.08)',
          opacity: loading ? 0.6 : 1,
          color: '#1e293b',
          direction: isArabic ? 'rtl' : 'ltr',
          width: '100%'
        }}
      />

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#fff',
            border: '2px solid #10b981',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                            <CFormInput
                              type="text"
                              placeholder={isArabic ? "بحث عن مورد..." : "Rechercher un fournisseur..."}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              dir={isArabic ? 'rtl' : 'ltr'}
                              style={{
                                fontSize: '12px',
                                padding: '3px 4px',
                                textAlign: isArabic ? 'right' : 'left',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                direction: isArabic ? 'rtl' : 'ltr'
                              }}
                              autoFocus
                            />
          </div>
          {loading ? (
            <div className="text-center p-3">
              <CSpinner size="sm" />
            </div>
          ) : filteredFournisseurs.length === 0 ? (
            <div className="text-center p-3 text-muted" style={{ fontSize: '12px' }}>
              {isArabic ? 'لا توجد نتائج' : 'Aucun résultat'}
            </div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {filteredFournisseurs.map((fournisseur, index) => {
                const code = fournisseur.code || fournisseur.codeFournisseur || '';
                const libelle = t(fournisseur, 'libelle') || fournisseur.nom || t(fournisseur, 'libelleFournisseur') || code;
                const isSelected = selectedFournisseur === code;

                return (
                  <div
                    key={code || index}
                    onClick={() => {
                      onSelect(code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(231, 101, 88, 0.1)' : '#fff',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s',
                      textAlign: isArabic ? 'right' : 'left',
                      borderLeft: isSelected ? '3px solid rgb(231 101 88)' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <div className="fw-semibold" style={{ fontSize: '13px', color: isSelected ? 'rgb(231 101 88)' : '#1e293b' }}>
                      {libelle}
                    </div>
                    {code && (
                      <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {code}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// StructureList component
const StructureList = ({ items, activeItem, onItemClick, loading, isArabic }) => (
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
        <div className="fw-bold" style={{ fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
          {isArabic ? 'مراكز التكلفة' : 'Centres de coût'}
        </div>
        <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isArabic ? 'اختر مركزاً لعرض تفاصيله' : 'Sélectionnez un centre pour voir ses détails'}
        </small>
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
          <div className="mt-2 text-muted" style={{fontSize: '12px'}}>
            {isArabic ? 'جاري تحميل المراكز...' : 'Chargement des centres...'}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-4 text-muted">
          <FaIcon icon="fa-inbox" className="fs-1 mb-2 opacity-50" />
          <div style={{fontSize: '12px'}}>
            {isArabic ? 'لا توجد مراكز تكلفة متاحة' : 'Aucun centre de coût disponible'}
          </div>
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

const StockEntry = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { t } = useTranslationField();
  
  // États pour les centres et bâtiments
  const [uniqueSiteOptions, setUniqueSiteOptions] = useState([]);
  const [miseplaces, setMiseplaces] = useState([]);
  const [miseplacesError, setMiseplacesError] = useState(null);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBatiment, setSelectedBatiment] = useState('');
  const [selectedMiseplace, setSelectedMiseplace] = useState(null);
  
  // États pour les structures et inventaire
  const [structures, setStructures] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryDepot, setInventoryDepot] = useState({ code: '', label: '' });
  const [selectedStructure, setSelectedStructure] = useState('');
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  
  // États pour les fournisseurs
  const [fournisseurs, setFournisseurs] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  
  // États pour le panier
  const [quantityInputs, setQuantityInputs] = useState({});
  const [entries, setEntries] = useState([]);
  
  // États pour la pagination du DataTable
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [loadingMiseplaces, setLoadingMiseplaces] = useState(false);
  
  // États pour les alertes
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [showAlert, setShowAlert] = useState(false);

  const nomBaseStockSession = getDatabaseChoice();

  // Charger les sites (centres)
  const fetchSites = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
      const response = await api.get(API_ENDPOINTS.batiments, { params: { lotStatus: 'N', codeuser } });
      
      if (response.data.success) {
        const batimentsData = response.data.batiments || response.data.data?.batiments || [];
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
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
      setAlertMessage(isArabic ? 'فشل في تحميل قائمة المواقع' : 'Échec du chargement de la liste des sites');
      setAlertType('danger');
      setShowAlert(true);
    }
  }, []);

  // Charger les bâtiments (miseplaces) pour un centre
  const fetchMiseplaces = useCallback(async (numcentre) => {
    if (!numcentre) {
      setMiseplaces([]);
      setSelectedBatiment('');
      return;
    }

    try {
      setLoadingMiseplaces(true);
      setMiseplacesError(null);
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
      const response = await api.get(`${API_ENDPOINTS.miseplaces}?numcentre=${numcentre}&lotStatus=N&codeuser=${encodeURIComponent(codeuser)}`);
      
      if (response.data.success) {
        const miseplacesData = response.data.miseplaces || response.data.data?.miseplaces || [];
        setMiseplaces(miseplacesData);
        if (miseplacesData.length === 0) {
          setMiseplacesError(isArabic ? 'لا توجد مباني متاحة لهذا الموقع' : 'Aucun bâtiment disponible pour ce site');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bâtiments:', error);
      setMiseplacesError(isArabic ? 'فشل في تحميل قائمة المباني' : 'Échec du chargement de la liste des bâtiments');
      setMiseplaces([]);
    } finally {
      setLoadingMiseplaces(false);
    }
  }, []);

  // Charger les structures
  const fetchStructures = useCallback(async () => {
    try {
      setLoadingStructures(true);
      const response = await api.get(API_ENDPOINTS.structures);
      if (response.data.success) {
        const structuresData = response.data.structures || response.data.data?.structures || [];
        // Filtrer pour exclure "006 production"
        const filteredStructures = structuresData.filter(
          (s) => (s.code || '').toLowerCase() !== '006' && (s.libelle || '').toLowerCase() !== 'production'
        );
        const uniqueStructures = filteredStructures.filter(
          (structure, index, self) => index === self.findIndex((s) => s.code === structure.code)
        );
        setStructures(uniqueStructures);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des structures:', error);
      setAlertMessage(isArabic ? 'فشل في تحميل قائمة الهياكل' : 'Échec du chargement de la liste des structures');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setLoadingStructures(false);
    }
  }, []);

  // Charger les fournisseurs
  const fetchFournisseurs = useCallback(async () => {
    try {
      setLoadingFournisseurs(true);
      const response = await api.get(API_ENDPOINTS.fournisseurs);
      if (response.data.success) {
        const fournisseursData = response.data.fournisseurs || response.data.data?.fournisseurs || [];
        setFournisseurs(fournisseursData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
      setAlertMessage(isArabic ? 'فشل في تحميل قائمة الموردين' : 'Échec du chargement de la liste des fournisseurs');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setLoadingFournisseurs(false);
    }
  }, []);

  // Charger l'inventaire
  const fetchInventory = useCallback(async (structureCode) => {
    if (!selectedMiseplace?.nummvt || !selectedSite || !selectedBatiment || !structureCode) {
      setInventory([]);
      return;
    }

    try {
      setLoadingInventory(true);
      const params = new URLSearchParams();
      params.append('structure', structureCode);
      params.append('nummvt', selectedMiseplace.nummvt);
      params.append('numcentre', selectedSite);
      params.append('numbat', selectedBatiment);
      params.append('nomBaseStockSession', nomBaseStockSession);
      
      const response = await api.get(`${API_ENDPOINTS.inventory}?${params.toString()}`);
      if (response.data.success) {
        const inventoryDataRaw = response.data.inventory || response.data.data?.inventory || [];
        
        const mappedInventory = inventoryDataRaw.map((item) => ({
          ...item,
          codeDep: item.codeDep ?? item.depotCode ?? item.codedep ?? '',
          libDep: item.libDep ?? item.depotLabel ?? item.libdep ?? '',
          depotCode: item.codeDep ?? item.depotCode ?? item.codedep ?? '',
          depotLabel: item.libDep ?? item.depotLabel ?? item.libdep ?? '',
          codeart: item.codeart || item.CodeArt || item.code_article || '',
          libelle: item.libelle || item.Libelle || item.libelle_article || item.libart || item.desart || '',
          desart: item.desart || item.Desart || item.libelle || item.Libelle || '',
          libarabe: item.libarabe || item.Libarabe || '',
          unite: item.unite || item.Unite || item.unite_article || '',
          qteart: item.qteart || item.QteArt || item.Qte || 0
        }));

        setInventory(mappedInventory);
        
        const rawDepotCode = response.data.codeDepBat ?? response.data.data?.codeDepBat ?? mappedInventory[0]?.codeDep ?? '';
        const rawDepotLabel = response.data.libDepBat ?? response.data.data?.libDepBat ?? mappedInventory[0]?.libDep ?? '';
        setInventoryDepot({ 
          code: rawDepotCode ? rawDepotCode.toString().trim() : '', 
          label: rawDepotLabel ? rawDepotLabel.toString().trim() : '' 
        });
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
      setInventory([]);
      setAlertMessage(isArabic ? 'فشل في تحميل قائمة المواد' : 'Échec du chargement de la liste des articles');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setLoadingInventory(false);
    }
  }, [selectedMiseplace, selectedSite, selectedBatiment, nomBaseStockSession]);

  // Initialisation
  useEffect(() => {
    fetchSites();
    fetchStructures();
    fetchFournisseurs();
  }, [fetchSites, fetchStructures, fetchFournisseurs]);

  // Charger les bâtiments quand un site est sélectionné
  useEffect(() => {
    if (selectedSite) {
      fetchMiseplaces(selectedSite);
      setSelectedBatiment('');
      setSelectedMiseplace(null);
      setInventory([]);
      setEntries([]);
    } else {
      setMiseplaces([]);
      setSelectedBatiment('');
      setSelectedMiseplace(null);
    }
  }, [selectedSite, fetchMiseplaces]);

  // Mettre à jour la miseplace sélectionnée quand le bâtiment change
  useEffect(() => {
    if (selectedBatiment && miseplaces.length > 0) {
      const miseplace = miseplaces.find(m => m.numbat === selectedBatiment);
      setSelectedMiseplace(miseplace || null);
      setInventory([]);
      setEntries([]);
      setSelectedStructure('');
    } else {
      setSelectedMiseplace(null);
    }
  }, [selectedBatiment, miseplaces]);

  // Charger l'inventaire quand une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure && selectedMiseplace) {
      fetchInventory(selectedStructure);
      setQuantityInputs({});
      setCurrentPage(1); // Reset à la première page
    } else {
      setInventory([]);
    }
  }, [selectedStructure, selectedMiseplace, fetchInventory]);

  // Fonction de tri
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrer et trier les données
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter((item) => {
      if (!articleSearchTerm) return true;
      const search = articleSearchTerm.toLowerCase();
      const code = (item.codeart || '').toLowerCase();
      const libelle = (item.desart || item.libarabe || item.libelle || '').toLowerCase();
      return code.includes(search) || libelle.includes(search);
    });

    // Tri
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'codeart' || sortConfig.key === 'libelle') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventory, articleSearchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInventory.length / itemsPerPage);
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedInventory, currentPage, itemsPerPage]);

  // Reset page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [articleSearchTerm]);

  // Gestionnaires d'événements
  const handleSiteChange = (e) => {
    setSelectedSite(e.target.value || '');
  };

  const handleBatimentChange = (e) => {
    setSelectedBatiment(e.target.value || '');
  };

  const handleStructureClick = (structureCode) => {
    setSelectedStructure(structureCode);
  };

  const handleQuantityChange = (articleCode, value) => {
    const qte = parseFloat(value) || 0;
    setQuantityInputs(prev => ({
      ...prev,
      [articleCode]: qte >= 0 ? qte : 0
    }));
    
    // Si la quantité est 0 et l'article est dans la liste, le retirer
    if (qte === 0) {
      const entryToRemove = entries.find(e => e.codeart === articleCode);
      if (entryToRemove) {
        handleRemoveEntry(entryToRemove.id);
      }
    }
  };

  const handleAddToEntries = (article) => {
    const qte = quantityInputs[article.codeart] || 0;
    const parsedQte = parseFloat(qte) || 0;
    if (parsedQte <= 0) {
      setAlertMessage(isArabic ? 'يرجى إدخال كمية صحيحة أكبر من الصفر' : 'Veuillez entrer une quantité valide supérieure à zéro');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    const structure = structures.find(s => s.code === selectedStructure);
    // S'assurer que l'unité est toujours présente - vérifier plusieurs propriétés possibles
    const unite = article.unite || article.Unite || article.unite_article || article.unit || 'UN';
    const structureLabel = isArabic 
      ? (structure?.libarabe || structure?.libelle || selectedStructure)
      : (structure?.libelle || structure?.libarabe || selectedStructure);
    const libfam = isArabic
      ? (structure?.libarabe || structure?.libelle || selectedStructure || '')
      : (structure?.libelle || structure?.libarabe || selectedStructure || '');
    const newEntry = {
      id: Date.now() + Math.random(),
      structureCode: selectedStructure,
      structureLabel: structureLabel,
      codeart: article.codeart,
      libelle: article.libelle || '',
      desart: article.desart || article.libelle || '',
      libarabe: article.libarabe || '',
      unite: unite,
      Unite: unite, // Garder aussi la variante avec majuscule
      unite_article: unite, // Garder aussi cette variante
      quantite: parsedQte,
      famille: selectedStructure || '',
      libfam: libfam
    };

    setEntries(prev => [...prev, newEntry]);
    // Garder la quantité dans l'input après l'ajout - ne pas la supprimer
    // La quantité reste dans quantityInputs pour permettre de réajouter facilement
  };

  const handleRemoveEntry = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleSave = async () => {
    if (entries.length === 0) {
      setAlertMessage(isArabic ? 'لا توجد مدخلات لحفظها' : 'Aucune entrée à enregistrer');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    if (!selectedFournisseur) {
      setAlertMessage(isArabic ? 'يرجى اختيار المورد' : 'Veuillez choisir un fournisseur');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }

    if (!selectedMiseplace?.nummvt) {
      setAlertMessage(isArabic ? '❌ تعذّر الحفظ: رقم الحركة (nummvt) مطلوب.' : '❌ Impossible d\'enregistrer : le numéro de mouvement (nummvt) est requis.');
      setAlertType('danger');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeusr = user.codeuser || user.codeUser || user.code || user.id || user.login || '';
      const libusr = user.name || user.nom || user.libelle || user.libelleUser || user.libUser || user.login || '';

      const fournisseur = fournisseurs.find(f => (f.code || f.codeFournisseur) === selectedFournisseur);
      const codetrs = selectedFournisseur || '';
      // libtrs doit être en français - toujours utiliser la version française
      // Vérifier que le champ ne contient pas d'arabe (même mal encodé)
      let libtrs = '';
      if (fournisseur) {
        // Essayer d'obtenir la version française en utilisant getTranslatedField avec 'fr'
        const libelleFr = getTranslatedField(fournisseur, 'libelle', 'fr') || '';
        const libelleFournisseurFr = getTranslatedField(fournisseur, 'libelleFournisseur', 'fr') || '';
        
        // Vérifier si ces champs contiennent de l'arabe valide (Unicode)
        const libelleFrHasArabic = libelleFr && /[\u0600-\u06FF]/.test(libelleFr);
        const libelleFournisseurFrHasArabic = libelleFournisseurFr && /[\u0600-\u06FF]/.test(libelleFournisseurFr);
        
        // Si le champ français contient de l'arabe, utiliser un autre champ ou le code
        if (libelleFr && !libelleFrHasArabic) {
          libtrs = libelleFr;
        } else if (libelleFournisseurFr && !libelleFournisseurFrHasArabic) {
          libtrs = libelleFournisseurFr;
        } else if (fournisseur.nom && !/[\u0600-\u06FF]/.test(fournisseur.nom)) {
          libtrs = fournisseur.nom;
        } else {
          // Fallback vers le code si aucun champ français valide n'est trouvé
          // Utiliser le code du fournisseur comme valeur par défaut
          libtrs = fournisseur.code || fournisseur.codeFournisseur || codetrs || 'Fournisseur';
        }
      } else {
        // Si aucun fournisseur trouvé, utiliser le code comme valeur par défaut
        libtrs = codetrs || 'Fournisseur';
      }
      
      // S'assurer que libtrs n'est jamais vide
      if (!libtrs || libtrs.trim() === '') {
        libtrs = codetrs || 'Fournisseur';
      }
      // Obtenir la version arabe de libtrs
      const libtrsarabe = fournisseur ? (
        getTranslatedField(fournisseur, 'libtrs', 'ar') || 
        getTranslatedField(fournisseur, 'libelleFournisseur', 'ar') || 
        fournisseur.libarabeFournisseur || 
        fournisseur.libarabe || 
        ''
      ) : '';

      const libdep = inventoryDepot.label || selectedMiseplace?.codeDepBat || '';
      const codedep = inventoryDepot.code || selectedMiseplace?.codeDepBat || '';
      const datemaj = new Date().toISOString();

      const panierArticles = entries.map((entry, index) => {
        const article = inventory.find(item => item.codeart === entry.codeart);
        const structure = structures.find(s => s.code === entry.structureCode);
        
        // S'assurer que l'unité est toujours présente
        const unite = entry.unite || article?.unite || article?.Unite || article?.unite_article || 'UN';
        
        // libfam doit être en français - toujours utiliser la version française
        let libfam = getTranslatedField(structure, 'libelle', 'fr') || 
                    structure?.libelle || 
                    entry.libfam || 
                    entry.structureLabel || 
                    '';
        
        // Vérifier si libfam contient de l'arabe valide (Unicode)
        const libfamHasArabic = libfam && /[\u0600-\u06FF]/.test(libfam);
        if (libfamHasArabic) {
          // Si libfam contient de l'arabe, utiliser le code de la structure comme fallback
          libfam = structure?.code || entry.structureCode || entry.famille || '';
        }
        
        // S'assurer que libfam n'est jamais vide
        if (!libfam || libfam.trim() === '') {
          libfam = structure?.code || entry.structureCode || entry.famille || '';
        }
        
        // Obtenir desart en français et libarabe en arabe
        const articleData = article || entry;
        
        // Obtenir la version arabe (libarabe) - toujours utiliser le champ arabe explicite
        const libarabe = getTranslatedField(articleData, 'desart', 'ar') || 
                        articleData.libarabe || 
                        entry.libarabe || 
                        '';
        
        // Pour desart, utiliser la version française
        // Si libarabe existe et contient de l'arabe valide, utiliser libelle pour le français
        // car desart pourrait contenir de l'arabe mal encodé
        const hasValidArabic = libarabe && /[\u0600-\u06FF]/.test(libarabe);
        
        let desart = '';
        if (hasValidArabic) {
          // Si on a de l'arabe valide dans libarabe, utiliser libelle pour le français
          // car desart pourrait être mal encodé
          desart = articleData.libelle || entry.libelle || articleData.desart || entry.desart || '';
        } else {
          // Sinon, utiliser desart ou libelle
          const desartValue = articleData.desart || entry.desart || '';
          // Vérifier si desart contient de l'arabe valide
          const desartContainsArabic = desartValue && /[\u0600-\u06FF]/.test(desartValue);
          if (desartContainsArabic) {
            desart = articleData.libelle || entry.libelle || '';
          } else {
            desart = desartValue || 
                    articleData.libelle || 
                    entry.libelle || 
                    getTranslatedField(articleData, 'desart', 'fr') || 
                    '';
          }
        }
        
        return {
          pniaer: index + 1,
          codeart: entry.codeart || '',
          desart: desart,
          libarabe: libarabe,
          qteart: entry.quantite || 0,
          unite: unite,
          famille: entry.famille || entry.structureCode || structure?.code || '',
          libfam: libfam,
          codetrs: codetrs,
          libtrs: libtrs,
          libtrsarabe: libtrsarabe,
          codedep: codedep,
          libdep: libdep,
          codeusr: codeusr,
          libusr: libusr,
          datemaj: datemaj
        };
      });

      const requestData = {
        nummvt: selectedMiseplace.nummvt,
        NumMvt: selectedMiseplace.nummvt,
        codeDep: codedep,
        numcentre: selectedSite,
        numbat: selectedBatiment,
        numLot: selectedMiseplace?.numlot || '',
        codeFournisseur: selectedFournisseur,
        codeuser: codeusr,
        nomBaseStockSession: nomBaseStockSession,
        panierArticles: panierArticles
      };

      const response = await api.post(API_ENDPOINTS.stockEntry, requestData);
      
      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: isArabic ? 'نجح' : 'Succès',
          text: isArabic ? 'تم حفظ المدخلات بنجاح' : 'Les entrées ont été enregistrées avec succès',
          confirmButtonText: isArabic ? 'حسناً' : 'D\'accord',
          confirmButtonColor: '#10b981',
          buttonsStyling: true,
          customClass: {
            confirmButton: 'swal2-confirm-custom'
          }
        });
        
        setEntries([]);
        setQuantityInputs({});
        setSelectedFournisseur('');
        setInventory([]);
      } else {
        throw new Error(response.data.error || (isArabic ? 'فشل في حفظ البيانات' : 'Échec de l\'enregistrement des données'));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      await Swal.fire({
        icon: 'error',
        title: isArabic ? 'خطأ' : 'Erreur',
        text: error.response?.data?.error || error.message || (isArabic ? 'فشل في حفظ المدخلات' : 'Échec de l\'enregistrement des entrées'),
        confirmButtonText: isArabic ? 'حسناً' : 'D\'accord',
        confirmButtonColor: '#ef4444',
        buttonsStyling: true,
        customClass: {
          confirmButton: 'swal2-confirm-custom'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="optimized-dashboard page-container"
      style={{ direction: isArabic ? 'rtl' : 'ltr', background: 'var(--dashboard-bg)' }}
    >
      <style>
        {`
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
          
          .swal2-confirm,
          .swal2-cancel,
          .swal2-deny {
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
          
          .swal2-error .swal2-confirm {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          }
          
          .swal2-error .swal2-confirm:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4) !important;
          }
          
          .swal2-success .swal2-confirm {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          }
          
          .swal2-success .swal2-confirm:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
          }
          
          .swal2-warning .swal2-confirm {
            background: linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%) !important;
          }
          
          .swal2-warning .swal2-confirm:hover {
            background: linear-gradient(135deg, rgb(200 80 70) 0%, rgb(180 60 50) 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(231, 101, 88, 0.4) !important;
          }
          
          /* Réduction du padding des inputs pour plus de clarté */
          .form-control,
          .form-select,
          input[type="text"],
          input[type="number"],
          select {
            padding: 3px 4px !important;
          }
          
          /* Amélioration des datatables */
          .table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
            width: 100% !important;
          }
          
          .table th {
            padding: 12px 10px !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
            color: #1e293b !important;
            border-bottom: 3px solid #e2e8f0 !important;
            border-top: none !important;
            text-transform: none !important;
            letter-spacing: 0.3px !important;
            white-space: nowrap !important;
          }
          
          .table th:first-child {
            border-top-left-radius: 12px !important;
          }
          
          .table th:last-child {
            border-top-right-radius: 12px !important;
          }
          
          .table td {
            padding: 10px !important;
            font-size: 12px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            vertical-align: middle !important;
          }
          
          .table tbody tr:last-child td:first-child {
            border-bottom-left-radius: 12px !important;
          }
          
          .table tbody tr:last-child td:last-child {
            border-bottom-right-radius: 12px !important;
          }
          
          .table tbody tr:hover {
            background-color: #f8fafc !important;
            transition: background-color 0.2s ease !important;
          }
          
          .table-responsive {
            border-radius: 12px !important;
            overflow: hidden !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          }
          
          /* Amélioration de l'input de quantité */
          .quantity-input-field {
            border: 2px solid #d1d5db !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
          }
          
          .quantity-input-field:focus {
            border-color: rgb(231 101 88) !important;
            box-shadow: 0 0 0 3px rgba(231, 101, 88, 0.1) !important;
            outline: none !important;
          }
          
          .quantity-btn {
            transition: all 0.2s ease !important;
          }
          
          .quantity-btn:hover:not(:disabled) {
            transform: scale(1.1) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
          }
        `}
      </style>
      
      <PageHeaderCard
        title={isArabic ? 'إضافة استقبال المنتوجات' : 'Ajouter une réception de produits'}
        icon={<FaIcon icon="fa-warehouse" />}
      />

      {showAlert && (
        <CAlert
          color={alertType}
          dismissible
          onClose={() => setShowAlert(false)}
          className="mb-4"
          style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
        >
          {alertMessage}
        </CAlert>
      )}

      {/* Sélection Centre et Bâtiment */}
      <CCard className="mb-4" style={{ 
              background: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease'
            }}>
              <CCardBody style={{ padding: '24px' }}>
                <div className="row g-3 align-items-end">
                  {/* Centre et Bâtiment - Moitié gauche */}
                  <div className="col-md-6 col-12">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="mb-2">
                          <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                            <label className="form-label fw-bold mb-0 text-nowrap d-flex align-items-center" style={{ 
                              fontSize: '13px', 
                              color: '#1f2937',
                              minWidth: '70px',
                              gap: '5px'
                            }}>
                              <FaIcon icon="fa-map-marker-alt" style={{ color: '#3b82f6', fontSize: '14px' }} />
                              <span>{isArabic ? 'الموقع' : 'Site'}</span>
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select flex-grow-1"
                              value={selectedSite}
                              onChange={handleSiteChange}
                              dir={isArabic ? 'rtl' : 'ltr'}
                              style={{
                                padding: '3px 4px',
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
                                cursor: 'pointer',
                                direction: isArabic ? 'rtl' : 'ltr'
                              }}
                            >
                              <option value="" style={{ color: '#94a3b8' }}>
                                {isArabic ? '⚠️ يرجى اختيار الموقع...' : '⚠️ Veuillez choisir le site...'}
                              </option>
                              {uniqueSiteOptions.map((site, index) => (
                                <option key={site.numcentre || `site-${index}`} value={site.numcentre || site.libellecentre}>
                                  📍 {site.batiment ? t(site.batiment, 'libelleCentre') : t(site, 'libellecentre')}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        {miseplacesError ? (
                          <div className="alert alert-warning p-2 mb-0" style={{ fontSize: '11px' }}>
                            <FaIcon icon="fa-info-circle" className={isArabic ? "me-2" : "ms-2"} />
                            {miseplacesError}
                          </div>
                        ) : (
                          <div className="mb-2">
                            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                              <label className="form-label fw-bold mb-0 text-nowrap d-flex align-items-center" style={{ 
                                fontSize: '13px', 
                                color: '#1f2937',
                                minWidth: '70px',
                                gap: '4px'
                              }}>
                                <FaIcon icon="fa-warehouse" style={{ color: '#f59e0b', fontSize: '14px' }} />
                                <span>{isArabic ? 'الحظيرة' : 'Bâtiment'}</span>
                                <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select flex-grow-1"
                                value={selectedBatiment}
                                onChange={handleBatimentChange}
                                disabled={miseplaces.length === 0 || loadingMiseplaces}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                style={{
                                  padding: '3px 4px',
                                  border: !selectedBatiment ? '2px solid #f87171' : '2px solid #10b981',
                                  borderRadius: '7px',
                                  background: !selectedBatiment ? '#fef2f2' : '#ffffff',
                                  fontSize: '13px',
                                  height: '38px',
                                  textAlign: isArabic ? 'right' : 'left',
                                  fontWeight: '600',
                                  boxShadow: !selectedBatiment 
                                    ? '0 0 0 3px rgba(248, 113, 113, 0.1)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.08)',
                                  cursor: miseplaces.length === 0 ? 'not-allowed' : 'pointer',
                                  opacity: miseplaces.length === 0 ? 0.6 : 1,
                                  color: '#1e293b',
                                  direction: isArabic ? 'rtl' : 'ltr'
                                }}
                              >
                                <option value="" style={{ color: '#94a3b8' }}>
                                  {loadingMiseplaces
                                    ? isArabic
                                      ? 'جاري التحميل...'
                                      : 'Chargement...'
                                    : isArabic
                                      ? '⚠️ اختر الحظيرة...'
                                      : '⚠️ Choisir le bâtiment...'}
                                </option>
                                {miseplaces.map((miseplace, index) => (
                                  <option key={miseplace.numbat || `${miseplace.numcentre}-${index}`} value={miseplace.numbat || miseplace.libbat}>
                                    🏢 {t(miseplace, 'libbat')}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fournisseur - Moitié droite */}
                  <div className="col-md-6 col-12">
                    <div className="mb-2">
                      <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                        <label className="form-label fw-bold mb-0 text-nowrap d-flex align-items-center" style={{ 
                          fontSize: '13px', 
                          color: '#1f2937',
                          minWidth: '70px',
                          gap: '5px'
                        }}>
                          <FaIcon icon="fa-truck" style={{ color: '#8b5cf6', fontSize: '14px' }} />
                          <span>{isArabic ? 'المورد' : 'Fournisseur'}</span>
                          <span className="text-danger">*</span>
                        </label>
                        <div style={{ flex: 1 }}>
                          <FournisseurSelect
                            fournisseurs={fournisseurs}
                            selectedFournisseur={selectedFournisseur}
                            onSelect={setSelectedFournisseur}
                            loading={loadingFournisseurs}
                            isArabic={isArabic}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CCardBody>
            </CCard>

        {/* Structures et Articles - Toujours visible */}
        <CRow className="g-4 mb-4">
          <CCol lg={4} md={12}>
            <StructureList 
              items={structures} 
              activeItem={selectedStructure} 
              onItemClick={handleStructureClick} 
              loading={loadingStructures}
              isArabic={isArabic}
            />
          </CCol>

          <CCol lg={8} md={12}>
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
                    [isArabic ? 'marginLeft' : 'marginRight']: '12px'
                  }}></div>
                  <div>
                    <div className="fw-bold d-flex align-items-center" style={{ 
                      fontSize: '16px', 
                      color: '#1e293b',
                      fontWeight: '700'
                    }}>
                      <FaIcon icon="fa-clipboard-check" className="me-2" style={{ color: 'rgb(231 101 88)', fontSize: '18px' }} />
                      {isArabic ? 'جرد المخزون' : 'Inventaire du stock'}
                    </div>
                    <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      {isArabic ? 'إدارة المخزون والمواد المستهلكة' : 'Gestion des stocks et des consommables'}
                    </small>
                  </div>
                </div>

                {!selectedSite || !selectedBatiment || !selectedMiseplace ? (
                  <div className="text-center p-4 text-muted d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <FaIcon icon="fa-exclamation-circle" className="mb-2" style={{ fontSize: '48px', color: '#f59e0b' }} />
                    <div className="fw-bold mb-2" style={{fontSize: '14px', color: '#1e293b'}}>
                          {isArabic ? 'يرجى اختيار الموقع والحظيرة أولاً' : 'Veuillez d\'abord choisir le site et le bâtiment'}
                    </div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>
                          {isArabic ? 'يجب اختيار موقع وحظيرة لعرض المواد' : 'Un site et un bâtiment sont requis pour afficher les articles'}
                    </div>
                  </div>
                ) : loadingInventory ? (
                  <div className="text-center p-4">
                    <CSpinner size="sm" />
                        <div className="mt-2 text-muted" style={{ fontSize: '12px' }}>
                          {isArabic ? 'جاري تحميل المواد...' : 'Chargement des articles...'}
                        </div>
                  </div>
                ) : !selectedStructure ? (
                  <div className="text-center p-4 text-muted d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <FaIcon icon="fa-sitemap" className="mb-2 opacity-50" style={{ fontSize: '32px' }} />
                        <div className="fw-bold" style={{fontSize: '12px'}}>
                          {isArabic ? 'يرجى اختيار مركز تكلفة لعرض المواد' : 'Veuillez choisir un centre de coût pour afficher les articles'}
                        </div>
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="text-center p-4 text-muted d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <FaIcon icon="fa-box-open" className="mb-2 opacity-50" style={{ fontSize: '32px' }} />
                        <div className="fw-bold" style={{fontSize: '12px'}}>
                          {isArabic ? 'لا توجد عناصر في المخزون' : 'Aucun article en stock'}
                        </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Barre de recherche pour les articles */}
                    <div className="mb-3" style={{ padding: '0 4px' }}>
                      <CFormInput
                        type="text"
                        placeholder={
                          isArabic
                            ? 'بحث عن منتوج (كود أو اسم)...'
                            : 'Rechercher un produit (code ou nom)...'
                        }
                        value={articleSearchTerm}
                        onChange={(e) => setArticleSearchTerm(e.target.value)}
                        dir={isArabic ? 'rtl' : 'ltr'}
                        style={{
                          fontSize: '13px',
                          padding: '3px 4px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '10px',
                          textAlign: isArabic ? 'right' : 'left',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          direction: isArabic ? 'rtl' : 'ltr',
                          width: '100%'
                        }}
                      />
                    </div>

                    <div className="table-responsive" style={{ 
                      borderRadius: '12px',
                      overflow: 'auto',
                      border: '1px solid #f1f5f9',
                      direction: isArabic ? 'rtl' : 'ltr',
                      maxHeight: '600px',
                      minHeight: '400px'
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
                                padding: '10px 8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontWeight: '700', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('codeart')}
                            >
                              <div className={`d-flex align-items-center ${isArabic ? 'justify-content-end' : 'justify-content-start'}`}>
                                <FaIcon icon="fa-barcode" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? 'كود المنتوج' : 'Code produit'}
                                {sortConfig.key === 'codeart' && (
                                  <FaIcon 
                                    icon={sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} 
                                    className="ms-2" 
                                    style={{ fontSize: '10px', color: 'rgb(231 101 88)' }} 
                                  />
                                )}
                              </div>
                            </th>
                            <th 
                              style={{ 
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                                padding: '10px 8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontWeight: '700', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                fontSize: '12px',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('libelle')}
                            >
                              <div className={`d-flex align-items-center ${isArabic ? 'justify-content-end' : 'justify-content-start'}`}>
                                <FaIcon icon="fa-box" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                                {isArabic ? 'إسم المنتوج' : 'Désignation'}
                                {sortConfig.key === 'libelle' && (
                                  <FaIcon 
                                    icon={sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} 
                                    className="ms-2" 
                                    style={{ fontSize: '10px', color: 'rgb(231 101 88)' }} 
                                  />
                                )}
                              </div>
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '12px' 
                            }}>
                              <FaIcon icon="fa-hashtag" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'الكمية' : 'Quantité'}
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '12px' 
                            }}>
                              <FaIcon icon="fa-cog" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'الإجراءات' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInventory.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                <FaIcon icon="fa-inbox" className="mb-2" style={{ fontSize: '32px', opacity: 0.5 }} />
                                <div style={{ fontSize: '13px' }}>
                                  {isArabic ? 'لا توجد نتائج' : 'Aucun résultat'}
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedInventory.map((item, index) => {
                          const userQuantity = quantityInputs[item.codeart] || 0;
                          const existingEntry = entries.find(e => e.codeart === item.codeart);
                          const isInList = !!existingEntry;
                          const addedQuantity = existingEntry?.quantite || 0;

                          return (
                            <tr 
                              key={item.codeart} 
                              style={{ 
                                borderBottom: index < paginatedInventory.length - 1 ? '1px solid #f1f5f9' : 'none',
                                transition: 'all 0.2s ease',
                                background: isInList ? 'linear-gradient(90deg, rgba(231, 101, 88, 0.08) 0%, rgba(231, 101, 88, 0.03) 100%)' : '#ffffff',
                                borderLeft: isInList ? '4px solid rgb(231 101 88)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isInList 
                                  ? 'linear-gradient(90deg, rgba(231, 101, 88, 0.12) 0%, rgba(231, 101, 88, 0.05) 100%)'
                                  : '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isInList 
                                  ? 'linear-gradient(90deg, rgba(231, 101, 88, 0.08) 0%, rgba(231, 101, 88, 0.03) 100%)'
                                  : '#ffffff';
                              }}
                            >
                              <td style={{ 
                                padding: '8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontSize: '12px', 
                                color: 'rgb(231 101 88)', 
                                fontWeight: '700',
                                fontFamily: 'monospace'
                              }}>
                                {item.codeart}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontSize: '12px', 
                                color: '#1e293b',
                                fontWeight: '500'
                              }}>
                                {isArabic ? (item.libarabe || '') : (item.desart || '')}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontSize: '12px' 
                              }}>
                                <QuantityInput
                                  value={userQuantity || 0}
                                  onChange={(newQuantity) => handleQuantityChange(item.codeart, newQuantity)}
                                  min={0}
                                />
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: isArabic ? 'right' : 'left', 
                                fontSize: '12px' 
                              }}>
                                {isInList ? (
                                  <div className={`d-flex align-items-center ${isArabic ? 'justify-content-end' : 'justify-content-start'} gap-2`}>
                                    <CBadge color="success" style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                      <FaIcon icon="fa-check-circle" className="me-1" />
                                      مضاف للقائمة
                                    </CBadge>
                                    <CButton
                                      color="danger"
                                      size="sm"
                                      onClick={() => {
                                        if (existingEntry) {
                                          handleRemoveEntry(existingEntry.id);
                                          handleQuantityChange(item.codeart, 0);
                                        }
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        borderRadius: '6px',
                                        minWidth: 'auto',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      <FaIcon icon="fa-minus" />
                                    </CButton>
                                  </div>
                                ) : (
                                  <CButton
                                    color="primary"
                                    size="sm"
                                    onClick={() => handleAddToEntries(item)}
                                    disabled={!userQuantity || parseFloat(userQuantity || 0) <= 0}
                                    style={{
                                      padding: '6px 14px',
                                      fontSize: '11px',
                                      borderRadius: '8px',
                                      fontWeight: '600',
                                      background: userQuantity && parseFloat(userQuantity) > 0
                                        ? 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)'
                                        : undefined,
                                      border: 'none',
                                      boxShadow: userQuantity && parseFloat(userQuantity) > 0
                                        ? '0 2px 8px rgba(231, 101, 88, 0.3)'
                                        : undefined,
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 101, 88, 0.4)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 101, 88, 0.3)';
                                      }
                                    }}
                                  >
                                    <FaIcon icon="fa-cart-plus" className={isArabic ? "me-1" : "ms-1"} />
                                    {isArabic ? 'إضافة' : 'Ajouter'}
                                  </CButton>
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
                      <div
                        className="d-flex justify-content-between align-items-center mt-3"
                        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {isArabic ? 'عدد العناصر في الصفحة:' : 'Éléments par page :'}
                          </span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            dir={isArabic ? 'rtl' : 'ltr'}
                            style={{
                              padding: '3px 4px',
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
                            {isArabic
                              ? `عرض ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(
                                  currentPage * itemsPerPage,
                                  filteredAndSortedInventory.length,
                                )} من ${filteredAndSortedInventory.length}`
                              : `Affichage ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(
                                  currentPage * itemsPerPage,
                                  filteredAndSortedInventory.length,
                                )} sur ${filteredAndSortedInventory.length}`}
                          </span>
                          <CPagination aria-label="Page navigation">
                            <CPaginationItem
                              disabled={currentPage === 1}
                              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                              style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <FaIcon icon={isArabic ? "fa-chevron-left" : "fa-chevron-right"} />
                            </CPaginationItem>
                            {[...Array(totalPages)].map((_, i) => {
                              const page = i + 1;
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <CPaginationItem
                                    key={page}
                                    active={currentPage === page}
                                    onClick={() => setCurrentPage(page)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {page}
                                  </CPaginationItem>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <CPaginationItem key={page} disabled>...</CPaginationItem>;
                              }
                              return null;
                            })}
                            <CPaginationItem
                              disabled={currentPage === totalPages}
                              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                              style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                              <FaIcon icon={isArabic ? "fa-chevron-right" : "fa-chevron-left"} />
                            </CPaginationItem>
                          </CPagination>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Liste des entrées ajoutées */}
        {entries.length > 0 && (
          <CCard style={{ 
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            background: '#ffffff',
            marginBottom: '24px'
          }}>
            <CCardBody style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <div style={{ 
                    width: '4px', 
                    height: '32px', 
                    background: 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)',
                    borderRadius: '2px',
                    [isArabic ? 'marginLeft' : 'marginRight']: '12px'
                  }}></div>
                  <div>
                    <h5 className="mb-0" style={{ 
                      color: '#1e293b',
                      fontWeight: '700',
                      fontSize: '20px'
                    }}>
                      <FaIcon icon="fa-shopping-cart" className={isArabic ? "me-2" : "ms-2"} style={{ color: 'rgb(231 101 88)' }} />
                      {isArabic ? 'قائمة المدخلات' : 'Liste des entrées'}
                    </h5>
                    <small style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      {entries.length}{' '}
                      {isArabic
                        ? entries.length === 1
                          ? 'مادة'
                          : 'مواد'
                        : entries.length === 1
                          ? 'article'
                          : 'articles'}{' '}
                      {isArabic ? 'في السلة' : 'dans le panier'}
                    </small>
                  </div>
                </div>
              </div>

                  <div style={{ 
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9',
                    direction: isArabic ? 'rtl' : 'ltr'
                  }}>
                    <div className="table-responsive" style={{ 
                      borderRadius: '12px',
                      overflow: 'hidden',
                      direction: isArabic ? 'rtl' : 'ltr'
                    }}>
                      <table
                        className="table mb-0"
                        dir={isArabic ? 'rtl' : 'ltr'}
                        style={{
                          width: '100%',
                          borderCollapse: 'separate',
                          borderSpacing: '0',
                          fontSize: '13px',
                          direction: isArabic ? 'rtl' : 'ltr',
                          textAlign: isArabic ? 'right' : 'left'
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '13px'
                            }}>
                              <FaIcon icon="fa-barcode" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'كود المنتوج' : 'Code produit'}
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '13px'
                            }}>
                              <FaIcon icon="fa-box" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'إسم المنتوج' : 'Nom du produit'}
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '13px'
                            }}>
                              <FaIcon icon="fa-hashtag" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'الكمية' : 'Quantité'}
                            </th>
                            <th style={{ 
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                              padding: '10px 8px', 
                              textAlign: isArabic ? 'right' : 'left', 
                              fontWeight: '700', 
                              color: '#1e293b', 
                              borderBottom: '2px solid #e2e8f0', 
                              fontSize: '13px'
                            }}>
                              <FaIcon icon="fa-cog" className="me-2" style={{ color: 'rgb(231 101 88)' }} />
                              {isArabic ? 'الإجراءات' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry, index) => (
                            <tr 
                              key={entry.id}
                              style={{
                                borderBottom: index < entries.length - 1 ? '1px solid #f1f5f9' : 'none',
                                transition: 'all 0.2s ease',
                                background: 'linear-gradient(90deg, rgba(231, 101, 88, 0.06) 0%, rgba(231, 101, 88, 0.02) 100%)',
                                borderLeft: '4px solid rgb(231 101 88)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(231, 101, 88, 0.12) 0%, rgba(231, 101, 88, 0.05) 100%)';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 101, 88, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(231, 101, 88, 0.06) 0%, rgba(231, 101, 88, 0.02) 100%)';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <td style={{ 
                                padding: '8px',
                                textAlign: isArabic ? 'right' : 'left',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                color: 'rgb(231 101 88)',
                                fontWeight: '700'
                              }}>
                                {entry.codeart}
                              </td>
                              <td style={{ 
                                padding: '8px',
                                textAlign: isArabic ? 'right' : 'left',
                                fontSize: '13px',
                                color: '#1e293b',
                                fontWeight: '500'
                              }}>
                                {isArabic ? (entry.libarabe || '') : (entry.desart || '')}
                              </td>
                              <td style={{ 
                                padding: '8px',
                                textAlign: isArabic ? 'right' : 'left',
                                fontSize: '15px',
                                color: 'rgb(231 101 88)',
                                fontWeight: '700'
                              }}>
                                <CBadge 
                                  style={{ 
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    boxShadow: '0 2px 6px rgba(231, 101, 88, 0.3)'
                                  }}
                                >
                                  {entry.quantite.toLocaleString()}
                                </CBadge>
                              </td>
                              <td style={{ 
                                padding: '8px',
                                textAlign: isArabic ? 'right' : 'left',
                                fontSize: '13px'
                              }}>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveEntry(entry.id)}
                                  style={{
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontWeight: '600',
                                    border: '2px solid #ef4444',
                                    color: '#ef4444',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ef4444';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            )}

        {/* Bouton de sauvegarde */}
        <div 
          className="d-flex justify-content-center mt-5 mb-4"
          style={{
            padding: '20px 0',
            marginTop: '40px',
            marginBottom: '20px'
          }}
        >
          <CButton
            color="success"
            onClick={handleSave}
            disabled={loading || entries.length === 0 || !selectedFournisseur || !selectedMiseplace}
            size="lg"
            style={{
              borderRadius: '14px',
              padding: '16px 48px',
              fontWeight: '700',
              fontSize: '17px',
              minWidth: '260px',
              background: entries.length > 0 && selectedFournisseur && selectedMiseplace
                ? 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)'
                : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
              border: 'none',
              boxShadow: entries.length > 0 && selectedFournisseur && selectedMiseplace
                ? '0 6px 20px rgba(231, 101, 88, 0.4)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              cursor: entries.length > 0 && selectedFournisseur && selectedMiseplace ? 'pointer' : 'not-allowed',
              opacity: entries.length > 0 && selectedFournisseur && selectedMiseplace ? 1 : 0.65
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(231, 101, 88, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(231, 101, 88, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {isArabic ? 'جاري الحفظ...' : 'Enregistrement en cours...'}
              </>
            ) : (
              <>
                <CIcon icon={cilSave} className="me-2" style={{ fontSize: '20px' }} />
                {isArabic
                  ? entries.length > 0
                    ? `حفظ المدخلات (${entries.length})`
                    : 'حفظ المدخلات'
                  : entries.length > 0
                    ? `Enregistrer les entrées (${entries.length})`
                    : 'Enregistrer les entrées'}
              </>
            )}
          </CButton>
        </div>
    </div>
  );
};

export default StockEntry;
