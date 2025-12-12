/**
 * Utilitaire de traduction pour les champs API français/arabe
 * 
 * Tous les endpoints API retournent maintenant les champs en français ET en arabe.
 * Cette fonction sélectionne le bon champ selon la langue choisie par l'utilisateur.
 */

/**
 * Type de langue supporté
 * @typedef {'fr' | 'ar'} Language
 */

/**
 * Mapping des champs français vers leurs équivalents arabes
 * @type {Record<string, string>}
 */
const ARABIC_FIELD_MAP = {
  // Espece
  'libelle': 'libarabe', // Utilisé pour Espece et Fournisseur
  'tespece': 'tespecearabe',
  'NomEspece': 'NomEspeceArabe',
  
  // Batiment
  'libelleCentre': 'libCentarabe',
  'LibelleCentre': 'libCentarabe',
  'libellecentre': 'libCentarabe',
  'Libellecentre': 'libCentarabe',
  'libelleBatiment': 'libBatarabe',
  'LibelleBatiment': 'libBatarabe',
  'libellebatiment': 'libBatarabe',
  'libellebat': 'libBatarabe',
  'libbat': 'libBatarabe', // Utilisé pour Batiment et Miseplace
  'LibBat': 'libBatarabe',
  'adresse': 'adrarabe',
  'Adresse': 'Adrarabe',
  
  // Miseplace
  'libesp': 'libesparabe',
  'LibEspece': 'LibEsparabe',
  'libcentre': 'libcentarabe', // Utiliser la variante minuscule pour correspondre à l'API
  'MpLibCentarabe': 'MpLibCentarabe', // Déjà en arabe dans la réponse
  'MpLibBatarabe': 'MpLibBatarabe',   // Déjà en arabe dans la réponse
  
  // StockDepot / Lmvt
  'desart': 'libarabe',
  'Desart': 'Libarabe',
  'unite': 'unitearabe',
  'Unite': 'UniteArabe',
  
  // Fournisseur
  'libelleFournisseur': 'libarabeFournisseur',
  'libtrs': 'libarabeFournisseur',
};

/**
 * Vérifie si une chaîne contient des caractères arabes valides
 * @param {string} str - La chaîne à vérifier
 * @returns {boolean} True si la chaîne contient des caractères arabes valides
 */
const isValidArabic = (str) => {
  if (!str || typeof str !== 'string') return false;
  // Vérifier si la chaîne contient des caractères arabes (plage Unicode: \u0600-\u06FF)
  return /[\u0600-\u06FF]/.test(str);
};

/**
 * Obtient le champ traduit selon la langue sélectionnée
 * 
 * @param {any} item - L'objet contenant les données (réponse API)
 * @param {string} fieldName - Le nom du champ français à traduire
 * @param {Language} lang - La langue actuelle ('fr' ou 'ar')
 * @returns {string} La valeur du champ traduit ou le champ français en fallback
 * 
 * @example
 * const batiment = {
 *   libelleCentre: "Centre 1",
 *   libCentarabe: "المركز 1"
 * };
 * 
 * getTranslatedField(batiment, 'libelleCentre', 'fr') // "Centre 1"
 * getTranslatedField(batiment, 'libelleCentre', 'ar') // "المركز 1"
 */
export const getTranslatedField = (item, fieldName, lang) => {
  if (!item || !fieldName) {
    return '';
  }

  // Si la langue est française, retourner directement le champ français
  if (lang === 'fr') {
    return item[fieldName] || '';
  }

  // Si la langue est arabe, chercher le champ arabe correspondant
  if (lang === 'ar') {
    // Vérifier d'abord le mapping explicite
    const arabicField = ARABIC_FIELD_MAP[fieldName];
    
    // Liste des variantes à essayer pour le champ arabe
    const variantsToTry = [];
    
    if (arabicField) {
      // Ajouter les variantes du mapping (exacte, minuscule, majuscule, tout en minuscules, camelCase)
      variantsToTry.push(arabicField);
      variantsToTry.push(arabicField.charAt(0).toLowerCase() + arabicField.slice(1));
      variantsToTry.push(arabicField.charAt(0).toUpperCase() + arabicField.slice(1));
      variantsToTry.push(arabicField.toLowerCase()); // Ajouter la variante tout en minuscules pour correspondre à l'API
      // Ajouter aussi la variante camelCase (première lettre minuscule, reste en camelCase)
      if (arabicField.length > 0) {
        const camelCase = arabicField.charAt(0).toLowerCase() + arabicField.slice(1);
        if (camelCase !== arabicField && camelCase !== arabicField.toLowerCase()) {
          variantsToTry.push(camelCase);
        }
        // Pour libbatarabe -> libBatarabe
        if (arabicField.startsWith('lib') && arabicField.length > 3) {
          const camelCaseVariant = 'lib' + arabicField.charAt(3).toUpperCase() + arabicField.slice(4);
          variantsToTry.push(camelCaseVariant);
        }
      }
    }
    
    // Ajouter des variantes génériques basées sur le nom du champ
    const camelCaseVariants = [
      `lib${fieldName.replace(/libelle?/i, '').replace(/^[A-Z]/, (match) => match.toLowerCase())}arabe`,
      `${fieldName.charAt(0).toLowerCase()}${fieldName.slice(1).replace(/([A-Z])/g, (match) => match)}Arabe`,
      `${fieldName.charAt(0).toLowerCase()}${fieldName.slice(1)}Arabe`,
      `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Arabe`,
      `${fieldName}Arabe`,
      // Ajouter aussi les variantes tout en minuscules
      `lib${fieldName.replace(/libelle?/i, '').replace(/^[A-Z]/, (match) => match.toLowerCase())}arabe`.toLowerCase(),
      `${fieldName.charAt(0).toLowerCase()}${fieldName.slice(1).replace(/([A-Z])/g, (match) => match.toLowerCase())}arabe`,
      `${fieldName.toLowerCase()}arabe`
    ];
    variantsToTry.push(...camelCaseVariants);
    
    // Essayer toutes les variantes et vérifier qu'elles contiennent de l'arabe valide
    for (const variant of variantsToTry) {
      if (item[variant] && isValidArabic(item[variant])) {
        return item[variant];
      }
    }
    
    // Si aucun champ arabe valide n'est trouvé, vérifier le champ français
    // mais seulement s'il contient de l'arabe valide (pour éviter les encodages incorrects)
    const frenchValue = item[fieldName];
    if (frenchValue && isValidArabic(frenchValue)) {
      return frenchValue;
    }
    
    // Fallback vers le champ français même s'il n'est pas en arabe valide
    // (pour éviter de retourner une chaîne vide)
    return frenchValue || '';
  }

  // Fallback par défaut
  return item[fieldName] || '';
};

/**
 * Obtient plusieurs champs traduits en une seule fois
 * 
 * @param {any} item - L'objet contenant les données
 * @param {string[]} fieldNames - Tableau des noms de champs à traduire
 * @param {Language} lang - La langue actuelle
 * @returns {Record<string, string>} Objet avec les champs traduits
 * 
 * @example
 * const fields = getTranslatedFields(batiment, ['libelleCentre', 'adresse'], 'ar');
 * // { libelleCentre: "المركز 1", adresse: "123 شارع..." }
 */
export const getTranslatedFields = (item, fieldNames, lang) => {
  const result = {};
  fieldNames.forEach(fieldName => {
    result[fieldName] = getTranslatedField(item, fieldName, lang);
  });
  return result;
};

/**
 * Vérifie si un champ arabe existe pour un champ donné
 * 
 * @param {any} item - L'objet contenant les données
 * @param {string} fieldName - Le nom du champ français
 * @returns {boolean} True si un champ arabe existe
 */
export const hasArabicField = (item, fieldName) => {
  if (!item || !fieldName) {
    return false;
  }

  const arabicField = ARABIC_FIELD_MAP[fieldName];
  if (arabicField && item[arabicField]) {
    return true;
  }

  const camelCaseArabe = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Arabe`;
  const lowerCaseArabe = `${fieldName}Arabe`;

  return !!(item[camelCaseArabe] || item[lowerCaseArabe]);
};
