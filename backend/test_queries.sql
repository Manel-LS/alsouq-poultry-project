-- ============================================
-- REQUÊTES DE TEST POUR ebe et lbe
-- Paramètres: numlot=2400007, codeuser=04
-- Base de données: POND
-- ============================================

-- 1. Vérifier si la colonne libarabe existe dans ebe
SELECT COUNT(*) as count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'POND'
AND TABLE_NAME = 'ebe'
AND COLUMN_NAME = 'libarabe';

-- 2. REQUÊTE PRINCIPALE - Récupérer les bons d'entrée depuis ebe
-- Version avec libarabe dans ebe (si la colonne existe)
SELECT DISTINCT
    e.nummvt,
    e.datemvt,
    e.codetrs AS codeFournisseur,
    e.libtrs AS libelleFournisseur,
    e.usera AS codeuser,
    e.datemaj,
    e.numaffaire,
    (SELECT l.numlot FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS numlot,
    (SELECT l.codedep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS codeDep,
    (SELECT l.libdep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS libDep,
    (SELECT COUNT(*) FROM lbe l WHERE l.nummvt = e.nummvt) AS nombreArticles,
    IFNULL(e.libarabe, '') AS libarabeFournisseur
FROM ebe e
WHERE 1=1
    AND EXISTS (
        SELECT 1 FROM lbe l 
        WHERE l.nummvt = e.nummvt 
        AND l.numlot = '2400007'
    )
    AND e.usera = '04'
ORDER BY e.datemvt DESC, e.nummvt DESC;

-- 2b. Version alternative si libarabe n'existe pas dans ebe (joindre avec fournisseur)
-- Décommentez cette requête si la colonne libarabe n'existe pas dans ebe
/*
SELECT DISTINCT
    e.nummvt,
    e.datemvt,
    e.codetrs AS codeFournisseur,
    e.libtrs AS libelleFournisseur,
    e.usera AS codeuser,
    e.datemaj,
    e.numaffaire,
    (SELECT l.numlot FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS numlot,
    (SELECT l.codedep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS codeDep,
    (SELECT l.libdep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS libDep,
    (SELECT COUNT(*) FROM lbe l WHERE l.nummvt = e.nummvt) AS nombreArticles,
    IFNULL(f.libarabe, '') AS libarabeFournisseur
FROM ebe e
LEFT JOIN fournisseur f ON f.code = e.codetrs
WHERE 1=1
    AND EXISTS (
        SELECT 1 FROM lbe l 
        WHERE l.nummvt = e.nummvt 
        AND l.numlot = '2400007'
    )
    AND e.usera = '04'
ORDER BY e.datemvt DESC, e.nummvt DESC;
*/

-- 3. Vérifier si la colonne libarabe existe dans lbe
SELECT COUNT(*) as count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'POND'
AND TABLE_NAME = 'lbe'
AND COLUMN_NAME = 'libarabe';

-- 4. Récupérer les lignes lbe pour un nummvt spécifique
-- Remplacez 'VOTRE_NUMMVT' par un nummvt réel trouvé dans la requête précédente
-- Version avec libarabe dans lbe (si la colonne existe)
SELECT 
    codeart,
    desart,
    IFNULL(libarabe, '') AS libarabe,
    datemvt,
    qteart,
    unite,
    nligne
FROM lbe
WHERE nummvt = 'VOTRE_NUMMVT'
ORDER BY nligne;

-- 4b. Version alternative si libarabe n'existe pas dans lbe
-- Décommentez cette requête si la colonne libarabe n'existe pas dans lbe
/*
SELECT 
    codeart,
    desart,
    '' AS libarabe,
    datemvt,
    qteart,
    unite,
    nligne
FROM lbe
WHERE nummvt = 'VOTRE_NUMMVT'
ORDER BY nligne;
*/

-- 5. Requête complète avec JOIN pour voir toutes les données ensemble
SELECT 
    e.nummvt,
    e.datemvt AS dateMvtEbe,
    e.codetrs,
    e.libtrs,
    e.usera,
    e.datemaj,
    l.numlot,
    l.codedep,
    l.libdep,
    l.codeart,
    l.desart,
    l.datemvt AS dateMvtLbe,
    l.qteart,
    l.unite,
    l.nligne
FROM ebe e
INNER JOIN lbe l ON l.nummvt = e.nummvt
WHERE 1=1
    AND l.numlot = '2400007'
    AND e.usera = '04'
ORDER BY e.datemvt DESC, e.nummvt DESC, l.nligne ASC;

-- 6. Compter le nombre de lignes lbe pour chaque nummvt
SELECT 
    e.nummvt,
    COUNT(l.numlot) AS nombreLignesLbe
FROM ebe e
LEFT JOIN lbe l ON l.nummvt = e.nummvt
WHERE 1=1
    AND EXISTS (
        SELECT 1 FROM lbe l2 
        WHERE l2.nummvt = e.nummvt 
        AND l2.numlot = '2400007'
    )
    AND e.usera = '04'
GROUP BY e.nummvt
ORDER BY e.nummvt DESC;

-- 7. Récupérer les informations du dépôt (pour chaque codeDep trouvé)
-- Remplacez 'VOTRE_CODE_DEP' par un codeDep réel trouvé dans les requêtes précédentes
SELECT Code, Libelle 
FROM depot 
WHERE Code = 'VOTRE_CODE_DEP' 
LIMIT 1;

-- 8. Récupérer les informations de l'utilisateur
SELECT code, libelle 
FROM utilisateur 
WHERE code = '04' 
LIMIT 1;

