import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getTranslatedField } from './translation-helper';

/**
 * Exemple d'utilisation dans React
 */
const BatimentList = () => {
  const [lang, setLang] = useState('fr'); // 'fr' ou 'ar'
  const [batiments, setBatiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la langue depuis localStorage
    const savedLang = localStorage.getItem('lang') || 'fr';
    setLang(savedLang);
    
    // Charger les bâtiments
    axios.get('/api/batiments', {
      params: { codeuser: 'USER001' }
    })
    .then(res => {
      setBatiments(res.data.batiments);
      setLoading(false);
    })
    .catch(err => {
      console.error('Erreur:', err);
      setLoading(false);
    });
  }, []);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Sélecteur de langue */}
      <div style={{ textAlign: 'right', marginBottom: '20px', padding: '10px' }}>
        <button 
          onClick={() => handleLangChange('fr')}
          style={{ 
            marginRight: '10px',
            fontWeight: lang === 'fr' ? 'bold' : 'normal',
            backgroundColor: lang === 'fr' ? '#007bff' : '#f0f0f0',
            color: lang === 'fr' ? 'white' : 'black'
          }}
        >
          Français
        </button>
        <button 
          onClick={() => handleLangChange('ar')}
          style={{ 
            fontWeight: lang === 'ar' ? 'bold' : 'normal',
            backgroundColor: lang === 'ar' ? '#007bff' : '#f0f0f0',
            color: lang === 'ar' ? 'white' : 'black'
          }}
        >
          العربية
        </button>
      </div>

      {/* Liste des bâtiments */}
      <div>
        <h1>{lang === 'fr' ? 'Liste des Bâtiments' : 'قائمة المباني'}</h1>
        
        {batiments.map(batiment => (
          <div 
            key={batiment.numbat}
            style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          >
            <h2>{getTranslatedField(batiment, 'libelleCentre', lang)}</h2>
            <p>
              <strong>{lang === 'fr' ? 'Adresse:' : 'العنوان:'}</strong>{' '}
              {getTranslatedField(batiment, 'adresse', lang)}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Bâtiment:' : 'المبنى:'}</strong>{' '}
              {getTranslatedField(batiment, 'libellebat', lang)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Exemple avec les détails d'un bon d'entrée
 */
const StockEntryDetail = ({ nummvt }) => {
  const [lang, setLang] = useState('fr');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    axios.get(`/api/detail-stock-entry/${nummvt}`)
      .then(res => setDetails(res.data.data))
      .catch(err => console.error(err));
  }, [nummvt]);

  if (!details) return <div>Chargement...</div>;

  return (
    <div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="fr">Français</option>
        <option value="ar">العربية</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>{lang === 'fr' ? 'Article' : 'المادة'}</th>
            <th>{lang === 'fr' ? 'Quantité' : 'الكمية'}</th>
            <th>{lang === 'fr' ? 'Unité' : 'الوحدة'}</th>
          </tr>
        </thead>
        <tbody>
          {details.map((line, index) => (
            <tr key={index}>
              <td>{getTranslatedField(line, 'desart', lang)}</td>
              <td>{line.qteart}</td>
              <td>{getTranslatedField(line, 'unite', lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Exemple avec les fournisseurs
 */
const FournisseurSelect = ({ value, onChange }) => {
  const [lang, setLang] = useState('fr');
  const [fournisseurs, setFournisseurs] = useState([]);

  useEffect(() => {
    axios.get('/api/fournisseurs')
      .then(res => setFournisseurs(res.data.fournisseurs))
      .catch(err => console.error(err));
  }, []);

  return (
    <select value={value} onChange={onChange}>
      <option value="">{lang === 'fr' ? 'Sélectionner...' : 'اختر...'}</option>
      {fournisseurs.map(frs => (
        <option key={frs.code} value={frs.code}>
          {getTranslatedField(frs, 'libelle', lang)}
        </option>
      ))}
    </select>
  );
};

export { BatimentList, StockEntryDetail, FournisseurSelect };




