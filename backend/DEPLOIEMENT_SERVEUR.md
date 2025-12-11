# Guide de Déploiement sur Serveur Windows

## 🎯 Objectif

Déployer et exécuter BackendApi sur un serveur Windows de production.

---

## 📋 Prérequis sur le Serveur

### 1. Installer .NET Runtime 8.0

**Option A : Téléchargement manuel**
1. Téléchargez depuis : https://dotnet.microsoft.com/download/dotnet/8.0
2. Choisissez **ASP.NET Core Runtime 8.0.x** → **Windows x64**
3. Installez l'exécutable

**Option B : Via PowerShell (en tant qu'administrateur)**
```powershell
# Télécharger et installer
Invoke-WebRequest -Uri "https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.ps1" -OutFile "dotnet-install.ps1"
.\dotnet-install.ps1 -Channel 8.0 -Runtime aspnetcore
```

**Vérification :**
```powershell
dotnet --version
dotnet --list-runtimes
```

### 2. Installer MySQL (si pas déjà installé)

Assurez-vous que MySQL est installé et démarré sur le serveur.

---

## 🚀 Méthode 1 : Publication et Exécution Simple

### Étape 1 : Publier le projet (sur votre machine de développement)

```powershell
# Dans le dossier BackendApi
dotnet publish -c Release -o ./publish
```

Cela crée un dossier `publish` avec tous les fichiers nécessaires.

### Étape 2 : Copier sur le serveur

Copiez tout le contenu du dossier `publish` sur le serveur (par exemple dans `C:\BackendApi\`).

### Étape 3 : Configurer appsettings.json sur le serveur

Modifiez `appsettings.json` sur le serveur avec les bonnes informations :

```json
{
  "ConnectionStrings": {
    "Default": "Server=VOTRE_SERVEUR_MYSQL;Database=SOCERP;Uid=root;Pwd=VOTRE_MOT_DE_PASSE;AllowUserVariables=true;SslMode=None;Allow Zero Datetime=True;Convert Zero Datetime=True"
  },
  "Jwt": {
    "Issuer": "BackendApi",
    "Audience": "BackendApi",
    "Key": "p1L4YqZ7wV9sK3tN8bR2xF6mH0cD5gJ1"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Étape 4 : Exécuter sur le serveur

```powershell
# Sur le serveur, dans le dossier publish
cd C:\BackendApi
dotnet BackendApi.dll
```

**⚠️ Problème :** L'application s'arrête si vous fermez le terminal.

---

## 🎯 Méthode 2 : Service Windows (Recommandé pour Production)

### Étape 1 : Publier le projet

```powershell
dotnet publish -c Release -o ./publish
```

### Étape 2 : Copier sur le serveur

Copiez le dossier `publish` sur le serveur (ex: `C:\BackendApi\`).

### Étape 3 : Créer un service Windows

**Option A : Utiliser NSSM (Recommandé - Plus facile)**

1. **Télécharger NSSM :**
   - https://nssm.cc/download
   - Extrayez dans `C:\nssm\`

2. **Créer le service :**
```powershell
# En tant qu'administrateur
cd C:\nssm\win64

# Installer le service
.\nssm.exe install BackendApi "C:\Program Files\dotnet\dotnet.exe" "C:\BackendApi\BackendApi.dll"

# Configurer le répertoire de travail
.\nssm.exe set BackendApi AppDirectory "C:\BackendApi"

# Configurer le nom d'affichage
.\nssm.exe set BackendApi DisplayName "BackendApi API Service"

# Configurer la description
.\nssm.exe set BackendApi Description "Service Windows pour l'API BackendApi"

# Démarrer automatiquement au démarrage
.\nssm.exe set BackendApi Start SERVICE_AUTO_START

# Démarrer le service
.\nssm.exe start BackendApi
```

**Option B : Utiliser sc.exe (Windows intégré)**

```powershell
# En tant qu'administrateur
sc.exe create BackendApi binPath= "\"C:\Program Files\dotnet\dotnet.exe\" \"C:\BackendApi\BackendApi.dll\"" DisplayName= "BackendApi API Service" start= auto
sc.exe description BackendApi "Service Windows pour l'API BackendApi"
sc.exe start BackendApi
```

### Étape 4 : Gérer le service

```powershell
# Démarrer
Start-Service -Name BackendApi

# Arrêter
Stop-Service -Name BackendApi

# Vérifier le statut
Get-Service -Name BackendApi

# Voir les logs
Get-EventLog -LogName Application -Source BackendApi -Newest 50
```

---

## 🔧 Méthode 3 : Utiliser le Script PowerShell (Sur le Serveur)

### Étape 1 : Copier les fichiers sur le serveur

1. Copiez le dossier `publish` (après `dotnet publish`)
2. Copiez aussi le script `start-api-service.ps1` sur le serveur

### Étape 2 : Exécuter le script sur le serveur

```powershell
# Sur le serveur, en tant qu'administrateur
cd C:\BackendApi
.\start-api-service.ps1
```

Le script va :
- ✅ Publier le projet
- ✅ Créer le service Windows
- ✅ Démarrer le service

---

## 🌐 Configuration du Firewall

Pour que l'API soit accessible depuis l'extérieur :

```powershell
# En tant qu'administrateur
New-NetFirewallRule -DisplayName "BackendApi HTTP" -Direction Inbound -LocalPort 5192 -Protocol TCP -Action Allow
```

---

## 📝 Configuration pour Production

### Modifier appsettings.json pour Production

Créez `appsettings.Production.json` :

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=SOCERP;Uid=root;Pwd=VOTRE_MOT_DE_PASSE;AllowUserVariables=true;SslMode=None;Allow Zero Datetime=True;Convert Zero Datetime=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Variables d'environnement

Vous pouvez aussi utiliser des variables d'environnement :

```powershell
# Sur le serveur
[System.Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production", "Machine")
[System.Environment]::SetEnvironmentVariable("ConnectionStrings__Default", "Server=localhost;Database=SOCERP;...", "Machine")
```

---

## 🔍 Vérification du Déploiement

### 1. Vérifier que le service tourne

```powershell
Get-Service -Name BackendApi
```

### 2. Tester l'API

```powershell
# Depuis le serveur
Invoke-WebRequest -Uri "http://localhost:5192/swagger" -UseBasicParsing

# Depuis une autre machine
Invoke-WebRequest -Uri "http://IP_DU_SERVEUR:5192/swagger" -UseBasicParsing
```

### 3. Vérifier les logs

```powershell
# Logs Windows Event Viewer
Get-EventLog -LogName Application -Source BackendApi -Newest 20

# Ou si vous avez configuré des logs fichiers
Get-Content C:\BackendApi\logs\*.log -Tail 50
```

---

## 🛠️ Script Complet de Déploiement

Créez un script `deploy-to-server.ps1` sur votre machine de développement :

```powershell
# deploy-to-server.ps1
param(
    [string]$ServerPath = "\\SERVEUR\C$\BackendApi",
    [string]$ServerIP = "192.168.1.100"
)

Write-Host "=== Publication du projet ===" -ForegroundColor Cyan
dotnet publish -c Release -o ./publish

Write-Host "`n=== Copie sur le serveur ===" -ForegroundColor Cyan
Copy-Item -Path "./publish\*" -Destination $ServerPath -Recurse -Force

Write-Host "`n=== Déploiement terminé ===" -ForegroundColor Green
Write-Host "L'API devrait être accessible sur: http://$ServerIP:5192" -ForegroundColor Yellow
```

**Usage :**
```powershell
.\deploy-to-server.ps1 -ServerPath "\\SERVEUR\C$\BackendApi" -ServerIP "192.168.1.100"
```

---

## ⚠️ Checklist de Déploiement

- [ ] .NET Runtime 8.0 installé sur le serveur
- [ ] MySQL installé et démarré
- [ ] Projet publié (`dotnet publish`)
- [ ] Fichiers copiés sur le serveur
- [ ] `appsettings.json` configuré avec les bonnes informations
- [ ] Service Windows créé (si méthode service)
- [ ] Firewall configuré (port 5192 ouvert)
- [ ] Service démarré
- [ ] API testée (http://IP_SERVEUR:5192/swagger)

---

## 🆘 Dépannage

### Le service ne démarre pas

```powershell
# Vérifier les logs
Get-EventLog -LogName Application -Source BackendApi -Newest 10

# Vérifier les permissions
# Le service doit avoir accès au dossier et à MySQL
```

### L'API n'est pas accessible

1. Vérifier que le service tourne : `Get-Service -Name BackendApi`
2. Vérifier le firewall : `Get-NetFirewallRule -DisplayName "BackendApi*"`
3. Vérifier le port : `Get-NetTCPConnection -LocalPort 5192`

### Erreur de connexion MySQL

1. Vérifier que MySQL est démarré
2. Vérifier la chaîne de connexion dans `appsettings.json`
3. Vérifier que l'utilisateur MySQL a les bonnes permissions

---

## 📞 Support

Pour plus d'aide, consultez :
- Les logs du service Windows
- Les logs de l'application dans Event Viewer
- La documentation .NET : https://docs.microsoft.com/dotnet/core/deploying/

