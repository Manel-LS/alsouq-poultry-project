# Script simple pour exécuter BackendApi en production
# Usage: .\run-production-simple.ps1
# Note: L'API s'arrêtera si vous fermez ce terminal

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BackendApi - Exécution Production" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis le dossier du projet" -ForegroundColor Yellow
    exit 1
}

# Vérifier que dotnet est installé
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET trouvé: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur: .NET n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez .NET 8.0 Runtime depuis: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

# Publier le projet si le dossier publish n'existe pas ou est vide
if (-not (Test-Path "./publish") -or -not (Test-Path "./publish/BackendApi.dll")) {
    Write-Host "`n=== Publication du projet ===" -ForegroundColor Cyan
    if (Test-Path "./publish") {
        Remove-Item -Recurse -Force "./publish"
    }
    
    dotnet publish -c Release -o ./publish
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erreur lors de la publication" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Publication réussie" -ForegroundColor Green
} else {
    Write-Host "✓ Dossier publish trouvé, utilisation de la version existante" -ForegroundColor Green
    Write-Host "  (Supprimez le dossier publish pour forcer une nouvelle publication)" -ForegroundColor Gray
}

# Vérifier que appsettings.json existe
if (-not (Test-Path "./publish/appsettings.json")) {
    Write-Host "⚠ Attention: appsettings.json non trouvé dans publish/" -ForegroundColor Yellow
    Write-Host "  Copie depuis le dossier racine..." -ForegroundColor Gray
    if (Test-Path "./appsettings.json") {
        Copy-Item "./appsettings.json" "./publish/appsettings.json"
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== Démarrage de l'application ===" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "L'API sera accessible sur:" -ForegroundColor Yellow
Write-Host "  - HTTP:  http://localhost:5192" -ForegroundColor White
Write-Host "  - HTTPS: https://localhost:7054" -ForegroundColor White
Write-Host "  - Swagger: http://localhost:5192/swagger" -ForegroundColor White
Write-Host "`n⚠ Appuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

# Changer vers le dossier publish et exécuter
Push-Location ./publish
try {
    dotnet BackendApi.dll
} catch {
    Write-Host "`n✗ Erreur lors de l'exécution: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

