# Script de configuration initiale pour BackendApi
# Ce script crée les dossiers nécessaires et vérifie les prérequis

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration BackendApi" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier si .NET SDK est installé
Write-Host "Vérification de .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK installé: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET SDK non trouvé. Veuillez installer .NET SDK 8.0" -ForegroundColor Red
    Write-Host "Téléchargement: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    exit 1
}

# Créer le dossier wwwroot s'il n'existe pas
Write-Host "`nVérification du dossier wwwroot..." -ForegroundColor Yellow
if (-not (Test-Path "wwwroot")) {
    New-Item -ItemType Directory -Path "wwwroot" | Out-Null
    Write-Host "✓ Dossier wwwroot créé" -ForegroundColor Green
} else {
    Write-Host "✓ Dossier wwwroot existe déjà" -ForegroundColor Green
}

# Créer un fichier .gitkeep dans wwwroot pour le versioning
if (-not (Test-Path "wwwroot\.gitkeep")) {
    New-Item -ItemType File -Path "wwwroot\.gitkeep" | Out-Null
}

# Vérifier la connexion à la base de données MySQL
Write-Host "`nVérification de la configuration MySQL..." -ForegroundColor Yellow
if (Test-Path "appsettings.json") {
    Write-Host "✓ Fichier appsettings.json trouvé" -ForegroundColor Green
} else {
    Write-Host "✗ Fichier appsettings.json manquant" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Configuration terminée!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Vérifiez que MySQL est démarré" -ForegroundColor White
Write-Host "2. Vérifiez la chaîne de connexion dans appsettings.json" -ForegroundColor White
Write-Host "3. Exécutez: .\run-project.ps1" -ForegroundColor White
Write-Host "`n"

