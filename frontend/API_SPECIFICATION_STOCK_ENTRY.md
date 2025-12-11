# Spécification API - Entrée de Stock (Stock Entry)

## Endpoint
```
POST /api/stock-entry
```

## Headers Requis
```
Content-Type: application/json
Authorization: Bearer {token}
X-Database-Choice: {database_code}
```

## Body de la Requête

### Structure Principale
```json
{
  "nummvt": "string (requis)",
  "codeDep": "string (requis)",
  "numcentre": "string (requis)",
  "numbat": "string (requis)",
  "numLot": "string (optionnel)",
  "codeFournisseur": "string (requis)",
  "codeuser": "string (requis)",
  "nomBaseStockSession": "string (requis)",
  "panierArticles": [
    {
      "pniaer": "integer (requis) - Numéro de ligne, commence à 1",
      "codeart": "string (requis) - Code de l'article",
      "desart": "string (requis) - Description/libellé de l'article",
      "qteart": "number (requis) - Quantité (>= 0)",
      "unite": "string (requis) - Unité de mesure",
      "famille": "string (requis) - Code de la structure/famille",
      "libfam": "string (requis) - Libellé de la structure/famille",
      "codetrs": "string (requis) - Code du fournisseur",
      "libtrs": "string (requis) - Libellé du fournisseur",
      "codedep": "string (requis) - Code du dépôt",
      "libdep": "string (requis) - Libellé du dépôt",
      "codeusr": "string (requis) - Code de l'utilisateur connecté",
      "libusr": "string (requis) - Libellé/nom de l'utilisateur connecté",
      "datemaj": "string (requis) - Date de mise à jour au format ISO 8601"
    }
  ]
}
```

### Exemple de Requête Complète
```json
{
  "nummvt": "12345",
  "codeDep": "DEP001",
  "numcentre": "01",
  "numbat": "01",
  "numLot": "LOT001",
  "codeFournisseur": "FOUR001",
  "codeuser": "USER001",
  "nomBaseStockSession": "OVIPO",
  "panierArticles": [
    {
      "pniaer": 1,
      "codeart": "ART001",
      "desart": "Aliment pour volaille",
      "qteart": 100.5,
      "unite": "KG",
      "famille": "003",
      "libfam": "Alimentation",
      "codetrs": "FOUR001",
      "libtrs": "Fournisseur ABC",
      "codedep": "DEP001",
      "libdep": "Dépôt Principal",
      "codeusr": "USER001",
      "libusr": "Ahmed Ben Ali",
      "datemaj": "2024-01-15T10:30:00.000Z"
    },
    {
      "pniaer": 2,
      "codeart": "ART002",
      "desart": "Médicament vétérinaire",
      "qteart": 50,
      "unite": "UNIT",
      "famille": "003",
      "libfam": "Alimentation",
      "codetrs": "FOUR001",
      "libtrs": "Fournisseur ABC",
      "codedep": "DEP001",
      "libdep": "Dépôt Principal",
      "codeusr": "USER001",
      "libusr": "Ahmed Ben Ali",
      "datemaj": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Validations Requises

### Niveau Principal
- `nummvt` : **REQUIS**, non vide, string
- `codeDep` : **REQUIS**, non vide, string
- `numcentre` : **REQUIS**, non vide, string
- `numbat` : **REQUIS**, non vide, string
- `codeFournisseur` : **REQUIS**, non vide, string
- `codeuser` : **REQUIS**, non vide, string
- `nomBaseStockSession` : **REQUIS**, non vide, string
- `panierArticles` : **REQUIS**, array non vide (au moins 1 article)

### Niveau Articles (panierArticles)
Pour chaque article :
- `pniaer` : **REQUIS**, integer > 0, unique dans le tableau
- `codeart` : **REQUIS**, non vide, string
- `desart` : **REQUIS**, non vide, string
- `qteart` : **REQUIS**, number >= 0
- `unite` : **REQUIS**, non vide, string
- `famille` : **REQUIS**, non vide, string
- `libfam` : **REQUIS**, non vide, string
- `codetrs` : **REQUIS**, non vide, string
- `libtrs` : **REQUIS**, non vide, string
- `codedep` : **REQUIS**, non vide, string
- `libdep` : **REQUIS**, non vide, string
- `codeusr` : **REQUIS**, non vide, string
- `libusr` : **REQUIS**, non vide, string
- `datemaj` : **REQUIS**, format ISO 8601 valide

## Réponse Succès (200 OK)
```json
{
  "success": true,
  "message": "تم حفظ المدخلات بنجاح",
  "data": {
    "id": "transaction_id",
    "nummvt": "12345",
    "nombreArticles": 2,
    "dateCreation": "2024-01-15T10:30:00.000Z"
  }
}
```

## Réponse Erreur (400 Bad Request)
```json
{
  "success": false,
  "error": "One or more validation errors occurred.",
  "errors": {
    "nummvt": ["The nummvt field is required."],
    "panierArticles[0].codeart": ["The codeart field is required."]
  },
  "status": 400,
  "title": "One or more validation errors occurred.",
  "traceId": "00-xxxxx-xxxxx-00"
}
```

## Réponse Erreur (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Erreur lors de la sauvegarde en base de données",
  "message": "Détails de l'erreur technique",
  "status": 500
}
```

## Notes Importantes

1. **Format de Date** : `datemaj` doit être au format ISO 8601 (ex: "2024-01-15T10:30:00.000Z")

2. **Numérotation** : `pniaer` doit commencer à 1 et être séquentiel (1, 2, 3, ...)

3. **Cohérence des Données** :
   - `codetrs` dans chaque article doit correspondre à `codeFournisseur` au niveau principal
   - `codedep` dans chaque article doit correspondre à `codeDep` au niveau principal
   - `codeusr` dans chaque article doit correspondre à `codeuser` au niveau principal

4. **Base de Données** : Le backend doit utiliser `nomBaseStockSession` pour déterminer quelle base de données utiliser

5. **Transaction** : Il est recommandé que la sauvegarde soit transactionnelle (tout ou rien)

6. **Logs** : Enregistrer toutes les entrées de stock pour traçabilité

## Endpoint Complémentaire (Optionnel)

### GET /api/stock-entry/{nummvt}
Pour récupérer les entrées de stock d'un mouvement spécifique

```json
{
  "success": true,
  "data": {
    "nummvt": "12345",
    "dateCreation": "2024-01-15T10:30:00.000Z",
    "articles": [
      {
        "pniaer": 1,
        "codeart": "ART001",
        "desart": "Aliment pour volaille",
        "qteart": 100.5,
        "unite": "KG",
        // ... autres champs
      }
    ]
  }
}
```



