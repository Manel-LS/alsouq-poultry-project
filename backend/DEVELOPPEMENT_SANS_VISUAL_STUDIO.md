# 🛠️ Développement .NET Sans Visual Studio

## Guide Complet : Utiliser .NET en Ligne de Commande

---

## 📋 **Introduction**

Vous pouvez développer des applications .NET **complètement sans Visual Studio** en utilisant uniquement :
- ✅ **dotnet CLI** (Command Line Interface)
- ✅ **Un éditeur de texte** (VS Code, Notepad++, etc.)
- ✅ **PowerShell** ou **Terminal**

---

## 🎯 **Commandes de Base du SDK .NET**

### **1. Créer un Nouveau Projet**

```powershell
# Créer un nouveau projet Web API
dotnet new webapi -n MonProjet

# Créer un nouveau projet Console
dotnet new console -n MonProjet

# Créer un nouveau projet MVC
dotnet new mvc -n MonProjet

# Créer un nouveau projet Blazor
dotnet new blazor -n MonProjet
```

### **2. Restaurer les Packages NuGet**

```powershell
# Restaurer tous les packages
dotnet restore

# Restaurer et construire
dotnet build
```

### **3. Construire (Build) le Projet**

```powershell
# Build en mode Debug (par défaut)
dotnet build

# Build en mode Release
dotnet build -c Release

# Build sans restaurer
dotnet build --no-restore
```

### **4. Exécuter l'Application**

```powershell
# Exécuter en mode Debug
dotnet run

# Exécuter en mode Release
dotnet run -c Release

# Exécuter avec des arguments
dotnet run -- arg1 arg2
```

### **5. Publier l'Application**

```powershell
# Publier en mode Release
dotnet publish -c Release

# Publier dans un dossier spécifique
dotnet publish -c Release -o ./publish

# Publier pour un runtime spécifique
dotnet publish -c Release -r win-x64 -o ./publish
```

### **6. Ajouter des Packages NuGet**

```powershell
# Ajouter un package
dotnet add package NomDuPackage

# Ajouter un package avec version spécifique
dotnet add package NomDuPackage --version 1.2.3

# Exemple : Ajouter Entity Framework
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Pomelo.EntityFrameworkCore.MySql
```

### **7. Supprimer des Packages**

```powershell
# Supprimer un package
dotnet remove package NomDuPackage
```

### **8. Gérer les Références de Projet**

```powershell
# Ajouter une référence à un autre projet
dotnet add reference ../AutreProjet/AutreProjet.csproj

# Supprimer une référence
dotnet remove reference ../AutreProjet/AutreProjet.csproj
```

---

## 📁 **Structure d'un Projet .NET**

```
MonProjet/
├── MonProjet.csproj          # Fichier de projet
├── Program.cs                 # Point d'entrée
├── Controllers/               # Contrôleurs (pour Web API)
│   └── HomeController.cs
├── Models/                    # Modèles
│   └── MonModele.cs
├── Services/                  # Services
│   └── MonService.cs
├── appsettings.json           # Configuration
└── bin/                       # Fichiers compilés
    └── Debug/
        └── net8.0/
```

---

## 🔧 **Workflow de Développement Typique**

### **Étape 1 : Créer le Projet**

```powershell
# Créer un nouveau projet Web API
dotnet new webapi -n BackendApi
cd BackendApi
```

### **Étape 2 : Ajouter les Dépendances**

```powershell
# Ajouter Entity Framework
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Pomelo.EntityFrameworkCore.MySql

# Ajouter JWT Authentication
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

### **Étape 3 : Éditer le Code**

Ouvrir les fichiers `.cs` dans votre éditeur préféré :
- **VS Code** (recommandé)
- **Notepad++**
- **Sublime Text**
- **Vim** / **Nano**

### **Étape 4 : Tester en Continu**

```powershell
# Exécuter l'application
dotnet run

# L'application démarre et vous pouvez tester
# Appuyez sur Ctrl+C pour arrêter
```

### **Étape 5 : Construire et Publier**

```powershell
# Construire
dotnet build -c Release

# Publier
dotnet publish -c Release -o ./publish
```

---

## 🧪 **Tests Unitaires**

### **Créer un Projet de Test**

```powershell
# Créer un projet de test xUnit
dotnet new xunit -n MonProjet.Tests

# Ajouter une référence au projet principal
cd MonProjet.Tests
dotnet add reference ../MonProjet/MonProjet.csproj
```

### **Exécuter les Tests**

```powershell
# Exécuter tous les tests
dotnet test

# Exécuter avec détails
dotnet test --verbosity normal

# Exécuter un test spécifique
dotnet test --filter "NomDuTest"
```

---

## 📦 **Gérer les Packages NuGet**

### **Voir les Packages Installés**

```powershell
# Lister les packages
dotnet list package

# Voir les packages obsolètes
dotnet list package --outdated
```

### **Mettre à Jour les Packages**

```powershell
# Mettre à jour un package spécifique
dotnet add package NomDuPackage --version NouvelleVersion

# Mettre à jour tous les packages (manuellement)
# Il faut modifier le .csproj et faire dotnet restore
```

---

## 🔍 **Commandes Utiles**

### **Voir les Informations du Projet**

```powershell
# Voir la version de .NET
dotnet --version

# Voir les SDK installés
dotnet --list-sdks

# Voir les runtimes installés
dotnet --list-runtimes

# Voir les templates disponibles
dotnet new list
```

### **Nettoyer le Projet**

```powershell
# Nettoyer les fichiers de build
dotnet clean

# Nettoyer et reconstruire
dotnet clean
dotnet build
```

### **Voir les Références**

```powershell
# Voir les références de projet
dotnet list reference

# Voir les packages
dotnet list package
```

---

## 🎨 **Éditeurs Recommandés (Sans Visual Studio)**

### **1. Visual Studio Code (VS Code)** ⭐ RECOMMANDÉ

**Installation :**
- Télécharger : https://code.visualstudio.com/
- Installer l'extension **C#** (par Microsoft)

**Avantages :**
- ✅ Gratuit
- ✅ IntelliSense (autocomplétion)
- ✅ Débogage intégré
- ✅ Git intégré
- ✅ Extensions nombreuses

### **2. JetBrains Rider** (Payant)

**Avantages :**
- ✅ IDE complet
- ✅ Très puissant
- ❌ Payant

### **3. Notepad++** (Simple)

**Avantages :**
- ✅ Très léger
- ✅ Coloration syntaxique
- ❌ Pas d'IntelliSense

---

## 🚀 **Exemple Complet : Créer une API de Zéro**

```powershell
# 1. Créer le projet
dotnet new webapi -n MonApi
cd MonApi

# 2. Ajouter Entity Framework
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Pomelo.EntityFrameworkCore.MySql

# 3. Ouvrir dans VS Code (ou autre éditeur)
code .

# 4. Éditer Program.cs, créer des Controllers, etc.

# 5. Tester
dotnet run

# 6. Publier
dotnet publish -c Release -o ./publish
```

---

## 📝 **Fichier .csproj (Exemple)**

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="9.0.0" />
  </ItemGroup>
</Project>
```

---

## 🔄 **Workflow avec Git**

```powershell
# Initialiser Git
git init

# Ajouter les fichiers
git add .

# Commit
git commit -m "Initial commit"

# Créer un .gitignore pour .NET
dotnet new gitignore
```

---

## 🆘 **Commandes de Dépannage**

```powershell
# Nettoyer complètement
dotnet clean
Remove-Item -Recurse -Force bin, obj

# Restaurer depuis zéro
dotnet restore --force

# Voir les erreurs détaillées
dotnet build --verbosity detailed

# Voir les warnings
dotnet build /warnaserror
```

---

## ✅ **Avantages du Développement Sans Visual Studio**

- ✅ **Plus léger** : Pas besoin d'installer Visual Studio (plusieurs GB)
- ✅ **Plus rapide** : Les commandes CLI sont très rapides
- ✅ **Automatisable** : Facile à intégrer dans des scripts
- ✅ **Multi-plateforme** : Fonctionne sur Windows, Linux, macOS
- ✅ **Contrôle total** : Vous savez exactement ce qui se passe

---

## 📚 **Ressources**

- **Documentation .NET CLI** : https://docs.microsoft.com/dotnet/core/tools/
- **Templates disponibles** : `dotnet new list`
- **VS Code C# Extension** : https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp

---

## 🎯 **Résumé des Commandes Essentielles**

```powershell
dotnet new webapi -n MonProjet    # Créer un projet
dotnet restore                    # Restaurer packages
dotnet build                      # Construire
dotnet run                        # Exécuter
dotnet publish -c Release         # Publier
dotnet add package NomPackage     # Ajouter package
dotnet test                       # Exécuter tests
dotnet clean                      # Nettoyer
```

---

**Vous pouvez développer complètement sans Visual Studio !** 🚀

