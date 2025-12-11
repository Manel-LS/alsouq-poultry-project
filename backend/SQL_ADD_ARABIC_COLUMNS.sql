-- Script SQL pour ajouter les colonnes arabes aux tables
-- Exécutez ce script dans votre base de données pour ajouter les colonnes de traduction

-- Table: espece
ALTER TABLE espece 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER libelle;

-- Table: batiment
ALTER TABLE batiment 
ADD COLUMN IF NOT EXISTS libcentarabe VARCHAR(255) DEFAULT '' AFTER libelleCentre,
ADD COLUMN IF NOT EXISTS adrarabe VARCHAR(255) DEFAULT '' AFTER adresse,
ADD COLUMN IF NOT EXISTS libbatarabe VARCHAR(255) DEFAULT '' AFTER libellebat;

-- Table: miseplace
ALTER TABLE miseplace 
ADD COLUMN IF NOT EXISTS libesparabe VARCHAR(255) DEFAULT '' AFTER libesp,
ADD COLUMN IF NOT EXISTS libcentarabe VARCHAR(255) DEFAULT '' AFTER libcentre,
ADD COLUMN IF NOT EXISTS libbatarabe VARCHAR(255) DEFAULT '' AFTER libbat;

-- Table: stockdepot
ALTER TABLE stockdepot 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER desart,
ADD COLUMN IF NOT EXISTS unitearabe VARCHAR(50) DEFAULT '' AFTER unite;

-- Table: lmvt (libarabe existe peut-être déjà)
ALTER TABLE lmvt 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER desart;

-- Table: fournisseur
ALTER TABLE fournisseur 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER libelle;

-- Table: ebe
ALTER TABLE ebe 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER libtrs;

-- Table: lbe
ALTER TABLE lbe 
ADD COLUMN IF NOT EXISTS libarabe VARCHAR(255) DEFAULT '' AFTER desart,
ADD COLUMN IF NOT EXISTS libtrsarabe VARCHAR(255) DEFAULT '' AFTER libtrs;



