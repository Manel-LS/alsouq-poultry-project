// src/pages/Reports.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from "@coreui/react";
import { fetchRapChairCentre } from "../services/reportsService";
import api from "../services/api";
import { API_ENDPOINTS } from "../config/api";
import { PageHeaderCard } from "../components/index.jsx";
import { useTranslation } from "react-i18next";

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);

// Fonction pour obtenir les types de rapports traduits
const getDefaultReportTypes = (isArabic) => [
  { 
    type: 'chair', 
    label: isArabic ? 'دجاج لحم' : 'Poulets de chair', 
    value: 'chair', 
    color: 'rgb(231 101 88)',
    icon: '🐔',
    description: isArabic ? 'تقرير دجاج اللحم' : 'Rapport des poulets de chair'
  },
  { 
    type: 'ponte', 
    label: isArabic ? 'بياض' : 'Poules pondeuses', 
    value: 'ponte', 
    color: '#f87171',
    icon: '🥚',
    description: isArabic ? 'تقرير الدجاج البياض' : 'Rapport des poules pondeuses'
  },
  { 
    type: 'repro', 
    label: isArabic ? 'تفريخ' : 'Reproduction', 
    value: 'repro', 
    color: '#fb923c',
    icon: '🐣',
    description: isArabic ? 'تقرير التفريخ والتوزيع' : 'Rapport de reproduction et distribution'
  },
];

// Types de rapports par défaut - 3 TYPES SEULEMENT (pour compatibilité)
const DEFAULT_REPORT_TYPES = getDefaultReportTypes(true);

const Reports = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  // Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();
  const [fromDate, setFromDate] = useState(todayDate);
  const [toDate, setToDate] = useState(todayDate);
  const [submittedRange, setSubmittedRange] = useState({ fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState("");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [usingDefaultTypes, setUsingDefaultTypes] = useState(false);

  // Vérifier la session et récupérer les types de rapports
  useEffect(() => {
    const databaseChoice = sessionStorage.getItem('database_choice');
    const token = sessionStorage.getItem('auth_token') || JSON.parse(sessionStorage.getItem('user') || '{}')?.token;
    
    if (!databaseChoice || !token) {
      console.warn('⚠️ Session expirée ou base de données non sélectionnée. Redirection vers login.');
      sessionStorage.clear();
      navigate('/login', { replace: true });
      return;
    }

    const fetchReportTypes = async () => {
      try {
        setLoadingTypes(true);
        setError(null);
        
        const response = await api.get(API_ENDPOINTS.reportTypes);
        
        let types = [];
        let firstSelectedType = null;
        
        if (response.data?.success && response.data?.data) {
          const dataObj = response.data.data;
          
          // Mapping des 3 types seulement
          const defaultTypes = getDefaultReportTypes(isArabic);
          const typeMapping = {
            chair: defaultTypes[0],
            ponte: defaultTypes[1],
            repro: defaultTypes[2],
          };
          
          // Vérifier les 3 types seulement
          const availableTypes = ['chair', 'ponte', 'repro'];
          
          availableTypes.forEach(typeKey => {
            if (typeMapping[typeKey]) {
              const isEnabled = dataObj[typeKey] === "1" || dataObj[typeKey] === 1;
              
              // Garder tous les types, mais marquer enabled selon la valeur
              const typeObj = { 
                ...typeMapping[typeKey],
                enabled: isEnabled
              };
              types.push(typeObj);
              
              // Sélectionner le premier type activé disponible
              if (isEnabled && !firstSelectedType) {
                firstSelectedType = typeObj.value;
              }
            }
          });
        }

        // Si pas de types de l'API, utiliser les types par défaut (tous activés)
        if (types.length === 0) {
          types = getDefaultReportTypes(isArabic).map(type => ({ ...type, enabled: true }));
          setUsingDefaultTypes(true);
          if (types.length > 0) {
            firstSelectedType = types[0].value;
          }
        }

        setReportTypes(types);
        
        // Sélectionner le premier type activé
        if (firstSelectedType) {
          setSelectedReportType(firstSelectedType);
        } else if (types.length > 0) {
          // Si aucun type activé, chercher le premier type activé dans la liste
          const firstEnabled = types.find(type => type.enabled === true);
          if (firstEnabled) {
            setSelectedReportType(firstEnabled.value);
          }
        }
        
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des types de rapports:', err);
        
        // En cas d'erreur, utiliser les types par défaut (tous activés)
        const defaultTypes = DEFAULT_REPORT_TYPES.map(type => ({ ...type, enabled: true }));
        setReportTypes(defaultTypes);
        setUsingDefaultTypes(true);
        if (defaultTypes.length > 0) {
          setSelectedReportType(defaultTypes[0].value);
        }
        
        const errorMessage = err.response?.data?.error || err.message || '';
        if (err.response?.status === 401) {
          sessionStorage.clear();
          navigate('/login', { replace: true });
        } else {
          setError(isArabic 
            ? 'يتم استخدام أنواع التقارير الافتراضية. تعذر تحميل أنواع التقارير من الخادم.'
            : 'Les types de rapports par défaut sont utilisés. Impossible de charger les types de rapports depuis le serveur.');
        }
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchReportTypes();
  }, [navigate, isArabic]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!fromDate || !toDate) {
        setError(isArabic 
          ? "يرجى اختيار تاريخ البداية والنهاية قبل عرض التقارير."
          : "Veuillez choisir les dates de début et de fin avant d'afficher les rapports.");
        return;
      }
      if (!selectedReportType) {
        setError(isArabic 
          ? "يرجى اختيار نوع التقرير."
          : "Veuillez choisir le type de rapport.");
        return;
      }
      setError(null);
      setSubmittedRange({ fromDate, toDate });
      setLoading(true);

      const abortController = new AbortController();

      fetchRapChairCentre({
        dateDebut: fromDate,
        dateFin: toDate,
        reportType: selectedReportType,
        signal: abortController.signal,
      })
        .then((result) => {
          setError(null);
          setSuccessMessage(isArabic 
            ? `تم تحميل الملف بنجاح: ${result.filename || 'الملف'}`
            : `Fichier téléchargé avec succès : ${result.filename || 'le fichier'}`);
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
        })
        .catch((err) => {
          if (err.name === "CanceledError" || err.name === "AbortError") {
            return;
          }
          console.error("❌ Error while fetching reports:", err);
          
          let errorMessage = err.message || (isArabic ? "تعذر تحميل الملف. يرجى المحاولة مرة أخرى." : "Impossible de télécharger le fichier. Veuillez réessayer.");
          
          if (errorMessage.includes("Error CS") || errorMessage.includes("FastReport")) {
            const errorMatch = errorMessage.match(/Error CS\d+: '([^']+)' does not contain a definition for '([^']+)'/);
            if (errorMatch) {
              errorMessage = isArabic 
                ? `خطأ في قالب التقرير: الخاصية '${errorMatch[2]}' غير موجودة في '${errorMatch[1]}'. يرجى الاتصال بالدعم الفني.`
                : `Erreur dans le modèle de rapport : la propriété '${errorMatch[2]}' n'existe pas dans '${errorMatch[1]}'. Veuillez contacter le support technique.`;
            } else {
              errorMessage = isArabic ? "خطأ في إنشاء التقرير. يرجى الاتصال بالدعم الفني." : "Erreur lors de la création du rapport. Veuillez contacter le support technique.";
            }
          }
          
          setError(errorMessage);
          setSuccessMessage(null);
        })
        .finally(() => {
          setLoading(false);
        });

      return () => {
        abortController.abort();
      };
    },
    [fromDate, toDate, selectedReportType, isArabic]
  );

  const activeRangeLabel = useMemo(() => {
    if (!submittedRange.fromDate || !submittedRange.toDate) {
      return null;
    }
    return isArabic 
      ? `من ${submittedRange.fromDate} إلى ${submittedRange.toDate}`
      : `Du ${submittedRange.fromDate} au ${submittedRange.toDate}`;
  }, [submittedRange, isArabic]);

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="reports-page">
      <PageHeaderCard
        title={isArabic ? "تحميل التقارير التفصيلية حسب الفترة" : "Télécharger les rapports détaillés par période"}
        icon={<FaIcon icon="fa-file-alt" />}
        badge={activeRangeLabel && (
          <CBadge 
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              fontSize: 'var(--text-xs)',
              fontWeight: '500',
            }}
          >
            {activeRangeLabel}
          </CBadge>
        )}
      />
      <CCard className="custom-card">
        <CCardBody className="card-body-custom">
          {loadingTypes ? (
            <div className="loading-container">
              <CSpinner className="loading-spinner" />
              <p className="loading-text">{isArabic ? "جاري تحميل أنواع التقارير..." : "Chargement des types de rapports..."}</p>
            </div>
          ) : (
            <>
              <div className="report-type-section">
                <h2 className="section-title">{isArabic ? "اختر نوع التقرير:" : "Choisissez le type de rapport :"}</h2>
                <CRow className="report-types-row">
                  {reportTypes.map((type, index) => {
                    const isSelected = selectedReportType === type.value;
                    const isEnabled = type.enabled === true;
                    
                    return (
                      <CCol xs={12} md={4} key={index} className="mb-2">
                        <div 
                          className={`report-type-card ${isSelected ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
                          onClick={() => isEnabled && setSelectedReportType(type.value)}
                        >
                          <div className="card-content">
                            <div className="type-icon">{type.icon}</div>
                            <div className="type-text">
                              <h3 className="type-label">{type.label}</h3>
                              <p className="type-description">{type.description}</p>
                            </div>
                            <div className={`radio-indicator ${isSelected ? 'checked' : ''} ${!isEnabled ? 'disabled' : ''}`}>
                              {isSelected && isEnabled && <div className="checkmark" />}
                            </div>
                          </div>
                        </div>
                      </CCol>
                    );
                  })}
                </CRow>
              </div>
              <div className="date-section">
                <CRow className="date-inputs-row">
                  <CCol xs={12} md={5}>
                    <div className="date-input-group">
                      <label className="date-label">{isArabic ? "من تاريخ" : "Date de début"}</label>
                      <CFormInput
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="date-input"
                        placeholder={isArabic ? "يوم/شهر/سنة" : "JJ/MM/AAAA"}
                        dir={isArabic ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </CCol>
                  
                  <CCol xs={12} md={5}>
                    <div className="date-input-group">
                      <label className="date-label">{isArabic ? "إلى تاريخ" : "Date de fin"}</label>
                      <CFormInput
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="date-input"
                        placeholder={isArabic ? "يوم/شهر/سنة" : "JJ/MM/AAAA"}
                        dir={isArabic ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </CCol>
                  
                  <CCol xs={12} md={2}>
                    <div className="button-group">
                      <CButton 
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <CSpinner size="sm" className={isArabic ? "me-2" : "ms-2"} />
                            {isArabic ? "جاري التحميل..." : "Téléchargement..."}
                          </>
                        ) : (
                          isArabic ? "تحميل التقرير" : "Télécharger le rapport"
                        )}
                      </CButton>
                      
                      <CButton
                        className="reset-btn"
                        variant="outline"
                        onClick={() => {
                          const today = getTodayDate();
                          setFromDate(today);
                          setToDate(today);
                          setSubmittedRange({ fromDate: "", toDate: "" });
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        disabled={loading}
                      >
                        {isArabic ? "إعادة تعيين" : "Réinitialiser"}
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </div>
            </>
          )}

          <div className="alerts-container">
            {!submittedRange.fromDate && !submittedRange.toDate && !loadingTypes && (
              <CAlert className="info-alert">
                <strong>{isArabic ? "ملاحظة:" : "Note :"}</strong> {isArabic 
                  ? "اختر الفترة الزمنية المناسبة (من / إلى) ثم اضغط على"
                  : "Choisissez la période appropriée (de / à) puis cliquez sur"}{" "}
                <strong>{isArabic ? "تحميل التقرير" : "Télécharger le rapport"}</strong>{" "}
                {isArabic ? "لتحميل الملف." : "pour télécharger le fichier."}
              </CAlert>
            )}

            {error && (
              <CAlert className={`error-alert ${usingDefaultTypes ? 'warning' : 'danger'}`}>
                {error}
              </CAlert>
            )}

            {successMessage && (
              <CAlert className="success-alert">
                <strong>{isArabic ? "تم بنجاح:" : "Succès :"}</strong> {successMessage}
              </CAlert>
            )}

            {submittedRange.fromDate && submittedRange.toDate && loading && (
              <CAlert className="loading-alert">
                <div className={`d-flex ${isArabic ? 'justify-content-between' : 'justify-content-between'} align-items-center`}>
                  <span>{isArabic ? "جاري تحميل الملف، يرجى الانتظار..." : "Téléchargement du fichier en cours, veuillez patienter..."}</span>
                  <CSpinner size="sm" />
                </div>
              </CAlert>
            )}
          </div>
        </CCardBody>
      </CCard>

      <style>{`
        .reports-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f6fa;
          min-height: 100vh;
          padding: var(--page-container-padding-y) var(--page-container-padding-x);
        }

        .custom-card {
          border: none;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }


        .card-body-custom {
          padding: 1.25rem;
        }

        .loading-container {
          text-align: center;
          padding: 2rem 1rem;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          color: rgb(231 101 88);
        }

        .loading-text {
          color: #64748b;
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }

        .report-type-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        
        .reports-page[dir="rtl"] .section-title {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .section-title {
          text-align: left;
        }

        .report-types-row {
          margin: 0 -6px;
        }

        .report-type-card {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
        }

        .report-type-card:hover:not(.disabled) {
          border-color: rgb(231 101 88);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(231, 101, 88, 0.12);
        }

        .report-type-card.selected {
          border-color: rgb(231 101 88);
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          box-shadow: 0 4px 12px rgba(231, 101, 88, 0.15);
        }

        .report-type-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .type-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
        }

        .type-text {
          flex: 1;
        }
        
        .reports-page[dir="rtl"] .type-text {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .type-text {
          text-align: left;
        }

        .type-label {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .type-description {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
          line-height: 1.3;
        }

        .radio-indicator {
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .radio-indicator.checked {
          border-color: rgb(231 101 88);
          background: rgb(231 101 88);
        }

        .radio-indicator.disabled {
          border-color: #cbd5e1;
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .checkmark {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        }

        .date-section {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .date-inputs-row {
          align-items: end;
        }

        .reports-page[dir="rtl"] .date-input-group {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .date-input-group {
          text-align: left;
        }

        .date-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: #334155;
          margin-bottom: 0.5rem;
        }

        .date-input {
          border: 1.5px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .reports-page[dir="rtl"] .date-input {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .date-input {
          text-align: left;
        }

        .date-input:focus {
          border-color: rgb(231 101 88);
          box-shadow: 0 0 0 2px rgba(231, 101, 88, 0.1);
          outline: none;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
        }

        .submit-btn {
          /* Couleur unie pour correspondre au header */
          background: rgb(231 101 88);
          border: none;
          border-radius: 6px;
          padding: 0.6rem 1.25rem;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          flex: 1;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 83, 26, 0.3);
        }

        .reset-btn {
          border: 1.5px solid #94a3b8;
          border-radius: 6px;
          padding: 0.6rem 1.25rem;
          font-weight: 500;
          font-size: 0.9rem;
          color: #64748b;
          background: white;
          transition: all 0.2s ease;
          flex: 1;
        }

        .reset-btn:hover:not(:disabled) {
          background: #64748b;
          color: white;
          border-color: #64748b;
        }

        .alerts-container {
          margin-top: 1rem;
        }

        .info-alert {
          background: #ffe5e5;
          border: none;
          border-radius: 6px;
          color: #991b1b;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
        }
        
        .reports-page[dir="rtl"] .info-alert {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .info-alert {
          text-align: left;
        }

        .error-alert {
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
        }
        
        .reports-page[dir="rtl"] .error-alert {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .error-alert {
          text-align: left;
        }

        .error-alert.danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .error-alert.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .success-alert {
          background: #dcfce7;
          border: none;
          border-radius: 6px;
          color: #166534;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
        }
        
        .reports-page[dir="rtl"] .success-alert {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .success-alert {
          text-align: left;
        }

        .loading-alert {
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          color: #475569;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
        }
        
        .reports-page[dir="rtl"] .loading-alert {
          text-align: right;
        }
        
        .reports-page[dir="ltr"] .loading-alert {
          text-align: left;
        }

        @media (max-width: 768px) {
          .reports-page {
            padding: 8px;
          }
          
          .card-body-custom {
            padding: 1rem;
          }
          
          .card-content {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          
          .type-text {
            text-align: center;
          }
          
          .button-group {
            margin-top: 0.75rem;
          }
          
          .date-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;