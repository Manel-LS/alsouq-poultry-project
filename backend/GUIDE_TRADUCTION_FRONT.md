# Guide d'utilisation des champs de traduction (Français/Arabe) - Front-End

## Vue d'ensemble

Tous les endpoints API retournent maintenant les champs en français ET en arabe. Le front-end doit sélectionner le bon champ selon la langue choisie par l'utilisateur.

## Structure des champs

Pour chaque entité, vous avez :
- **Champ français** : le champ original (ex: `libelle`, `libelleCentre`, `adresse`)
- **Champ arabe** : le champ correspondant avec suffixe `arabe` ou `Arabe` (ex: `libarabe`, `libcentarabe`, `adrarabe`)

## Mapping des champs par table

### 1. Table `espece`
- **Français** : `libelle`
- **Arabe** : `libarabe`

### 2. Table `batiment`
- **Français** : `libelleCentre` → **Arabe** : `libcentarabe`
- **Français** : `adresse` → **Arabe** : `adrarabe`
- **Français** : `libellebat` → **Arabe** : `libbatarabe`

### 3. Table `miseplace`
- **Français** : `libesp` → **Arabe** : `libesparabe`
- **Français** : `libcentre` → **Arabe** : `libcentarabe`
- **Français** : `libbat` → **Arabe** : `libbatarabe`

### 4. Table `stockdepot`
- **Français** : `desart` → **Arabe** : `libarabe`
- **Français** : `unite` → **Arabe** : `unitearabe`

### 5. Table `lmvt`
- **Français** : `desart` → **Arabe** : `libarabe`

### 6. Table `fournisseur`
- **Français** : `libelle` → **Arabe** : `libarabe`

---

## Endpoints et champs retournés

### 1. GET `/api/batiments`
**Réponse :**
```json
{
  "success": true,
  "batiments": [
    {
      "codecli": "...",
      "numcentre": "...",
      "libelleCentre": "Centre 1",        // FR
      "libcentarabe": "المركز 1",         // AR
      "adresse": "123 Rue...",            // FR
      "adrarabe": "123 شارع...",          // AR
      "numbat": "...",
      "libellebat": "Bâtiment A",         // FR
      "libbatarabe": "المبنى أ"           // AR
    }
  ]
}
```

**Utilisation front :**
```javascript
const getLabel = (item, field, lang) => {
  if (lang === 'ar') {
    const arabicField = {
      'libelleCentre': 'libcentarabe',
      'adresse': 'adrarabe',
      'libellebat': 'libbatarabe'
    }[field];
    return item[arabicField] || item[field];
  }
  return item[field];
};

// Exemple
const centreLabel = getLabel(batiment, 'libelleCentre', currentLang);
```

---

### 2. GET `/api/batiments-avec-miseplace`
**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "NumCentre": "...",
      "LibelleCentre": "Centre 1",        // FR
      "LibCentarabe": "المركز 1",         // AR
      "Adresse": "123 Rue...",            // FR
      "Adrarabe": "123 شارع...",          // AR
      "LibelleBatiment": "Bâtiment A",    // FR
      "LibBatarabe": "المبنى أ",          // AR
      "Miseplaces": [
        {
          "LibEspece": "Poulet",          // FR
          "LibEesparabe": "دجاج",          // AR
          "MpLibCentarabe": "المركز 1",    // AR (du centre)
          "MpLibBatarabe": "المبنى أ"      // AR (du bâtiment)
        }
      ]
    }
  ]
}
```

---

### 3. GET `/api/miseplaces`
**Réponse :**
```json
{
  "success": true,
  "miseplaces": [
    {
      "code": "...",
      "libelle": "Centre 1",             // FR (libcentre)
      "numcentre": "...",
      "codefact": "...",
      "libesparabe": "دجاج",              // AR (pour libesp)
      "libcentarabe": "المركز 1",          // AR (pour libcentre)
      "libbatarabe": "المبنى أ"            // AR (pour libbat)
    }
  ]
}
```

---

### 4. GET `/api/fournisseurs`
**Réponse :**
```json
{
  "success": true,
  "fournisseurs": [
    {
      "code": "F001",
      "libelle": "Fournisseur ABC",       // FR
      "libarabe": "المورد ABC",            // AR
      "adresse": "...",
      "tel1": "..."
    }
  ]
}
```

---

### 5. GET `/api/liste-stock-entry`
**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "nummvt": "...",
      "codeFournisseur": "F001",
      "libelleFournisseur": "Fournisseur ABC",    // FR
      "libarabeFournisseur": "المورد ABC",         // AR
      "libtrs": "Fournisseur ABC",                 // FR (alias)
      // ... autres champs
    }
  ]
}
```

---

### 6. GET `/api/detail-stock-entry/{nummvt}`
**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "codeart": "A001",
      "desart": "Article 1",              // FR
      "libarabe": "المادة 1",              // AR
      "unite": "KG",                       // FR
      "unitearabe": "كجم",                 // AR
      // ... autres champs
    }
  ]
}
```

---

### 7. GET `/api/lmvt?nummvt=XXX`
**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "CodeArt": "A001",
      "Qte": 100,
      "Libarabe": "المادة 1"              // AR (pour desart)
    }
  ]
}
```

---

### 8. GET `/api/inventory` (BatimentController)
**Réponse :**
```json
{
  "success": true,
  "inventory": [
    {
      "Codeart": "A001",
      "Desart": "Article 1",              // FR
      "Libarabe": "المادة 1",              // AR
      "Unite": "KG",                       // FR
      "UniteArabe": "كجم"                  // AR
    }
  ]
}
```

---

### 9. GET `/api/lot/{numLot}/jour-en-cours` (LotController)
**Réponse :**
```json
{
  "tespece": "Poulet",                     // FR
  "tespecearabe": "دجاج",                  // AR
  // ... autres champs
}
```

---

## Fonction utilitaire recommandée pour le front-end

### Exemple React/TypeScript

```typescript
// types.ts
export type Language = 'fr' | 'ar';

// utils/translation.ts
export const getTranslatedField = (
  item: any,
  fieldName: string,
  lang: Language
): string => {
  if (lang === 'ar') {
    // Mapping des champs français vers arabes
    const arabicFieldMap: Record<string, string> = {
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
      
      // StockDepot / Lmvt
      'desart': 'libarabe',
      'Desart': 'Libarabe',
      'unite': 'unitearabe',
      'Unite': 'UniteArabe',
      
      // Fournisseur
      'libelleFournisseur': 'libarabeFournisseur',
      'libtrs': 'libarabeFournisseur'
    };
    
    const arabicField = arabicFieldMap[fieldName] || `${fieldName}Arabe`;
    return item[arabicField] || item[fieldName] || '';
  }
  
  return item[fieldName] || '';
};

// Utilisation dans un composant
const MyComponent = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [batiment, setBatiment] = useState<any>(null);
  
  return (
    <div>
      <h1>{getTranslatedField(batiment, 'libelleCentre', lang)}</h1>
      <p>{getTranslatedField(batiment, 'adresse', lang)}</p>
      <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>
        {lang === 'fr' ? 'العربية' : 'Français'}
      </button>
    </div>
  );
};
```

---

### Exemple Vue.js

```javascript
// composables/useTranslation.js
export const useTranslation = (lang) => {
  const t = (item, field) => {
    if (lang.value === 'ar') {
      const arabicFields = {
        'libelleCentre': 'libcentarabe',
        'adresse': 'adrarabe',
        'libellebat': 'libbatarabe',
        'libelle': 'libarabe',
        'desart': 'libarabe',
        'unite': 'unitearabe',
        // ... autres mappings
      };
      const arabicField = arabicFields[field] || `${field}Arabe`;
      return item[arabicField] || item[field] || '';
    }
    return item[field] || '';
  };
  
  return { t };
};

// Dans un composant
<script setup>
import { ref } from 'vue';
import { useTranslation } from '@/composables/useTranslation';

const lang = ref('fr');
const { t } = useTranslation(lang);
const batiment = ref({
  libelleCentre: 'Centre 1',
  libcentarabe: 'المركز 1',
  // ...
});
</script>

<template>
  <div>
    <h1>{{ t(batiment, 'libelleCentre') }}</h1>
    <button @click="lang = lang === 'fr' ? 'ar' : 'fr'">
      {{ lang === 'fr' ? 'العربية' : 'Français' }}
    </button>
  </div>
</template>
```

---

## Exemple complet : Liste des bâtiments

```typescript
// Composant React
import { useState, useEffect } from 'react';
import axios from 'axios';

type Language = 'fr' | 'ar';

const BatimentList = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [batiments, setBatiments] = useState([]);
  
  useEffect(() => {
    axios.get('/api/batiments', {
      params: { codeuser: 'USER001' }
    })
    .then(res => setBatiments(res.data.batiments));
  }, []);
  
  const getField = (item: any, field: string) => {
    if (lang === 'ar') {
      const arabicFields: Record<string, string> = {
        'libelleCentre': 'libcentarabe',
        'adresse': 'adrarabe',
        'libellebat': 'libbatarabe'
      };
      return item[arabicFields[field]] || item[field] || '';
    }
    return item[field] || '';
  };
  
  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>
          {lang === 'fr' ? 'العربية' : 'Français'}
        </button>
      </div>
      
      <div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        {batiments.map(bat => (
          <div key={bat.numbat} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
            <h2>{getField(bat, 'libelleCentre')}</h2>
            <p><strong>Adresse:</strong> {getField(bat, 'adresse')}</p>
            <p><strong>Bâtiment:</strong> {getField(bat, 'libellebat')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatimentList;
```

---

## Points importants

1. **Fallback** : Si le champ arabe est vide ou n'existe pas, utilisez le champ français comme fallback
2. **Direction RTL** : N'oubliez pas d'appliquer `direction: rtl` pour l'arabe
3. **Stockage de la langue** : Utilisez localStorage ou un contexte global pour persister le choix de langue
4. **Tous les endpoints** : Tous les endpoints retournent maintenant les deux versions (FR et AR)

---

## Checklist d'implémentation

- [ ] Créer une fonction utilitaire `getTranslatedField(item, field, lang)`
- [ ] Créer un contexte/state global pour la langue
- [ ] Mapper tous les champs selon le tableau ci-dessus
- [ ] Ajouter un sélecteur de langue dans l'interface
- [ ] Appliquer `direction: rtl` pour l'arabe
- [ ] Tester tous les endpoints avec les deux langues
- [ ] Gérer le fallback si le champ arabe est vide

---

## Support

Si un champ arabe manque dans une réponse API, vérifiez que :
1. La colonne existe dans la base de données
2. L'endpoint inclut bien le champ dans sa requête SQL
3. Le mapping dans votre fonction utilitaire est correct

