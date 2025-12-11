import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner, CAlert } from '@coreui/react';
import { fetchBatiments } from '../utils/batimentsFetcher.js';
import { useNavigate } from 'react-router-dom';
import { useTranslationField } from '../hooks/useTranslationField';
import { useTranslation } from 'react-i18next';

const BatimentsDisplay = () => {
  const [batiments, setBatiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, isRTL } = useTranslationField();

  useEffect(() => {
    const getBatiments = async () => {
      try {
        setLoading(true);
        const data = await fetchBatiments();
        setBatiments(data);
      } catch (err) {
        console.error('Error in BatimentsDisplay component:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.message || 'فشل في تحميل المباني');
        }
      } finally {
        setLoading(false);
      }
    };

    getBatiments();
  }, [navigate]);

  if (loading) {
    return (
      <div className="text-center p-3" dir={isRTL ? 'rtl' : 'ltr'}>
        <CSpinner size="sm" />
        <div className="mt-2">{isRTL ? 'جاري تحميل المباني...' : 'Chargement des bâtiments...'}</div>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger" className="text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        {error}
      </CAlert>
    );
  }

  if (batiments.length === 0) {
    return (
      <CAlert color="info" className="text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        {isRTL ? 'لا توجد مباني متاحة' : 'Aucun bâtiment disponible'}
      </CAlert>
    );
  }

  return (
    <CCard className="mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <CCardBody>
        <h5 className={`card-title ${isRTL ? 'text-end' : 'text-start'}`}>
          {isRTL ? 'قائمة المباني' : 'Liste des bâtiments'}
        </h5>
        <div className="table-responsive">
          <CTable striped hover className="data-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'كود العميل' : 'Code client'}
                </CTableHeaderCell>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'رقم المركز' : 'Numéro centre'}
                </CTableHeaderCell>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'اسم المركز' : 'Nom du centre'}
                </CTableHeaderCell>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'العنوان' : 'Adresse'}
                </CTableHeaderCell>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'رقم المبنى' : 'Numéro bâtiment'}
                </CTableHeaderCell>
                <CTableHeaderCell className={isRTL ? 'text-end' : 'text-start'}>
                  {isRTL ? 'اسم المبنى' : 'Nom du bâtiment'}
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {batiments.map((batiment, index) => (
                <CTableRow key={batiment.numbat + '-' + index}>
                  <CTableDataCell>{batiment.codecli}</CTableDataCell>
                  <CTableDataCell>{batiment.numeroCentre}</CTableDataCell>
                  <CTableDataCell>{t(batiment, 'libelleCentre')}</CTableDataCell>
                  <CTableDataCell>{t(batiment, 'adresse')}</CTableDataCell>
                  <CTableDataCell>{batiment.numbat}</CTableDataCell>
                  <CTableDataCell>{t(batiment, 'libellebat')}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default BatimentsDisplay;
