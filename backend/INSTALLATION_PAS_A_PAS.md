# 📦 Installation Pas à Pas : SDK .NET 8.0

## 🎯 Guide Complet avec Toutes les Étapes

---

## **ÉTAPE 1 : Télécharger le SDK .NET 8.0**

### 1.1 Ouvrir votre navigateur web
- Ouvrir Chrome, Edge, Firefox, etc.

### 1.2 Aller sur le site Microsoft
- Taper dans la barre d'adresse : `https://dotnet.microsoft.com/download/dotnet/8.0`
- OU cliquer sur ce lien : https://dotnet.microsoft.com/download/dotnet/8.0
- Appuyer sur **Entrée**

### 1.3 Trouver le SDK
- Sur la page, vous verrez plusieurs options
- Chercher la section **".NET SDK 8.0.x"** (pas Runtime, mais **SDK**)
- Cliquer sur le bouton **"Download"** ou **"Télécharger"**

### 1.4 Choisir la version Windows
- Sélectionner **"Windows x64"** (64 bits)
- Le fichier téléchargé s'appellera quelque chose comme : `dotnet-sdk-8.0.11-win-x64.exe`

### 1.5 Attendre le téléchargement
- Le fichier se télécharge dans votre dossier **Téléchargements** (Downloads)
- Attendre que le téléchargement soit terminé

---

## **ÉTAPE 2 : Installer le SDK**

### 2.1 Trouver le fichier téléchargé
- Aller dans le dossier **Téléchargements**
- Chercher le fichier : `dotnet-sdk-8.0.11-win-x64.exe` (ou similaire)

### 2.2 Lancer l'installation
- **Double-cliquer** sur le fichier `.exe`
- Si Windows demande une confirmation, cliquer sur **"Oui"** ou **"Yes"**

### 2.3 Suivre l'assistant d'installation

#### Écran 1 : Bienvenue
- Cliquer sur **"Next"** ou **"Suivant"**

#### Écran 2 : Accepter les termes
- Cocher **"I agree to the license terms and conditions"**
- Cliquer sur **"Next"** ou **"Suivant"**

#### Écran 3 : Choisir l'emplacement (optionnel)
- Par défaut : `C:\Program Files\dotnet`
- Vous pouvez laisser par défaut
- Cliquer sur **"Next"** ou **"Suivant"**

#### Écran 4 : Installation
- Cliquer sur **"Install"** ou **"Installer"**
- Attendre que la barre de progression atteigne 100%
- Cela peut prendre 2-5 minutes

#### Écran 5 : Installation terminée
- Vous verrez **"Installation completed successfully"**
- Cliquer sur **"Close"** ou **"Fermer"**

---

## **ÉTAPE 3 : Vérifier l'Installation**

### 3.1 Fermer tous les PowerShell ouverts
- Fermer **complètement** toutes les fenêtres PowerShell
- Ne pas juste fermer la fenêtre, fermer complètement

### 3.2 Ouvrir un nouveau PowerShell
- Appuyer sur **Windows + X**
- Cliquer sur **"Windows PowerShell"** ou **"Terminal"**
- OU chercher "PowerShell" dans le menu Démarrer

### 3.3 Tester la commande dotnet
- Dans PowerShell, taper :
  ```powershell
  dotnet --version
  ```
- Appuyer sur **Entrée**

### 3.4 Vérifier le résultat
- Vous devriez voir : `8.0.11` (ou une version similaire comme `8.0.x`)
- ✅ **Si vous voyez un numéro de version** : L'installation a réussi !
- ❌ **Si vous voyez une erreur** : Voir la section "Problèmes" ci-dessous

### 3.5 Vérifier les SDK installés
- Taper :
  ```powershell
  dotnet --list-sdks
  ```
- Vous devriez voir quelque chose comme :
  ```
  8.0.11 [C:\Program Files\dotnet\sdk]
  ```

---

## **ÉTAPE 4 : Tester avec Votre Projet**

### 4.1 Aller dans le dossier de votre projet
```powershell
cd D:\xampp\htdocs\backend_project\dotnet\BackendApi
```

### 4.2 Vérifier que dotnet fonctionne
```powershell
dotnet --version
```

### 4.3 Publier le projet
```powershell
dotnet publish -c Release -o ./publish
```

### 4.4 Lancer l'application
```powershell
cd publish
dotnet BackendApi.dll
```

### 4.5 Tester dans le navigateur
- Ouvrir : `http://localhost:5192/swagger`
- Si la page s'affiche : ✅ **Tout fonctionne !**

---

## 🆘 **PROBLÈMES ET SOLUTIONS**

### Problème 1 : "dotnet n'est pas reconnu" après installation

**Solution :**
1. Fermer **complètement** PowerShell
2. Redémarrer le serveur (recommandé)
3. Rouvrir PowerShell
4. Tester : `dotnet --version`

### Problème 2 : L'installation échoue

**Solution :**
1. Vérifier que vous avez les droits administrateur
2. Désinstaller les anciennes versions de .NET
3. Redémarrer le serveur
4. Réessayer l'installation

### Problème 3 : "Accès refusé" pendant l'installation

**Solution :**
1. Clic droit sur le fichier `.exe`
2. Choisir **"Exécuter en tant qu'administrateur"**
3. Suivre l'installation

### Problème 4 : Le PATH n'est pas mis à jour

**Solution :**
```powershell
# Rafraîchir le PATH dans PowerShell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Tester
dotnet --version
```

---

## ✅ **CHECKLIST FINALE**

- [ ] SDK .NET 8.0 téléchargé
- [ ] SDK .NET 8.0 installé
- [ ] PowerShell fermé et rouvert
- [ ] Commande `dotnet --version` fonctionne
- [ ] Affiche : `8.0.x`
- [ ] Projet publié avec succès
- [ ] Application lancée et accessible

---

## 📝 **RÉSUMÉ RAPIDE**

1. **Télécharger** : https://dotnet.microsoft.com/download/dotnet/8.0 → SDK 8.0 → Windows x64
2. **Installer** : Double-cliquer sur le fichier `.exe` → Suivre l'assistant
3. **Vérifier** : Ouvrir PowerShell → `dotnet --version`
4. **Utiliser** : `dotnet publish` et `dotnet BackendApi.dll`

---

## 🔗 **LIENS UTILES**

- **Téléchargement direct SDK 8.0** : https://dotnet.microsoft.com/download/dotnet/thank-you/sdk-8.0.11-windows-x64-installer
- **Documentation** : https://docs.microsoft.com/dotnet/
- **Support** : https://dotnet.microsoft.com/support

---

## 💡 **ASTUCES**

- ✅ Le SDK inclut tout (runtime + outils), c'est mieux que juste le runtime
- ✅ Vous pouvez avoir plusieurs versions de .NET installées en même temps
- ✅ Après installation, redémarrer le serveur est recommandé
- ✅ Le SDK est automatiquement ajouté au PATH lors de l'installation

