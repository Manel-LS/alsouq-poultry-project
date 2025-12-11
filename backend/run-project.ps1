# Script pour builder et runner le projet BackendApi

Write-Host "=== Restauration des packages NuGet ===" -ForegroundColor Cyan
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la restauration des packages" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Build du projet ===" -ForegroundColor Cyan
dotnet build -c Release

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Démarrage de l'application ===" -ForegroundColor Green
Write-Host "L'API sera accessible sur: http://localhost:5192" -ForegroundColor Yellow
Write-Host "Swagger UI: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

dotnet run --configuration Release

