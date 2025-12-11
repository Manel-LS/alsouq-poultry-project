# Script pour builder et runner le projet BackendApi
# Usage: .\run-project.ps1 [Debug|Release]

param(
    [string]$Configuration = "Debug",
    [string]$Environment = "Development"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BackendApi - Build & Run" -ForegroundColor Cyan
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

Write-Host "=== Restauration des packages NuGet ===" -ForegroundColor Cyan
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la restauration des packages" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Packages restaurés" -ForegroundColor Green

# Arrêter les processus existants avant de builder
Write-Host "`n=== Vérification des processus existants ===" -ForegroundColor Cyan
$portProcesses = Get-NetTCPConnection -LocalPort 5192 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcesses) {
    Write-Host "Arrêt des processus existants sur le port 5192..." -ForegroundColor Yellow
    foreach ($pid in $portProcesses) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "✓ Processus arrêtés" -ForegroundColor Green
}

$backendApiProcesses = Get-Process -Name "BackendApi" -ErrorAction SilentlyContinue
if ($backendApiProcesses) {
    Write-Host "Arrêt des processus BackendApi.exe..." -ForegroundColor Yellow
    foreach ($proc in $backendApiProcesses) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "✓ Processus BackendApi arrêtés" -ForegroundColor Green
}

Write-Host "`n=== Build du projet (Configuration: $Configuration) ===" -ForegroundColor Cyan
dotnet build -c $Configuration

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors du build" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build réussi" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== Démarrage de l'application ===" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration: $Configuration" -ForegroundColor Yellow
Write-Host "Environnement: $Environment" -ForegroundColor Yellow
Write-Host "L'API sera accessible selon la configuration dans launchSettings.json" -ForegroundColor Yellow
Write-Host "Par défaut: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

# Utiliser le même comportement que Visual Studio
$env:ASPNETCORE_ENVIRONMENT = $Environment

# Si Debug, utiliser le profil http comme Visual Studio
if ($Configuration -eq "Debug") {
    dotnet run --configuration $Configuration --launch-profile http
} else {
    dotnet run --configuration $Configuration
}

