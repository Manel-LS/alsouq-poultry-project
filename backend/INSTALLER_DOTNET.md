# 🔧 Installer .NET sur le Serveur Windows

## ⚠️ Problème : "dotnet n'est pas reconnu"

Cela signifie que .NET n'est pas installé ou pas dans le PATH.

---

## ✅ Solution : Installer .NET 8.0 Runtime

### **Option 1 : Installation Manuelle (RECOMMANDÉ)**

1. **Télécharger .NET 8.0 Runtime :**
   - Aller sur : https://dotnet.microsoft.com/download/dotnet/8.0
   - Cliquer sur **"Download .NET 8.0 Runtime"**
   - Choisir **"ASP.NET Core Runtime 8.0.x"** → **Windows x64**
   - Télécharger le fichier `.exe`

2. **Installer :**
   - Double-cliquer sur le fichier téléchargé
   - Suivre l'assistant d'installation
   - Accepter les termes et conditions
   - Attendre la fin de l'installation

3. **Vérifier l'installation :**
   - Fermer et rouvrir PowerShell
   - Taper : `dotnet --version`
   - Doit afficher : `8.0.x`

---

### **Option 2 : Installation via PowerShell (Automatique)**

```powershell
# Ouvrir PowerShell EN TANT QU'ADMINISTRATEUR

# Télécharger le script d'installation
Invoke-WebRequest -Uri "https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.ps1" -OutFile "$env:TEMP\dotnet-install.ps1"

# Installer .NET 8.0 Runtime
& "$env:TEMP\dotnet-install.ps1" -Channel 8.0 -Runtime aspnetcore

# Ajouter au PATH (si pas fait automatiquement)
$dotnetPath = "$env:USERPROFILE\.dotnet"
$env:Path += ";$dotnetPath"
[System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
```

**Après l'installation :**
- Fermer et rouvrir PowerShell
- Vérifier : `dotnet --version`

---

### **Option 3 : Installation via Chocolatey (Si installé)**

```powershell
# En tant qu'administrateur
choco install dotnet-8.0-aspnetcore-runtime -y
```

---

## 🔍 Vérifier si .NET est Installé (mais pas dans le PATH)

Si .NET est installé mais pas reconnu, il faut l'ajouter au PATH :

### Trouver où .NET est installé :

```powershell
# Chercher dans les emplacements courants
$possiblePaths = @(
    "C:\Program Files\dotnet\dotnet.exe",
    "C:\Program Files (x86)\dotnet\dotnet.exe",
    "$env:USERPROFILE\.dotnet\dotnet.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        Write-Host "✓ .NET trouvé : $path" -ForegroundColor Green
        & $path --version
    }
}
```

### Ajouter au PATH :

```powershell
# En tant qu'administrateur
# Remplacer le chemin par celui trouvé ci-dessus
$dotnetPath = "C:\Program Files\dotnet"
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$dotnetPath*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$dotnetPath", "Machine")
    Write-Host "✓ .NET ajouté au PATH" -ForegroundColor Green
    Write-Host "⚠ Fermez et rouvrez PowerShell pour que les changements prennent effet" -ForegroundColor Yellow
}
```

---

## 📋 Checklist

- [ ] .NET 8.0 Runtime téléchargé
- [ ] .NET 8.0 Runtime installé
- [ ] PowerShell fermé et rouvert
- [ ] Commande `dotnet --version` fonctionne
- [ ] Affiche : `8.0.x`

---

## 🆘 Si ça ne fonctionne toujours pas

1. **Redémarrer le serveur** (parfois nécessaire)

2. **Vérifier manuellement :**
   ```powershell
   # Tester directement avec le chemin complet
   & "C:\Program Files\dotnet\dotnet.exe" --version
   ```

3. **Réinstaller .NET** :
   - Désinstaller depuis "Paramètres Windows" → "Applications"
   - Réinstaller avec l'Option 1 ci-dessus

---

## 📥 Liens de Téléchargement Directs

- **ASP.NET Core Runtime 8.0 (Windows x64)** :
  https://dotnet.microsoft.com/download/dotnet/thank-you/runtime-aspnetcore-8.0.11-windows-x64-installer

- **Page principale** :
  https://dotnet.microsoft.com/download/dotnet/8.0

---

## ✅ Après Installation

Une fois .NET installé, vous pourrez exécuter :

```powershell
cd D:\xampp\htdocs\backend_project\dotnet\BackendApi
dotnet publish -c Release -o ./publish
cd publish
dotnet BackendApi.dll
```

