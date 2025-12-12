import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CCard, 
  CCardBody, 
  CTable, 
  CButton, 
  CSpinner, 
  CBadge,
  CFormSelect,
  CFormInput,
  CPagination,
  CPaginationItem,
  CAlert
} from '@coreui/react';
import api from '../services/api.js';
import { API_ENDPOINTS } from '../config/api.js';
import { getDatabaseChoice } from '../config/api.js';
import CIcon from '@coreui/icons-react';
import { cilMagnifyingGlass } from '@coreui/icons';
import { PageHeaderCard } from '../components/index.jsx';
import { useTranslation } from 'react-i18next';
import { useTranslationField } from '../hooks/useTranslationField';

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);

const BonEntreeConsultation = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { t } = useTranslationField();
  // États pour les filtres
  const [uniqueSiteOptions, setUniqueSiteOptions] = useState([]);
  const [miseplaces, setMiseplaces] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBatiment, setSelectedBatiment] = useState('');
  const [selectedMiseplace, setSelectedMiseplace] = useState(null);
  const [selectedNummvt, setSelectedNummvt] = useState('');
  
  // États pour la liste EBE
  const [ebeList, setEbeList] = useState([]);
  const [loadingEbe, setLoadingEbe] = useState(false);
  const [ebeError, setEbeError] = useState(null);
  
  // États pour les détails LPE (lignes)
  const [selectedEbe, setSelectedEbe] = useState(null);
  const [lpeDetails, setLpeDetails] = useState([]);
  const [loadingLpe, setLoadingLpe] = useState(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || '';
      const response = await api.get(`${API_ENDPOINTS.miseplaces}?numcentre=${numcentre}&lotStatus=N&codeuser=${encodeURIComponent(codeuser)}`);
      
      if (response.data.success) {
        const miseplacesData = response.data.miseplaces || response.data.data?.miseplaces || [];
        setMiseplaces(miseplacesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bâtiments:', error);
      setMiseplaces([]);
    }
  }, []);

  // Charger la liste EBE (une seule API avec numcentre, numbat, numlot)
  const fetchEbeList = useCallback(async () => {
    if (!selectedSite || !selectedBatiment || !selectedNummvt) {
      setEbeList([]);
      return;
    }

    try {
      setLoadingEbe(true);
      setEbeError(null);
      
      // Récupérer le code de l'utilisateur connecté
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || user.login || '';
      
      const params = new URLSearchParams();
      params.append('numcentre', selectedSite);
      params.append('numbat', selectedBatiment);
      params.append('numlot', selectedNummvt);
      params.append('nomBaseStockSession', nomBaseStockSession);
      if (codeuser) {
        params.append('codeuser', codeuser);
      }
      
      // Utiliser l'unique endpoint liste-stock-entry avec numcentre, numbat, numlot
      const response = await api.get(`${API_ENDPOINTS.listeStockEntry}?${params.toString()}`);
      
      if (response.data.success) {
        const ebeData = response.data.data || response.data.entries || response.data.ebe || [];
        setEbeList(Array.isArray(ebeData) ? ebeData : []);
      } else {
        setEbeList([]);
        setEbeError(isArabic ? 'لا توجد بيانات متاحة' : 'Aucune donnée disponible');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la liste EBE:', error);
      setEbeError(isArabic ? 'فشل في تحميل قائمة سندات الاستقبال' : 'Échec du chargement de la liste des bons d\'entrée');
      setEbeList([]);
    } finally {
      setLoadingEbe(false);
    }
  }, [selectedSite, selectedBatiment, selectedNummvt, nomBaseStockSession]);

  // Charger les détails LPE pour un EBE (API dédiée basée sur LBE)
  const fetchLpeDetails = useCallback(async (nummvt) => {
    if (!nummvt) {
      setLpeDetails([]);
      return;
    }

    try {
      setLoadingLpe(true);
      
      // Récupérer le code de l'utilisateur connecté
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const codeuser = user.codeuser || user.codeUser || user.code || user.id || user.login || '';
      
      const params = new URLSearchParams();
      // Backend: API dédiée pour les détails, basée sur le nummvt (numlot)
      params.append('nummvt', nummvt);
      params.append('nomBaseStockSession', nomBaseStockSession);
      if (codeuser) {
        params.append('codeuser', codeuser);
      }
      
      // Utiliser une API distincte pour les détails (GET /api/detail-stock-entry/{nummvt})
      const response = await api.get(`${API_ENDPOINTS.detailStockEntry}/${encodeURIComponent(nummvt)}?${params.toString()}`);
      
      if (response.data.success) {
        const root = response.data;
        const dataNode = root.data;

        // Supporte plusieurs formats possibles de la réponse backend
        let lpeData = [];

        if (Array.isArray(dataNode)) {
          // data est déjà un tableau de lignes
          lpeData = dataNode;
        } else if (dataNode) {
          lpeData =
            dataNode.panierArticles ||
            dataNode.articles ||
            dataNode.lpe ||
            [];
        } else if (Array.isArray(root.lpe)) {
          lpeData = root.lpe;
        } else if (Array.isArray(root.articles)) {
          lpeData = root.articles;
        }

        setLpeDetails(Array.isArray(lpeData) ? lpeData : []);
      } else {
        setLpeDetails([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails LPE:', error);
      setLpeDetails([]);
    } finally {
      setLoadingLpe(false);
    }
  }, [nomBaseStockSession]);

  // Initialisation
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Charger les bâtiments quand un site est sélectionné
  useEffect(() => {
    if (selectedSite) {
      fetchMiseplaces(selectedSite);
      setSelectedBatiment('');
      setSelectedMiseplace(null);
      setSelectedNummvt('');
      setEbeList([]);
    } else {
      setMiseplaces([]);
      setSelectedBatiment('');
      setSelectedMiseplace(null);
      setSelectedNummvt('');
    }
  }, [selectedSite, fetchMiseplaces]);

  // Mettre à jour la miseplace sélectionnée et le nummvt quand le bâtiment change
  useEffect(() => {
    if (selectedBatiment && miseplaces.length > 0) {
      const miseplace = miseplaces.find(m => m.numbat === selectedBatiment);
      setSelectedMiseplace(miseplace || null);
      if (miseplace?.nummvt) {
        setSelectedNummvt(miseplace.nummvt);
      } else {
        setSelectedNummvt('');
      }
      setEbeList([]);
    } else {
      setSelectedMiseplace(null);
      setSelectedNummvt('');
    }
  }, [selectedBatiment, miseplaces]);

  // Charger la liste EBE quand nummvt change
  useEffect(() => {
    if (selectedNummvt) {
      fetchEbeList();
      setCurrentPage(1);
    } else {
      setEbeList([]);
    }
  }, [selectedNummvt, fetchEbeList]);

  // Gestionnaires d'événements
  const handleSiteChange = (e) => {
    setSelectedSite(e.target.value || '');
  };

  const handleBatimentChange = (e) => {
    setSelectedBatiment(e.target.value || '');
  };

  const handleNummvtChange = (e) => {
    setSelectedNummvt(e.target.value || '');
  };

  const handleViewLpe = async (ebe) => {
    // Toggle si on reclique sur la même ligne
    const currentNum = selectedEbe?.nummvt || selectedEbe?.numMvt || selectedEbe?.id;
    const newNum = ebe.nummvt || ebe.numMvt || ebe.id;

    if (currentNum && newNum && currentNum === newNum) {
      setSelectedEbe(null);
      setLpeDetails([]);
      return;
    }

    setSelectedEbe(ebe);
    if (newNum) {
      await fetchLpeDetails(newNum);
    }
  };

  // Pagination
  const totalPages = Math.ceil(ebeList.length / itemsPerPage);
  const paginatedEbeList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return ebeList.slice(startIndex, startIndex + itemsPerPage);
  }, [ebeList, currentPage, itemsPerPage]);

  return (
    <div
      className="optimized-dashboard page-container"
      style={{ direction: isArabic ? 'rtl' : 'ltr', background: 'var(--dashboard-bg)' }}
    >
      <PageHeaderCard
        title={isArabic ? 'قائمة استقبال المنتوجات' : 'Liste des Réceptions'}
        icon={<FaIcon icon="fa-file-invoice" />}
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

      {/* Filtres */}
      <CCard className="mb-4" style={{ 
        background: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
      }}>
        <CCardBody style={{ padding: '24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4 col-12">
              <label className="form-label fw-bold mb-2 d-flex align-items-center" style={{ 
                fontSize: '13px', 
                color: '#1f2937',
                gap: '5px'
              }}>
                <FaIcon icon="fa-map-marker-alt" style={{ color: '#3b82f6', fontSize: '14px' }} />
                <span>{isArabic ? 'المركز' : 'Centre'}</span>
                <span className="text-danger">*</span>
              </label>
              <CFormSelect
                value={selectedSite}
                onChange={handleSiteChange}
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  padding: '7px 12px',
                  border: !selectedSite ? '2px solid #f87171' : '2px solid #10b981',
                  borderRadius: '8px',
                  background: !selectedSite ? '#fef2f2' : '#ffffff',
                  fontSize: '13px',
                  height: '38px',
                  textAlign: isArabic ? 'right' : 'left',
                  fontWeight: '600',
                  direction: isArabic ? 'rtl' : 'ltr'
                }}
              >
                <option value="">
                  {isArabic ? '⚠️ اختر المركز...' : '⚠️ Choisir le centre...'}
                </option>
                {uniqueSiteOptions.map((site, index) => (
                  <option key={site.numcentre || `site-${index}`} value={site.numcentre || site.libellecentre}>
                    📍 {site.batiment ? t(site.batiment, 'libelleCentre') : t(site, 'libellecentre')}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="col-md-4 col-12">
              <label className="form-label fw-bold mb-2 d-flex align-items-center" style={{ 
                fontSize: '13px', 
                color: '#1f2937',
                gap: '4px'
              }}>
                <FaIcon icon="fa-warehouse" style={{ color: '#f59e0b', fontSize: '14px' }} />
                <span>{isArabic ? 'الحظيرة' : 'Bâtiment'}</span>
                <span className="text-danger">*</span>
              </label>
              <CFormSelect
                value={selectedBatiment}
                onChange={handleBatimentChange}
                disabled={miseplaces.length === 0}
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  padding: '6px 10px',
                  border: !selectedBatiment ? '2px solid #f87171' : '2px solid #10b981',
                  borderRadius: '7px',
                  background: !selectedBatiment ? '#fef2f2' : '#ffffff',
                  fontSize: '13px',
                  height: '38px',
                  textAlign: isArabic ? 'right' : 'left',
                  fontWeight: '600',
                  direction: isArabic ? 'rtl' : 'ltr'
                }}
              >
                <option value="">
                  {miseplaces.length === 0
                    ? isArabic
                      ? '⚠️ اختر المركز أولاً...'
                      : '⚠️ Choisir d\'abord le centre...'
                    : isArabic
                      ? '⚠️ اختر الحظيرة...'
                      : '⚠️ Choisir le bâtiment...'}
                </option>
                {miseplaces.map((miseplace, index) => (
                  <option key={miseplace.numbat || `${miseplace.numcentre}-${index}`} value={miseplace.numbat || miseplace.libbat}>
                    🏢 {t(miseplace, 'libbat')}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="col-md-4 col-12">
              <label className="form-label fw-bold mb-2 d-flex align-items-center" style={{ 
                fontSize: '13px', 
                color: '#1f2937',
                gap: '4px'
              }}>
                <FaIcon icon="fa-hashtag" style={{ color: '#8b5cf6', fontSize: '14px' }} />
                <span>{isArabic ? 'رقم الحركة' : 'Numéro de mouvement'}</span>
              </label>
              <CFormInput
                type="text"
                value={selectedNummvt}
                onChange={handleNummvtChange}
                readOnly
                dir={isArabic ? 'rtl' : 'ltr'}
                style={{
                  padding: '6px 10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '7px',
                  background: '#f8fafc',
                  fontSize: '13px',
                  height: '38px',
                  textAlign: isArabic ? 'right' : 'left',
                  fontWeight: '600',
                  direction: isArabic ? 'rtl' : 'ltr',
                  cursor: 'default'
                }}
              />
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Liste EBE */}
      <CCard style={{
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
      }}>
        <CCardBody style={{ padding: '20px' }}>
          <div className="d-flex align-items-center mb-3" style={{ 
            borderBottom: '2px solid #f1f5f9', 
            paddingBottom: '12px'
          }}>
            <div style={{ 
              width: '4px', 
              height: '24px', 
              background: 'linear-gradient(135deg, rgb(231 101 88) 0%, rgb(200 80 70) 100%)',
              borderRadius: '2px',
              marginLeft: '12px'
            }}></div>
            <div>
              <div className="fw-bold d-flex align-items-center" style={{ 
                fontSize: '16px', 
                color: '#1e293b',
                fontWeight: '700'
              }}>
                <FaIcon icon="fa-list" className="me-2" style={{ color: 'rgb(231 101 88)', fontSize: '18px' }} />
                {isArabic ? 'قائمة المنتوجات' : 'Liste des produits'}
              </div>
              <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                {ebeList.length > 0
                  ? isArabic
                    ? `عدد السندات: ${ebeList.length}`
                    : `Nombre de reçus : ${ebeList.length}`
                  : isArabic
                    ? 'لا توجد سندات استقبال'
                    : 'Aucun bon d\'entrée disponible'}
              </small>
            </div>
          </div>

          {!selectedSite || !selectedBatiment ? (
            <div className="text-center p-4 text-muted d-flex flex-column justify-content-center align-items-center">
              <FaIcon icon="fa-exclamation-circle" className="mb-2" style={{ fontSize: '48px', color: '#f59e0b' }} />
              <div className="fw-bold mb-2" style={{fontSize: '14px', color: '#1e293b'}}>
                {isArabic ? 'يرجى اختيار المركز والحظيرة أولاً' : 'Veuillez choisir le centre et le bâtiment d\'abord'}
              </div>
            </div>
          ) : loadingEbe ? (
            <div className="text-center p-4">
              <CSpinner size="sm" />
              <div className="mt-2 text-muted" style={{ fontSize: '12px' }}>
                {isArabic ? 'جاري تحميل السندات...' : 'Chargement des reçus...'}
              </div>
            </div>
          ) : ebeError ? (
            <div className="text-center p-4 text-danger">
              <FaIcon icon="fa-exclamation-triangle" className="mb-2" style={{ fontSize: '32px' }} />
              <div style={{ fontSize: '13px' }}>{ebeError}</div>
            </div>
          ) : ebeList.length === 0 ? (
            <div className="text-center p-4 text-muted d-flex flex-column justify-content-center align-items-center">
              <FaIcon icon="fa-inbox" className="mb-2 opacity-50" style={{ fontSize: '32px' }} />
              <div className="fw-bold" style={{fontSize: '12px'}}>
                {isArabic ? 'لا توجد سندات استقبال متاحة' : 'Aucun bon d\'entrée disponible'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ 
                borderRadius: '12px',
                overflow: 'auto',
                border: '1px solid #f1f5f9',
                direction: isArabic ? 'rtl' : 'ltr',
                maxHeight: '600px',
                width: '100%',
                maxWidth: '100%'
              }}>
                <CTable hover responsive align="middle" dir={isArabic ? 'rtl' : 'ltr'} style={{ marginBottom: 0, width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      {/* رقم الحركة / Numéro de mouvement */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '80px',
                        maxWidth: '110px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-hashtag" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'رقم الحركة' : 'N° mouvement'}
                      </th>
                      {/* كود المورد / Code fournisseur */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '80px',
                        maxWidth: '110px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-barcode" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'كود المورد' : 'Code fournisseur'}
                      </th>
                      {/* اسم المورد / Nom fournisseur */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '120px',
                        maxWidth: '160px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-truck" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'اسم المورد' : 'Nom du fournisseur'}
                      </th>
                      {/* التاريخ / Date */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '80px',
                        maxWidth: '100px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-calendar" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'التاريخ' : 'Date'}
                      </th>
                      {/* عدد المنتوجات / Nb produits */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '70px',
                        maxWidth: '90px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-boxes" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'عدد المنتوجات' : 'Nb produits'}
                      </th>
                      {/* الإجراءات / Actions */}
                      <th style={{ 
                        background: 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(64, 45, 43) 100%)', 
                        padding: '12px 6px', 
                        textAlign: 'center', 
                        fontWeight: '800', 
                        color: '#ffffff', 
                        borderBottom: '2px solid rgb(50, 35, 33)', 
                        fontSize: '11px',
                        minWidth: '100px',
                        maxWidth: '120px',
                        boxShadow: '0 2px 4px rgba(231, 101, 88, 0.3)'
                      }}>
                        <FaIcon icon="fa-cog" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#ffffff', fontSize: '10px' }} />
                        {isArabic ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEbeList.map((ebe, index) => {
                      const ebeKey = ebe.nummvt || ebe.numMvt || ebe.id || index;
                      const selectedKey =
                        selectedEbe?.nummvt || selectedEbe?.numMvt || selectedEbe?.id;
                      const isExpanded = selectedKey && selectedKey === ebeKey;

                      return (
                        <React.Fragment key={ebeKey}>
                          <tr 
                            style={{ 
                              borderBottom: index < paginatedEbeList.length - 1 ? '1px solid #f1f5f9' : 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              background: isExpanded ? 'linear-gradient(90deg, rgba(231, 101, 88, 0.06) 0%, rgba(231, 101, 88, 0.01) 100%)' : '#ffffff'
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded) e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) e.currentTarget.style.background = '#ffffff';
                            }}
                          >
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '10px', 
                              color: 'rgb(231 101 88)', 
                              fontWeight: '700',
                              fontFamily: 'monospace'
                            }}>
                              {ebe.nummvt || ebe.numMvt || ebe.id || '-'}
                            </td>
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '10px', 
                              color: '#1e293b'
                            }}>
                              {ebe.codeFournisseur || ebe.codefournisseur || ebe.codetrs || ebe.codeTrs || '-'}
                            </td>
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '10px', 
                              color: '#1e293b',
                              wordBreak: 'break-word'
                            }}>
                              {isArabic 
                                ? (ebe.libarabeFournisseur || ebe.libArabeFournisseur || t(ebe, 'libarabeFournisseur') || '')
                                : (t(ebe, 'libtrs') || t(ebe, 'libelleFournisseur') || ebe.codeFournisseur || '')}
                            </td>
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '10px', 
                              color: '#64748b'
                            }}>
                              {(ebe.dateCreation || ebe.date || ebe.datemaj || '-')
                                ?.toString()
                                ?.split('T')[0]
                                ?.split(' ')[0]}
                            </td>
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '10px', 
                              color: 'rgb(231 101 88)',
                              fontWeight: '600'
                            }}>
                              {ebe.nombreArticles != null
                                ? ebe.nombreArticles
                                : Array.isArray(lpeDetails) && selectedKey === ebeKey
                                  ? lpeDetails.length
                                  : '-'}
                            </td>
                            <td style={{ 
                              padding: '8px 6px', 
                              textAlign: 'center', 
                              fontSize: '11px',
                              whiteSpace: 'nowrap' 
                            }}>
                              <CButton
                                color={isExpanded ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => handleViewLpe(ebe)}
                                style={{
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap',
                                  background: isExpanded 
                                    ? '#6c757d' 
                                    : 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(200, 80, 70) 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  boxShadow: isExpanded ? 'none' : '0 2px 4px rgba(231, 101, 88, 0.3)',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isExpanded) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgb(200, 80, 70) 0%, rgb(231, 101, 88) 100%)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isExpanded) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgb(231, 101, 88) 0%, rgb(200, 80, 70) 100%)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                <CIcon icon={cilMagnifyingGlass} className={isArabic ? "me-1" : "ms-1"} style={{ fontSize: '12px' }} />
                                {isExpanded
                                  ? isArabic
                                    ? 'إخفاء'
                                    : 'Masquer'
                                  : isArabic
                                    ? 'عرض'
                                    : 'Afficher'}
                              </CButton>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              {/* Sous-tableau sur 6 colonnes, centré visuellement */}
                              <td colSpan="6" style={{ padding: 0, background: '#f9fafb' }}>
                                <div
                                  style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {loadingLpe ? (
                                    <div className="text-center p-3">
                                      <CSpinner size="sm" />
                                      <div className="mt-2 text-muted" style={{ fontSize: '12px' }}>
                                        {isArabic ? 'جاري تحميل التفاصيل...' : 'Chargement des détails...'}
                                      </div>
                                    </div>
                                  ) : lpeDetails.length === 0 ? (
                                    <div className="text-center p-3 text-muted">
                                      <FaIcon icon="fa-inbox" className="mb-2 opacity-50" style={{ fontSize: '24px' }} />
                                      <div style={{ fontSize: '13px' }}>
                                        {isArabic ? 'لا توجد سطور متاحة' : 'Aucune ligne disponible'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="table-responsive"
                                      style={{ 
                                        borderRadius: '14px',
                                        overflow: 'auto',
                                        border: '1px solid #e2e8f0',
                                        direction: isArabic ? 'rtl' : 'ltr',
                                        maxHeight: '480px',
                                        maxWidth: '900px',
                                        width: '100%',
                                        background: '#ffffff',
                                        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
                                        margin: '0 auto'
                                      }}
                                    >
                                      <CTable hover responsive align="middle" dir={isArabic ? 'rtl' : 'ltr'} style={{ marginBottom: 0, width: '100%', tableLayout: 'auto' }}>
                                        <thead>
                                          <tr>
                                            <th style={{ 
                                              background: 'linear-gradient(135deg, #fa8e8e 0%, #f5a5a5 100%)', 
                                              padding: '10px 8px', 
                                              textAlign: 'center', 
                                              fontWeight: '800', 
                                              color: '#1e293b', 
                                              borderBottom: '2px solid #e2e8f0', 
                                              fontSize: '11px',
                                              minWidth: '100px',
                                              maxWidth: '130px'
                                            }}>
                                              <FaIcon icon="fa-barcode" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#047857', fontSize: '10px' }} />
                                              {isArabic ? 'كود المنتوج' : 'Code produit'}
                                            </th>
                                            <th style={{ 
                                              background: 'linear-gradient(135deg, #fa8e8e 0%, #f5a5a5 100%)', 
                                              padding: '10px 8px', 
                                              textAlign: 'center', 
                                              fontWeight: '800', 
                                              color: '#1e293b', 
                                              borderBottom: '2px solid #e2e8f0', 
                                              fontSize: '11px',
                                              minWidth: '150px',
                                              maxWidth: '250px'
                                            }}>
                                              <FaIcon icon="fa-tag" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#047857', fontSize: '10px' }} />
                                              {isArabic ? 'وصف المنتوج' : 'Désignation produit'}
                                            </th>
                                            <th style={{ 
                                              background: 'linear-gradient(135deg, #fa8e8e 0%, #f5a5a5 100%)', 
                                              padding: '10px 8px', 
                                              textAlign: 'center', 
                                              fontWeight: '800', 
                                              color: '#1e293b', 
                                              borderBottom: '2px solid #e2e8f0', 
                                              fontSize: '11px',
                                              minWidth: '80px',
                                              maxWidth: '100px'
                                            }}>
                                              <FaIcon icon="fa-box" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#047857', fontSize: '10px' }} />
                                              {isArabic ? 'الكمية' : 'Quantité'}
                                            </th>
                                            <th style={{ 
                                              background: 'linear-gradient(135deg, #fa8e8e 0%, #f5a5a5 100%)', 
                                              padding: '10px 8px', 
                                              textAlign: 'center', 
                                              fontWeight: '800', 
                                              color: '#1e293b', 
                                              borderBottom: '2px solid #e2e8f0', 
                                              fontSize: '11px',
                                              minWidth: '100px',
                                              maxWidth: '120px'
                                            }}>
                                              <FaIcon icon="fa-calendar-alt" className={isArabic ? "me-1" : "ms-1"} style={{ color: '#047857', fontSize: '10px' }} />
                                              {isArabic ? 'تاريخ الحركة' : 'Date mouvement'}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {lpeDetails.map((lpe, index) => (
                                            <tr key={lpe.pniaer || lpe.id || index}>
                                              <td style={{ 
                                                padding: '10px 8px', 
                                                textAlign: 'center', 
                                                fontSize: '11px', 
                                                color: 'rgb(231 101 88)', 
                                                fontWeight: '700',
                                                fontFamily: 'monospace'
                                              }}>
                                                {lpe.codeart || lpe.codeArt || '-'}
                                              </td>
                                              <td style={{ 
                                                padding: '10px 8px', 
                                                textAlign: isArabic ? 'right' : 'left', 
                                                fontSize: '11px',
                                                wordBreak: 'break-word'
                                              }}>
                                                {isArabic 
                                                  ? (lpe.libarabe || lpe.libArabe || lpe.desart || lpe.libelle || lpe.Libelle || '-')
                                                  : (lpe.desart || lpe.libelle || lpe.Libelle || lpe.libarabe || lpe.libArabe || '-')}
                                              </td>
                                              <td style={{ 
                                                padding: '10px 8px', 
                                                textAlign: 'center', 
                                                fontSize: '11px',
                                                color: 'rgb(231 101 88)',
                                                fontWeight: '600'
                                              }}>
                                                {lpe.qteart || lpe.QteArt || lpe.quantite || 0}
                                              </td>
                                              <td style={{ 
                                                padding: '10px 8px', 
                                                textAlign: 'center', 
                                                fontSize: '11px',
                                                color: '#64748b'
                                              }}>
                                                {(lpe.datemvt || lpe.dateMvt || lpe.datemaj || lpe.dateMaj || lpe.date || '')
                                                  ?.toString()
                                                  ?.split('T')[0]
                                                  ?.split(' ')[0] || ''}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </CTable>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </CTable>
              </div>

              {/* Pagination */}
              {ebeList.length > 0 && (
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
                      {isArabic 
                        ? `عرض ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, ebeList.length)} من ${ebeList.length}`
                        : `Affichage de ${((currentPage - 1) * itemsPerPage) + 1} à ${Math.min(currentPage * itemsPerPage, ebeList.length)} sur ${ebeList.length}`}
                    </span>
                    <CPagination aria-label="Page navigation">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                        style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <FaIcon icon={isArabic ? "fa-chevron-right" : "fa-chevron-left"} />
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
                        <FaIcon icon={isArabic ? "fa-chevron-left" : "fa-chevron-right"} />
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
  );
};

export default BonEntreeConsultation;

