# Exemples d'utilisation des champs de traduction - Front-End

## Fichiers inclus

1. **translation-helper.js** - Fonction utilitaire réutilisable
2. **React-Example.jsx** - Exemples d'utilisation dans React
3. **Vue-Example.vue** - Exemples d'utilisation dans Vue.js

## Installation rapide

### 1. Copier le helper

Copiez `translation-helper.js` dans votre projet front-end.

### 2. Utilisation basique

```javascript
import { getTranslatedField } from './utils/translation-helper';

// Dans votre composant
const libelle = getTranslatedField(batiment, 'libelleCentre', 'ar');
// Retourne: "المركز 1" si lang='ar', sinon "Centre 1"
```

## Mapping rapide des champs

| Champ Français | Champ Arabe | Table |
|---------------|-------------|-------|
| `libelle` | `libarabe` | espece, fournisseur |
| `libelleCentre` | `libcentarabe` | batiment |
| `adresse` | `adrarabe` | batiment |
| `libellebat` | `libbatarabe` | batiment |
| `libesp` | `libesparabe` | miseplace |
| `desart` | `libarabe` | stockdepot, lmvt |
| `unite` | `unitearabe` | stockdepot |

## Exemples par endpoint

### GET `/api/batiments`
```javascript
// Réponse API
{
  "libelleCentre": "Centre 1",      // FR
  "libcentarabe": "المركز 1",      // AR
  "adresse": "123 Rue...",         // FR
  "adrarabe": "123 شارع...",       // AR
  "libellebat": "Bâtiment A",      // FR
  "libbatarabe": "المبنى أ"        // AR
}

// Utilisation
const centre = getTranslatedField(batiment, 'libelleCentre', lang);
const adresse = getTranslatedField(batiment, 'adresse', lang);
const batiment = getTranslatedField(batiment, 'libellebat', lang);
```

### GET `/api/fournisseurs`
```javascript
// Réponse API
{
  "libelle": "Fournisseur ABC",    // FR
  "libarabe": "المورد ABC"         // AR
}

// Utilisation
const nom = getTranslatedField(fournisseur, 'libelle', lang);
```

### GET `/api/detail-stock-entry/{nummvt}`
```javascript
// Réponse API
{
  "desart": "Article 1",           // FR
  "libarabe": "المادة 1",          // AR
  "unite": "KG",                   // FR
  "unitearabe": "كجم"              // AR
}

// Utilisation
const article = getTranslatedField(line, 'desart', lang);
const unite = getTranslatedField(line, 'unite', lang);
```

## Gestion de la langue

### React
```javascript
const [lang, setLang] = useState('fr');

// Sauvegarder dans localStorage
useEffect(() => {
  localStorage.setItem('lang', lang);
}, [lang]);
```

### Vue.js
```javascript
const lang = ref('fr');

// Sauvegarder dans localStorage
watch(lang, (newLang) => {
  localStorage.setItem('lang', newLang);
});
```

## Direction RTL pour l'arabe

N'oubliez pas d'appliquer la direction RTL pour l'arabe :

```css
.arabic {
  direction: rtl;
  text-align: right;
}
```

Ou dans le style inline :
```javascript
<div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
```

## Checklist

- [ ] Importer `getTranslatedField` dans vos composants
- [ ] Créer un state/ref pour la langue
- [ ] Ajouter un sélecteur de langue
- [ ] Appliquer `direction: rtl` pour l'arabe
- [ ] Utiliser `getTranslatedField` pour tous les champs affichés
- [ ] Sauvegarder la langue dans localStorage

