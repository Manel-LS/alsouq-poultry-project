# 🚀 Guide : Exécuter BackendApi en Production sur Windows

## ⚠️ Problème
Votre API fonctionne seulement depuis Visual Studio, mais vous voulez l'exécuter en production sans Visual Studio.

## ✅ Solutions Disponibles

### **Option 1 : Service Windows (RECOMMANDÉ pour Production)**

Cette méthode permet à votre API de :
- ✅ Démarrer automatiquement au démarrage de Windows
- ✅ Continuer à fonctionner même si vous fermez le terminal
- ✅ Redémarrer automatiquement en cas de crash
- ✅ Être gérée comme un service Windows standard

#### Étape 1 : Publier le projet

```powershell
# Dans le dossier du projet
dotnet publish -c Release -o ./publish
```

#### Étape 2 : Utiliser le script automatique (FACILE)

```powershell
# Exécutez ce script en tant qu'administrateur
.\start-api-service.ps1
```

Le script va :
- Publier le projet automatiquement
- Créer un service Windows
- Vous proposer de le démarrer

#### Étape 3 : Gérer le service

```powershell
# Démarrer le service
Start-Service -Name BackendApi

# Arrêter le service
Stop-Service -Name BackendApi

# Vérifier le statut
Get-Service -Name BackendApi

# Voir les logs (si erreur)
Get-EventLog -LogName Application -Source BackendApi -Newest 20
```

---

### **Option 2 : Exécution Directe (Simple mais temporaire)**

⚠️ **Attention** : L'API s'arrêtera si vous fermez le terminal PowerShell.

#### Méthode A : Avec le script

```powershell
.\publish-and-run.ps1
```

#### Méthode B : Manuellement

```powershell
# 1. Publier
dotnet publish -c Release -o ./publish

# 2. Exécuter
cd publish
dotnet BackendApi.dll
```

---

### **Option 3 : Exécution en Arrière-plan (PowerShell)**

Pour exécuter en arrière-plan sans bloquer le terminal :

```powershell
# Publier d'abord
dotnet publish -c Release -o ./publish

# Exécuter en arrière-plan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\publish'; dotnet BackendApi.dll"
```

---

## 🔧 Configuration pour Production

### 1. Créer `appsettings.Production.json`

Créez ce fichier dans votre projet :

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

### 2. Définir la variable d'environnement

```powershell
# En tant qu'administrateur
[System.Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production", "Machine")
```

---

## 🌐 Configuration du Firewall

Pour permettre l'accès depuis d'autres machines :

```powershell
# En tant qu'administrateur
New-NetFirewallRule -DisplayName "BackendApi HTTP" -Direction Inbound -LocalPort 5192 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "BackendApi HTTPS" -Direction Inbound -LocalPort 7054 -Protocol TCP -Action Allow
```

---

## 📋 Checklist de Déploiement

- [ ] .NET 8.0 Runtime installé sur le serveur
  ```powershell
  dotnet --version  # Doit afficher 8.0.x
  ```
- [ ] MySQL installé et démarré
- [ ] Projet publié : `dotnet publish -c Release -o ./publish`
- [ ] `appsettings.json` configuré avec les bonnes informations
- [ ] Service Windows créé (si Option 1)
- [ ] Firewall configuré (port 5192 ouvert)
- [ ] Service démarré : `Start-Service -Name BackendApi`
- [ ] API testée : `http://localhost:5192/swagger`

---

## 🆘 Dépannage

### Le service ne démarre pas

```powershell
# Vérifier les logs d'erreur
Get-EventLog -LogName Application -Source BackendApi -Newest 10

# Vérifier les permissions
# Le service doit avoir accès au dossier publish et à MySQL
```

### L'API n'est pas accessible

```powershell
# 1. Vérifier que le service tourne
Get-Service -Name BackendApi

# 2. Vérifier le port
Get-NetTCPConnection -LocalPort 5192

# 3. Vérifier le firewall
Get-NetFirewallRule -DisplayName "BackendApi*"
```

### Erreur de connexion MySQL

1. Vérifier que MySQL est démarré
2. Vérifier la chaîne de connexion dans `appsettings.json`
3. Tester la connexion :
   ```powershell
   mysql -u root -p -h localhost SOCERP
   ```

### Le service s'arrête immédiatement

```powershell
# Vérifier les logs détaillés
Get-EventLog -LogName Application -Source BackendApi -Newest 50 | Format-List

# Vérifier que dotnet.exe est accessible
Test-Path "C:\Program Files\dotnet\dotnet.exe"
```

---

## 🎯 Résumé Rapide (Service Windows)

```powershell
# 1. Publier
dotnet publish -c Release -o ./publish

# 2. Créer le service (en tant qu'administrateur)
.\start-api-service.ps1

# 3. Démarrer
Start-Service -Name BackendApi

# 4. Vérifier
Get-Service -Name BackendApi
```

---

## 📞 Commandes Utiles

```powershell
# Voir tous les services
Get-Service | Where-Object {$_.Name -like "*Backend*"}

# Redémarrer le service
Restart-Service -Name BackendApi

# Supprimer le service (si besoin)
Stop-Service -Name BackendApi -Force
sc.exe delete BackendApi

# Tester l'API
Invoke-WebRequest -Uri "http://localhost:5192/swagger" -UseBasicParsing
```

---

## 💡 Recommandation

**Pour la production, utilisez l'Option 1 (Service Windows)** car :
- ✅ Fonctionne automatiquement au démarrage
- ✅ Ne s'arrête pas si vous fermez le terminal
- ✅ Plus stable et professionnel
- ✅ Facile à gérer avec les outils Windows standards

