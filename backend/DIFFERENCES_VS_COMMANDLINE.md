# Différences entre Visual Studio et Ligne de Commande

## 🔍 Pourquoi ça fonctionne dans Visual Studio mais pas en ligne de commande ?

### Différences principales

| Aspect | Visual Studio | Ligne de Commande (par défaut) |
|--------|---------------|-------------------------------|
| **Configuration** | Debug | Release (dans le script) |
| **Environnement** | Development | Production (par défaut) |
| **Profil de lancement** | `http` (depuis launchSettings.json) | Aucun |
| **Variables d'environnement** | Définies automatiquement | Non définies |
| **Port** | 5192 (depuis launchSettings.json) | 5192 (par défaut) |

---

## ✅ Solution : Utiliser le script qui reproduit Visual Studio

### Option 1 : Script dédié (Recommandé)

```powershell
.\run-like-visual-studio.ps1
```

Ce script utilise exactement les mêmes paramètres que Visual Studio :
- ✅ Configuration: **Debug**
- ✅ Environnement: **Development**
- ✅ Profil: **http** (depuis launchSettings.json)

---

### Option 2 : Modifier le script existant

Le script `run-project.ps1` a été mis à jour pour utiliser Debug par défaut :

```powershell
# Mode Debug (comme Visual Studio)
.\run-project.ps1

# Mode Debug avec environnement Development
.\run-project.ps1 -Configuration Debug -Environment Development

# Mode Release (production)
.\run-project.ps1 -Configuration Release -Environment Production
```

---

## 📋 Commandes équivalentes

### Visual Studio (F5 ou Start)
```powershell
# Équivalent en ligne de commande :
dotnet run --configuration Debug --launch-profile http
```

### Visual Studio (Build seulement)
```powershell
# Équivalent en ligne de commande :
dotnet build -c Debug
```

---

## 🔧 Paramètres du profil "http" (Visual Studio)

D'après `Properties/launchSettings.json` :

```json
{
  "http": {
    "commandName": "Project",
    "dotnetRunMessages": true,
    "launchBrowser": true,
    "launchUrl": "swagger",
    "applicationUrl": "http://localhost:5192",
    "environmentVariables": {
      "ASPNETCORE_ENVIRONMENT": "Development"
    }
  }
}
```

**Ce que ça fait :**
- ✅ Définit `ASPNETCORE_ENVIRONMENT=Development`
- ✅ Utilise le port 5192
- ✅ Ouvre Swagger automatiquement
- ✅ Active les messages dotnet run

---

## 🚀 Commandes rapides

### Pour reproduire Visual Studio exactement :
```powershell
.\run-like-visual-studio.ps1
```

### Pour builder seulement (comme Visual Studio) :
```powershell
dotnet build -c Debug
```

### Pour runner seulement (comme Visual Studio) :
```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --configuration Debug --launch-profile http
```

---

## ⚠️ Problèmes courants

### Problème : "Fichier verrouillé"
**Cause :** L'application tourne déjà  
**Solution :**
```powershell
.\stop-api.ps1
# Puis relancer
.\run-like-visual-studio.ps1
```

### Problème : "Port déjà utilisé"
**Cause :** Un autre processus utilise le port 5192  
**Solution :**
```powershell
.\stop-api.ps1
```

### Problème : "Configuration différente"
**Cause :** Visual Studio utilise Debug, le script utilisait Release  
**Solution :** Utiliser `.\run-like-visual-studio.ps1` ou `.\run-project.ps1` (maintenant Debug par défaut)

---

## 📝 Résumé

**Visual Studio fait :**
1. `dotnet restore`
2. `dotnet build -c Debug`
3. `dotnet run --configuration Debug --launch-profile http`
4. Définit `ASPNETCORE_ENVIRONMENT=Development`

**Pour reproduire en ligne de commande :**
```powershell
.\run-like-visual-studio.ps1
```

Ou manuellement :
```powershell
dotnet restore
dotnet build -c Debug
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --configuration Debug --launch-profile http
```

