import { useTranslation } from 'react-i18next';
import { getTranslatedField, getTranslatedFields, hasArabicField } from '../utils/translation';

/**
 * Hook React pour faciliter l'utilisation des traductions de champs API
 * 
 * @returns {Object} Objet contenant les fonctions de traduction et la langue actuelle
 * 
 * @example
 * const { t, lang, isRTL } = useTranslationField();
 * 
 * // Dans le JSX
 * <h1>{t(batiment, 'libelleCentre')}</h1>
 * <p>{t(batiment, 'adresse')}</p>
 */
export const useTranslationField = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const isRTL = lang === 'ar';

  /**
   * Fonction de traduction raccourcie
   * @param {any} item - L'objet contenant les données
   * @param {string} fieldName - Le nom du champ français
   * @returns {string} La valeur traduite
   */
  const t = (item, fieldName) => {
    return getTranslatedField(item, fieldName, lang);
  };

  /**
   * Obtient plusieurs champs traduits
   * @param {any} item - L'objet contenant les données
   * @param {string[]} fieldNames - Tableau des noms de champs
   * @returns {Record<string, string>} Objet avec les champs traduits
   */
  const tFields = (item, fieldNames) => {
    return getTranslatedFields(item, fieldNames, lang);
  };

  /**
   * Vérifie si un champ arabe existe
   * @param {any} item - L'objet contenant les données
   * @param {string} fieldName - Le nom du champ français
   * @returns {boolean} True si un champ arabe existe
   */
  const hasArabic = (item, fieldName) => {
    return hasArabicField(item, fieldName);
  };

  return {
    t,
    tFields,
    hasArabic,
    lang,
    isRTL,
    isArabic: isRTL,
  };
};

export default useTranslationField;



