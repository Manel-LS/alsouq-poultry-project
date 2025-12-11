/**
 * Helper pour la traduction FR/AR dans le front-end
 * Utilisez cette fonction pour récupérer le bon champ selon la langue
 */

/**
 * Récupère le champ traduit selon la langue sélectionnée
 * @param {Object} item - L'objet contenant les données
 * @param {string} fieldName - Le nom du champ en français
 * @param {string} lang - La langue ('fr' ou 'ar')
 * @returns {string} - La valeur du champ dans la langue demandée
 */
export const getTranslatedField = (item, fieldName, lang = 'fr') => {
  if (!item) return '';
  
  // Si français, retourner le champ original
  if (lang === 'fr') {
    return item[fieldName] || '';
  }
  
  // Si arabe, chercher le champ correspondant
  const arabicFieldMap = {
    // Espece
    'libelle': 'libarabe',
    'tespece': 'tespecearabe',
    'NomEspece': 'NomEspeceArabe',
    
    // Batiment
    'libelleCentre': 'libcentarabe',
    'LibelleCentre': 'LibCentarabe',
    'adresse': 'adrarabe',
    'Adresse': 'Adrarabe',
    'libellebat': 'libbatarabe',
    'LibelleBatiment': 'LibBatarabe',
    
    // Miseplace
    'libesp': 'libesparabe',
    'LibEspece': 'LibEesparabe',
    'libcentre': 'libcentarabe',
    'libbat': 'libbatarabe',
    
    // StockDepot / Lmvt / Article
    'desart': 'libarabe',
    'Desart': 'Libarabe',
    'unite': 'unitearabe',
    'Unite': 'UniteArabe',
    
    // Fournisseur
    'libelle': 'libarabe',
    'libelleFournisseur': 'libarabeFournisseur',
    'libtrs': 'libarabeFournisseur',
    
    // Lmvt
    'Libarabe': 'Libarabe', // déjà en arabe
  };
  
  const arabicField = arabicFieldMap[fieldName];
  
  if (arabicField && item[arabicField]) {
    return item[arabicField];
  }
  
  // Fallback : si pas de champ arabe, retourner le français
  return item[fieldName] || '';
};

/**
 * Version simplifiée pour les champs courants
 */
export const t = (item, field, lang) => getTranslatedField(item, field, lang);

/**
 * Exemple d'utilisation dans React
 */
export const useTranslation = (lang) => {
  return {
    t: (item, field) => getTranslatedField(item, field, lang),
    lang
  };
};

