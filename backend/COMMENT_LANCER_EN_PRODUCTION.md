# 🚀 Comment Lancer BackendApi en Production (Sans Visual Studio)

## ⚡ Solution Rapide (3 étapes)

### Option 1 : Service Windows (RECOMMANDÉ) ⭐

```powershell
# 1. Ouvrir PowerShell EN TANT QU'ADMINISTRATEUR
# 2. Aller dans le dossier du projet
cd D:\xampp\htdocs\backend_project\dotnet\BackendApi

# 3. Exécuter le script
.\start-api-service.ps1
```

✅ **Avantages** :
- Démarre automatiquement au démarrage de Windows
- Continue à fonctionner même si vous fermez le terminal
- Plus stable pour la production

---

### Option 2 : Exécution Simple (Pour tester)

```powershell
# Dans le dossier du projet
.\run-production-simple.ps1
```

⚠️ **Attention** : L'API s'arrêtera si vous fermez le terminal PowerShell.

---

## 📋 Prérequis

1. **.NET 8.0 Runtime installé** sur le serveur
   ```powershell
   dotnet --version  # Doit afficher 8.0.x
   ```
   Si pas installé : https://dotnet.microsoft.com/download/dotnet/8.0

2. **MySQL démarré** sur le serveur

3. **appsettings.json configuré** avec les bonnes informations de connexion

---

## 🔧 Gérer le Service Windows

```powershell
# Démarrer
Start-Service -Name BackendApi

# Arrêter
Stop-Service -Name BackendApi

# Vérifier le statut
Get-Service -Name BackendApi

# Redémarrer
Restart-Service -Name BackendApi
```

---

## 🌐 Accéder à l'API

Une fois lancée, l'API est accessible sur :
- **Swagger UI** : http://localhost:5192/swagger
- **API** : http://localhost:5192

Pour accéder depuis une autre machine :
- http://IP_DU_SERVEUR:5192/swagger

---

## 🆘 Problèmes Courants

### "Le service ne démarre pas"
```powershell
# Voir les erreurs
Get-EventLog -LogName Application -Source BackendApi -Newest 10
```

### "L'API n'est pas accessible"
```powershell
# Vérifier que le service tourne
Get-Service -Name BackendApi

# Vérifier le port
Get-NetTCPConnection -LocalPort 5192
```

### "Erreur de connexion MySQL"
- Vérifier que MySQL est démarré
- Vérifier la chaîne de connexion dans `appsettings.json`

---

## 📖 Documentation Complète

Pour plus de détails, consultez : **GUIDE_PRODUCTION_WINDOWS.md**

