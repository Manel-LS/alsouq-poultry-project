// src/components/DatabaseSelector.js
import React, { useState, useEffect } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilStorage, cilCheckCircle, cilWarning } from '@coreui/icons';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';

const DatabaseSelector = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Charger les bases de données disponibles
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const response = await api.get(API_ENDPOINTS.databases);
        
        if (response.data.success) {
          setDatabases(response.data.databases || []);
        } else {
          setMessage({ 
            text: 'Échec du chargement des bases de données', 
            type: 'danger' 
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des bases de données:', error);
        setMessage({ 
          text: 'Erreur de connexion au serveur', 
          type: 'danger' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  // Sélectionner la base de données
  const handleDatabaseSelect = async () => {
    if (!selectedDatabase) {
      setMessage({ 
        text: 'Veuillez sélectionner une base de données', 
        type: 'warning' 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.selectDatabase, {
        database: selectedDatabase
      });

      if (response.data.success) {
        setMessage({ 
          text: 'Base de données sélectionnée avec succès', 
          type: 'success' 
        });
        
        // Sauvegarder le choix en session
        sessionStorage.setItem('database_choice', selectedDatabase);
        
        // Recharger la page après la sélection
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      setMessage({ 
        text: 'Erreur lors de la sélection de la base de données', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CContainer className="d-flex justify-content-center align-items-center min-vh-100">
      <CRow className="w-100 justify-content-center">
        <CCol md={6} lg={4}>
          <CCard className="shadow">
            <CCardHeader className="bg-primary text-white text-center py-3">
              <h5 className="mb-0">Sélection de la base de données</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              {message.text && (
                <CAlert color={message.type} className="mb-3">
                  {message.text}
                </CAlert>
              )}
              
              <div className="mb-3">
                <label htmlFor="databaseSelect" className="form-label fw-bold">
                  Bases de données disponibles
                </label>
                <CFormSelect
                  id="databaseSelect"
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Sélectionnez une base de données</option>
                  {databases.map((db) => (
                    <option key={db.code} value={db.code}>
                      {db.display_label || db.code}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="d-grid">
                <CButton 
                  color="primary" 
                  onClick={handleDatabaseSelect}
                  disabled={loading || !selectedDatabase}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilCheckCircle} className="me-2" />
                      Confirmer la sélection
                    </>
                  )}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default DatabaseSelector;