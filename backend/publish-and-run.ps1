# Script pour publier et exécuter le projet en production

Write-Host "=== Restauration des packages NuGet ===" -ForegroundColor Cyan
dotnet restore

Write-Host "`n=== Publication du projet (Release) ===" -ForegroundColor Cyan
dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la publication" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Démarrage de l'application publiée ===" -ForegroundColor Green
Write-Host "L'API sera accessible sur: http://localhost:5192" -ForegroundColor Yellow
Write-Host "Swagger UI: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

Set-Location ./publish
dotnet BackendApi.dll

