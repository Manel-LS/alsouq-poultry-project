# Scripts PowerShell pour BackendApi

Ce dossier contient plusieurs scripts PowerShell pour faciliter le développement et le déploiement de l'API BackendApi.

## 📋 Scripts Disponibles

### 1. `setup.ps1` - Configuration Initiale
Vérifie les prérequis et configure l'environnement.

**Usage:**
```powershell
.\setup.ps1
```

**Fonctions:**
- ✅ Vérifie si .NET SDK 8.0 est installé
- ✅ Crée le dossier `wwwroot` si nécessaire
- ✅ Vérifie la présence de `appsettings.json`

---

### 2. `run-project.ps1` - Build & Run
Build et exécute le projet en mode Debug ou Release.

**Usage:**
```powershell
# Mode Release (par défaut)
.\run-project.ps1

# Mode Debug
.\run-project.ps1 -Configuration Debug

# Mode Release explicite
.\run-project.ps1 -Configuration Release
```

**Fonctions:**
- ✅ Restaure les packages NuGet
- ✅ Build le projet
- ✅ Démarre l'API sur http://localhost:5192
- ✅ Affiche les liens Swagger

---

### 3. `publish-and-run.ps1` - Publish & Run (Production)
Publie le projet et l'exécute en mode production.

**Usage:**
```powershell
.\publish-and-run.ps1
```

**Fonctions:**
- ✅ Restaure les packages NuGet
- ✅ Publie le projet en mode Release dans `./publish`
- ✅ Exécute la version publiée
- ✅ Nettoie l'ancien dossier publish avant de publier

---

### 4. `stop-api.ps1` - Arrêter l'API
Arrête tous les processus BackendApi en cours d'exécution.

**Usage:**
```powershell
.\stop-api.ps1
```

**Fonctions:**
- ✅ Trouve et arrête tous les processus dotnet exécutant BackendApi
- ✅ Libère le port 5192 si utilisé

---

### 5. `check-status.ps1` - Vérifier le Statut
Vérifie le statut de l'environnement et de l'API.

**Usage:**
```powershell
.\check-status.ps1
```

**Fonctions:**
- ✅ Vérifie la version de .NET SDK
- ✅ Vérifie les fichiers du projet
- ✅ Vérifie si l'API est en cours d'exécution
- ✅ Affiche les processus dotnet actifs
- ✅ Vérifie l'utilisation du port 5192

---

### 6. `start-api-background.ps1` - Démarrer en Arrière-plan ⭐ NOUVEAU
Démarre l'API en arrière-plan. **L'API continuera de tourner même après fermeture de Visual Studio ou du terminal.**

**Usage:**
```powershell
.\start-api-background.ps1
```

**Fonctions:**
- ✅ Build le projet
- ✅ Démarre l'API en arrière-plan
- ✅ Sauvegarde le PID dans `api-background.pid`
- ✅ L'API reste active même après fermeture de Visual Studio
- ✅ Crée un fichier de log `api-background.log`

**Important:** Pour arrêter l'API lancée en arrière-plan, utilisez `.\stop-api.ps1`

---

### 7. `start-api-service.ps1` - Créer un Service Windows ⭐ NOUVEAU
Crée un service Windows pour que l'API démarre automatiquement au démarrage de Windows.

**Usage:**
```powershell
# Nécessite les droits administrateur
.\start-api-service.ps1
```

**Fonctions:**
- ✅ Publie le projet
- ✅ Crée un service Windows
- ✅ L'API démarre automatiquement au démarrage de Windows
- ✅ Supporte NSSM (recommandé) ou sc.exe

**Commandes pour gérer le service:**
```powershell
Start-Service -Name BackendApi    # Démarrer
Stop-Service -Name BackendApi     # Arrêter
Get-Service -Name BackendApi      # Vérifier le statut
sc.exe delete BackendApi          # Supprimer le service
```

---

## 🚀 Workflow Recommandé

### Premier démarrage
```powershell
# 1. Configuration initiale
.\setup.ps1

# 2. Vérifier le statut
.\check-status.ps1

# 3. Démarrer l'API
.\run-project.ps1
```

### Développement quotidien

**Option 1: Mode normal (s'arrête avec Visual Studio)**
```powershell
# Démarrer l'API en mode Debug
.\run-project.ps1 -Configuration Debug

# Dans un autre terminal, vérifier le statut
.\check-status.ps1

# Arrêter l'API quand nécessaire
.\stop-api.ps1
```

**Option 2: Mode arrière-plan (reste actif après fermeture de Visual Studio) ⭐ RECOMMANDÉ**
```powershell
# Démarrer l'API en arrière-plan
.\start-api-background.ps1

# L'API continue de tourner même après fermeture de Visual Studio
# Le frontend peut toujours accéder à l'API

# Vérifier le statut
.\check-status.ps1

# Arrêter l'API quand nécessaire
.\stop-api.ps1
```

### Déploiement en production
```powershell
# Publier et exécuter
.\publish-and-run.ps1
```

---

## ⚙️ Configuration

### Variables d'environnement
Les scripts utilisent les configurations par défaut. Pour personnaliser :

1. **Port de l'API** : Modifiez `Properties/launchSettings.json`
2. **Configuration MySQL** : Modifiez `appsettings.json`
3. **Mode d'exécution** : Utilisez le paramètre `-Configuration`

---

## 🔧 Dépannage

### Erreur: "Script cannot be loaded because running scripts is disabled"
```powershell
# Exécuter en tant qu'administrateur
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur: "Port 5192 already in use"
```powershell
# Arrêter l'API
.\stop-api.ps1

# Ou tuer le processus manuellement
Get-NetTCPConnection -LocalPort 5192 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

### Erreur: ".NET SDK not found"
Installez .NET SDK 8.0 depuis : https://dotnet.microsoft.com/download/dotnet/8.0

---

## 📝 Notes

- Tous les scripts doivent être exécutés depuis le dossier racine du projet (`BackendApi`)
- Les scripts affichent des messages colorés pour faciliter la lecture
- Les erreurs sont affichées en rouge, les succès en vert
- Le dossier `wwwroot` est créé automatiquement si nécessaire

---

---

## 🎯 Solution au Problème: Frontend ne voit pas le Backend après fermeture de Visual Studio

### Problème
Quand vous arrêtez Visual Studio ou fermez le terminal, le processus `dotnet run` s'arrête aussi, donc le frontend ne peut plus accéder à l'API.

### Solution 1: Démarrer en arrière-plan (Recommandé pour développement)
```powershell
# Dans un terminal PowerShell séparé
.\start-api-background.ps1
```

**Avantages:**
- ✅ L'API continue de tourner même après fermeture de Visual Studio
- ✅ Le frontend peut toujours accéder à l'API
- ✅ Facile à démarrer/arrêter
- ✅ Pas besoin de droits administrateur

**Pour arrêter:**
```powershell
.\stop-api.ps1
```

### Solution 2: Créer un service Windows (Recommandé pour production)
```powershell
# En tant qu'administrateur
.\start-api-service.ps1
```

**Avantages:**
- ✅ L'API démarre automatiquement au démarrage de Windows
- ✅ L'API reste active même après redémarrage
- ✅ Gestion via les services Windows
- ✅ Idéal pour la production

---

## 🔗 Liens Utiles

- **Swagger UI** : http://localhost:5192/swagger
- **API Base URL** : http://localhost:5192
- **Documentation Frontend** : `GUIDE_CONSOMMATION_FRONTEND.md`

