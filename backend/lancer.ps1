# Script simple pour lancer le projet BackendApi
# Usage: .\lancer.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lancement de BackendApi" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis le dossier du projet" -ForegroundColor Yellow
    Write-Host "`nCommande: cd D:\xampp\htdocs\backend_project\dotnet\BackendApi" -ForegroundColor Gray
    exit 1
}

# Vérifier que dotnet est installé
try {
    $dotnetVersion = dotnet --version 2>&1
    Write-Host "✓ .NET SDK version: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur: dotnet n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez le SDK .NET 8.0 depuis: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

# Restaurer les packages si nécessaire
Write-Host "`n=== Vérification des packages ===" -ForegroundColor Cyan
dotnet restore --verbosity quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Packages à jour" -ForegroundColor Green
}

# Arrêter les processus existants sur les ports courants
Write-Host "`n=== Vérification des ports ===" -ForegroundColor Cyan
$ports = @(5192, 7054, 5000, 5001)
foreach ($port in $ports) {
    $portProcesses = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($portProcesses) {
        Write-Host "Arrêt des processus existants sur le port $port..." -ForegroundColor Yellow
        foreach ($pid in $portProcesses) {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✓ Processus $pid arrêté" -ForegroundColor Gray
            }
        }
        Start-Sleep -Seconds 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== Démarrage de l'application ===" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "L'API sera accessible selon la configuration dans launchSettings.json" -ForegroundColor Yellow
Write-Host "Par défaut: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nAppuyez sur Ctrl+C pour arrêter l'application`n" -ForegroundColor Gray

# Lancer l'application
dotnet run

