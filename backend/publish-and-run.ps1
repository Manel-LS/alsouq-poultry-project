# Script pour publier et exécuter le projet en production
# Usage: .\publish-and-run.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BackendApi - Publish & Run (Production)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis le dossier du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Restauration des packages NuGet ===" -ForegroundColor Cyan
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la restauration des packages" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Packages restaurés" -ForegroundColor Green

Write-Host "`n=== Publication du projet (Release) ===" -ForegroundColor Cyan
if (Test-Path "./publish") {
    Write-Host "Nettoyage de l'ancien dossier publish..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "./publish"
}

dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la publication" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Publication réussie" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== Démarrage de l'application publiée ===" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "L'API sera accessible sur: http://localhost:5192" -ForegroundColor Yellow
Write-Host "Swagger UI: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

Push-Location ./publish
try {
    dotnet BackendApi.dll
} finally {
    Pop-Location
}

