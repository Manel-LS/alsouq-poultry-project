# Script pour démarrer l'API BackendApi en arrière-plan
# L'API continuera de tourner même après fermeture de Visual Studio ou du terminal
# Usage: .\start-api-background.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Démarrage BackendApi en arrière-plan" -ForegroundColor Cyan
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
}

# Vérifier si l'API est déjà en cours d'exécution
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5192/swagger" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "⚠ L'API est déjà en cours d'exécution sur http://localhost:5192" -ForegroundColor Yellow
    Write-Host "Utilisez .\stop-api.ps1 pour l'arrêter d'abord" -ForegroundColor Yellow
    exit 0
} catch {
    # L'API n'est pas en cours d'exécution, on peut continuer
}

Write-Host "=== Build du projet ===" -ForegroundColor Cyan
dotnet build -c Release

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors du build" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Démarrage en arrière-plan ===" -ForegroundColor Green

# Créer un fichier de log
$logFile = "api-background.log"
Write-Host "Les logs seront sauvegardés dans: $logFile" -ForegroundColor Yellow

# Démarrer l'API en arrière-plan avec Start-Process
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "dotnet"
$processInfo.Arguments = "run --configuration Release"
$processInfo.WorkingDirectory = $PWD.Path
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo

# Rediriger les sorties vers le fichier de log
$process.Start() | Out-Null

# Attendre un peu pour voir si le processus démarre correctement
Start-Sleep -Seconds 3

if ($process.HasExited) {
    Write-Host "✗ Erreur: Le processus s'est arrêté immédiatement" -ForegroundColor Red
    Write-Host "Vérifiez le fichier de log: $logFile" -ForegroundColor Yellow
    exit 1
}

# Sauvegarder le PID dans un fichier pour pouvoir l'arrêter plus tard
$pidFile = "api-background.pid"
$process.Id | Out-File -FilePath $pidFile -Encoding ASCII
Write-Host "✓ API démarrée en arrière-plan (PID: $($process.Id))" -ForegroundColor Green
Write-Host "✓ PID sauvegardé dans: $pidFile" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API démarrée avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "L'API est accessible sur: http://localhost:5192" -ForegroundColor Yellow
Write-Host "Swagger UI: http://localhost:5192/swagger" -ForegroundColor Yellow
Write-Host "`nL'API continuera de tourner même après fermeture de Visual Studio" -ForegroundColor Green
Write-Host "`nPour arrêter l'API, exécutez: .\stop-api.ps1" -ForegroundColor Cyan
Write-Host "Ou utilisez le PID sauvegardé dans: $pidFile`n" -ForegroundColor Gray

