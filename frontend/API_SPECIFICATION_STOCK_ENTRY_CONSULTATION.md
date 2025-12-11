# Spécification API - Consultation des Bons d'Entrée (Stock Entry Consultation)

## Vue d'ensemble

Cette spécification décrit les endpoints nécessaires pour la fonctionnalité de **consultation des bons d'entrée** (قائمة استقبال المنتوجات).

---

## 1. Endpoint : Liste et Détails des Bons d'Entrée (EBE)

### GET /api/liste-stock-entry

Récupère la liste des bons d'entrée (EBE) ou les détails d'un bon d'entrée spécifique selon les paramètres fournis.

**Note importante** : 
- Cette route est séparée de `/api/stock-entry` qui est utilisée pour l'ajout (POST) de nouveaux bons d'entrée.
- La même route est utilisée pour la liste et les détails : si `numlot` est fourni seul, retourner les détails (avec les lignes LPE), sinon retourner la liste.

### Headers Requis
```
Content-Type: application/json
Authorization: Bearer {token}
X-Database-Choice: {database_code}
```

### Paramètres de Requête (Query Parameters)

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `numcentre` | string | Conditionnel* | Numéro du centre (requis pour la liste) |
| `numbat` | string | Conditionnel* | Numéro du bâtiment (requis pour la liste) |
| `numlot` | string | Conditionnel* | Numéro de mouvement (nummvt) - requis pour les détails, optionnel pour la liste |
| `nomBaseStockSession` | string | Oui | Code de la base de données (ex: "OVIPO") |
| `codeuser` | string | Oui | Code de l'utilisateur connecté |
| `database` | string | Non | Code de la base de données (peut être dans les headers) |

**Note** : 
- Pour la **liste** : `numcentre`, `numbat` et `numlot` (optionnel) sont requis
- Pour les **détails** : `numlot` seul est requis (retourne les détails avec les lignes LPE)

### Exemple de Requête - Liste
```
GET /api/liste-stock-entry?numcentre=01&numbat=01&numlot=2501401&nomBaseStockSession=OVIPO&codeuser=USER001
```

### Exemple de Requête - Détails d'un bon d'entrée
```
GET /api/liste-stock-entry?numlot=2501401&nomBaseStockSession=OVIPO&codeuser=USER001
```

### Réponse Succès (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "nummvt": "2501401",
      "numMvt": "2501401",
      "numlot": "LOT001",
      "numLot": "LOT001",
      "codeFournisseur": "FOUR001",
      "libelleFournisseur": "Fournisseur ABC",
      "libtrs": "Fournisseur ABC",
      "dateCreation": "2024-01-15T10:30:00.000Z",
      "date": "2024-01-15",
      "datemaj": "2024-01-15T10:30:00.000Z",
      "numcentre": "01",
      "numbat": "01",
      "codeDep": "DEP001",
      "libDep": "Dépôt Principal",
      "codeuser": "USER001",
      "libusr": "Ahmed Ben Ali",
      "nombreArticles": 5
    },
    {
      "nummvt": "2501402",
      "numMvt": "2501402",
      "numlot": "LOT002",
      "numLot": "LOT002",
      "codeFournisseur": "FOUR002",
      "libelleFournisseur": "Fournisseur XYZ",
      "libtrs": "Fournisseur XYZ",
      "dateCreation": "2024-01-16T14:20:00.000Z",
      "date": "2024-01-16",
      "datemaj": "2024-01-16T14:20:00.000Z",
      "numcentre": "01",
      "numbat": "01",
      "codeDep": "DEP001",
      "libDep": "Dépôt Principal",
      "codeuser": "USER001",
      "libusr": "Ahmed Ben Ali",
      "nombreArticles": 3
    }
  ]
}
```

**Alternatives acceptées pour la structure de réponse :**
- `response.data.entries` (au lieu de `response.data`)
- `response.data.ebe` (au lieu de `response.data`)

### Réponse Erreur (400/500)

```json
{
  "success": false,
  "error": "Message d'erreur",
  "message": "Détails de l'erreur"
}
```

### Notes Importantes

1. **Filtrage** : 
   - Pour la **liste** : Si `numlot` est fourni avec `numcentre` et `numbat`, filtrer les bons d'entrée correspondant à ce numéro de mouvement.
   - Pour les **détails** : Si seul `numlot` est fourni, retourner les détails complets du bon d'entrée avec toutes ses lignes (LPE).
2. **Tri** : Il est recommandé de trier les résultats par date de création (plus récent en premier) ou par nummvt (décroissant).
3. **Pagination** : Pour l'instant, le frontend gère la pagination côté client. Si nécessaire, on pourra ajouter la pagination côté serveur plus tard.

---

## 2. Utilisation de l'Endpoint pour les Détails

Pour récupérer les détails d'un bon d'entrée spécifique (avec les lignes LPE), utilisez le même endpoint `/api/liste-stock-entry` avec uniquement le paramètre `numlot` :

### Exemple de Requête - Détails
```
GET /api/liste-stock-entry?numlot=2501401&nomBaseStockSession=OVIPO&codeuser=USER001
```

**Comportement** : Si seul `numlot` est fourni (sans `numcentre` et `numbat`), l'API doit retourner les détails complets du bon d'entrée avec toutes ses lignes (LPE).

### Réponse Succès (200 OK)

```json
{
  "success": true,
  "data": {
    "nummvt": "2501401",
    "numMvt": "2501401",
    "numlot": "LOT001",
    "numLot": "LOT001",
    "codeFournisseur": "FOUR001",
    "libelleFournisseur": "Fournisseur ABC",
    "libtrs": "Fournisseur ABC",
    "dateCreation": "2024-01-15T10:30:00.000Z",
    "date": "2024-01-15",
    "datemaj": "2024-01-15T10:30:00.000Z",
    "numcentre": "01",
    "numbat": "01",
    "codeDep": "DEP001",
    "libDep": "Dépôt Principal",
    "codeuser": "USER001",
    "libusr": "Ahmed Ben Ali",
    "panierArticles": [
      {
        "pniaer": 1,
        "codeart": "ART001",
        "CodeArt": "ART001",
        "desart": "Aliment pour volaille",
        "libelle": "Aliment pour volaille",
        "Libelle": "Aliment pour volaille",
        "qteart": 100.5,
        "QteArt": 100.5,
        "quantite": 100.5,
        "unite": "KG",
        "Unite": "KG",
        "famille": "003",
        "libfam": "Alimentation",
        "libelleFamille": "Alimentation",
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
        "CodeArt": "ART002",
        "desart": "Médicament vétérinaire",
        "libelle": "Médicament vétérinaire",
        "Libelle": "Médicament vétérinaire",
        "qteart": 50,
        "QteArt": 50,
        "quantite": 50,
        "unite": "UNIT",
        "Unite": "UNIT",
        "famille": "003",
        "libfam": "Alimentation",
        "libelleFamille": "Alimentation",
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
}
```

**Alternatives acceptées pour la structure de réponse :**
- `response.data.articles` (au lieu de `response.data.panierArticles`)
- `response.data.lpe` (au lieu de `response.data.panierArticles`)
- `response.data.data.lpe` (au lieu de `response.data.panierArticles`)
- `response.lpe` (au lieu de `response.data.panierArticles`)

### Réponse Erreur (404 Not Found)

```json
{
  "success": false,
  "error": "Bon d'entrée non trouvé",
  "message": "Aucun bon d'entrée trouvé avec le nummvt: 2501401"
}
```

### Réponse Erreur (400/500)

```json
{
  "success": false,
  "error": "Message d'erreur",
  "message": "Détails de l'erreur"
}
```

### Notes Importantes

1. **Numérotation des lignes** : `pniaer` doit être séquentiel (1, 2, 3, ...).
2. **Compatibilité des champs** : Le frontend accepte plusieurs variantes de noms de champs (ex: `codeart` ou `CodeArt`, `qteart` ou `QteArt`).
3. **Tri** : Les lignes doivent être triées par `pniaer` (ordre croissant).

---

## 3. Endpoints Existants Utilisés

Ces endpoints sont déjà implémentés et utilisés par le frontend :

### GET /api/batiments
Utilisé pour charger la liste des centres (sites).

### GET /api/miseplaces-by-bat
Utilisé pour charger la liste des bâtiments (miseplaces) pour un centre donné.

**Paramètres :**
- `numcentre` : Numéro du centre
- `lotStatus` : Statut du lot (généralement "N")
- `codeuser` : Code de l'utilisateur

**Réponse attendue :**
```json
{
  "success": true,
  "miseplaces": [
    {
      "nummvt": "2501401",
      "numbat": "01",
      "numcentre": "01",
      "libbat": "Bâtiment 1",
      "numlot": "LOT001",
      "numLot": "LOT001",
      ...
    }
  ]
}
```

---

## 4. Structure de Données Recommandée

### Table/Collection : StockEntry (ou équivalent)

Champs recommandés pour stocker les bons d'entrée :

| Champ | Type | Description |
|-------|------|-------------|
| `nummvt` | string | Numéro de mouvement (clé primaire) |
| `numlot` | string | Numéro de lot |
| `numcentre` | string | Numéro du centre |
| `numbat` | string | Numéro du bâtiment |
| `codeFournisseur` | string | Code du fournisseur |
| `libelleFournisseur` | string | Libellé du fournisseur |
| `codeDep` | string | Code du dépôt |
| `libDep` | string | Libellé du dépôt |
| `codeuser` | string | Code de l'utilisateur |
| `libusr` | string | Libellé de l'utilisateur |
| `dateCreation` | datetime | Date de création |
| `nomBaseStockSession` | string | Code de la base de données |

### Table/Collection : StockEntryLines (ou équivalent)

Champs recommandés pour stocker les lignes des bons d'entrée :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | integer/string | Identifiant unique de la ligne |
| `nummvt` | string | Numéro de mouvement (clé étrangère) |
| `pniaer` | integer | Numéro de ligne (1, 2, 3, ...) |
| `codeart` | string | Code de l'article |
| `desart` | string | Description de l'article |
| `qteart` | decimal | Quantité |
| `unite` | string | Unité de mesure |
| `famille` | string | Code de la structure/famille |
| `libfam` | string | Libellé de la structure/famille |
| `codetrs` | string | Code du fournisseur |
| `libtrs` | string | Libellé du fournisseur |
| `codedep` | string | Code du dépôt |
| `libdep` | string | Libellé du dépôt |
| `codeusr` | string | Code de l'utilisateur |
| `libusr` | string | Libellé de l'utilisateur |
| `datemaj` | datetime | Date de mise à jour |

---

## 5. Exemples de Requêtes Complètes

### Exemple 1 : Liste des bons d'entrée pour un centre et bâtiment

```http
GET /api/liste-stock-entry?numcentre=01&numbat=01&numlot=2501401&nomBaseStockSession=OVIPO&codeuser=USER001
Authorization: Bearer {token}
X-Database-Choice: OVIPO
```

**Note** : Le paramètre `numlot` est optionnel pour la liste. S'il est fourni, l'API peut filtrer par ce numéro.

### Exemple 2 : Détails d'un bon d'entrée spécifique

```http
GET /api/liste-stock-entry?numlot=2501401&nomBaseStockSession=OVIPO&codeuser=USER001
Authorization: Bearer {token}
X-Database-Choice: OVIPO
```

**Note** : Quand seul `numlot` est fourni (sans `numcentre` et `numbat`), l'API retourne les détails complets avec les lignes LPE.

---

## 6. Validation et Erreurs

### Validations Requises

1. **GET /api/liste-stock-entry** (Liste) :
   - `numcentre` et `numbat` doivent être fournis
   - `numlot` est optionnel (pour filtrer)
   - `nomBaseStockSession` doit être fourni
   - `codeuser` doit être fourni (code de l'utilisateur connecté)

2. **GET /api/liste-stock-entry** (Détails) :
   - `numlot` doit être fourni (sans `numcentre` et `numbat`)
   - `nomBaseStockSession` doit être fourni
   - `codeuser` doit être fourni (code de l'utilisateur connecté)
   - Le bon d'entrée doit exister

### Codes de Statut HTTP

- **200 OK** : Requête réussie
- **400 Bad Request** : Paramètres invalides ou manquants
- **401 Unauthorized** : Token manquant ou invalide
- **404 Not Found** : Bon d'entrée non trouvé (quand `numlot` est fourni seul pour les détails)
- **500 Internal Server Error** : Erreur serveur

---

## 7. Notes de Développement

1. **Performance** : Pour de grandes quantités de données, envisager d'ajouter la pagination côté serveur.
2. **Cache** : Considérer la mise en cache des listes de bons d'entrée pour améliorer les performances.
3. **Indexation** : S'assurer que les champs `numcentre`, `numbat`, et `nummvt` sont indexés dans la base de données.
4. **Sécurité** : Vérifier que l'utilisateur a les permissions nécessaires pour consulter les bons d'entrée du centre/bâtiment sélectionné.

---

## 8. Checklist pour le Backend

- [ ] Implémenter `GET /api/liste-stock-entry` pour la liste (avec numcentre, numbat, numlot optionnel)
- [ ] Implémenter `GET /api/liste-stock-entry` pour les détails (avec numlot seul - retourne les lignes LPE)
- [ ] Détecter le mode (liste ou détails) selon les paramètres fournis
- [ ] S'assurer que `/api/stock-entry` reste dédié uniquement à l'ajout (POST)
- [ ] Retourner les données dans le format JSON spécifié
- [ ] Gérer les erreurs et retourner les codes HTTP appropriés
- [ ] Valider les paramètres d'entrée
- [ ] Vérifier les permissions utilisateur
- [ ] Tester avec différents scénarios (avec/sans nummvt, données vides, etc.)
- [ ] Documenter les endpoints dans Swagger/OpenAPI si disponible

---

**Date de création** : 2024
**Version** : 1.0
**Auteur** : Spécification pour le frontend React

