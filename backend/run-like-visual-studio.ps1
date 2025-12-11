# Script pour builder et runner comme Visual Studio
# Utilise les mêmes paramètres que Visual Studio (Debug + Development)
# Usage: .\run-like-visual-studio.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BackendApi - Build & Run (Mode Visual Studio)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis le dossier du projet" -ForegroundColor Yellow
    exit 1
}

# Créer wwwroot s'il n'existe pas
if (-not (Test-Path "wwwroot")) {
    New-Item -ItemType Directory -Path "wwwroot" | Out-Null
    Write-Host "✓ Dossier wwwroot créé" -ForegroundColor Green
}

# Arrêter les processus existants avant de builder
Write-Host "=== Arrêt des processus existants ===" -ForegroundColor Cyan
$portProcesses = Get-NetTCPConnection -LocalPort 5192 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcesses) {
    foreach ($pid in $portProcesses) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

$backendApiProcesses = Get-Process -Name "BackendApi" -ErrorAction SilentlyContinue
if ($backendApiProcesses) {
    foreach ($proc in $backendApiProcesses) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host "=== Restauration des packages NuGet ===" -ForegroundColor Cyan
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la restauration" -ForegroundColor Red
    exit 1
}

# Visual Studio utilise Debug par défaut
Write-Host "`n=== Build en mode Debug (comme Visual Studio) ===" -ForegroundColor Cyan
dotnet build -c Debug

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors du build" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build réussi" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== Démarrage (Mode Development) ===" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration: Debug" -ForegroundColor Yellow
Write-Host "Environnement: Development" -ForegroundColor Yellow
Write-Host "URL: http://localhost:5192" -ForegroundColor Yellow
Write-Host "Swagger: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter`n" -ForegroundColor Gray

# Utiliser les mêmes paramètres que Visual Studio
# Visual Studio utilise le profil "http" qui définit ASPNETCORE_ENVIRONMENT=Development
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --configuration Debug --launch-profile http

