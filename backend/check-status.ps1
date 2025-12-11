# Script pour vérifier le statut de l'API BackendApi
# Usage: .\check-status.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification du statut BackendApi" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier .NET SDK
Write-Host "1. Vérification de .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version 2>&1
    Write-Host "   ✓ .NET SDK: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ .NET SDK non installé" -ForegroundColor Red
}

# Vérifier les fichiers du projet
Write-Host "`n2. Vérification des fichiers du projet..." -ForegroundColor Yellow
$files = @("BackendApi.csproj", "Program.cs", "appsettings.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file manquant" -ForegroundColor Red
    }
}

# Vérifier le dossier wwwroot
Write-Host "`n3. Vérification du dossier wwwroot..." -ForegroundColor Yellow
if (Test-Path "wwwroot") {
    Write-Host "   ✓ Dossier wwwroot existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Dossier wwwroot manquant (sera créé automatiquement)" -ForegroundColor Yellow
}

# Vérifier si l'API est en cours d'exécution
Write-Host "`n4. Vérification de l'API en cours d'exécution..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5192/swagger" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ API en cours d'exécution sur http://localhost:5192" -ForegroundColor Green
    Write-Host "   ✓ Swagger disponible" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ API non accessible (peut-être arrêtée)" -ForegroundColor Yellow
}

# Vérifier les processus dotnet
Write-Host "`n5. Vérification des processus dotnet..." -ForegroundColor Yellow
$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
if ($dotnetProcesses) {
    Write-Host "   ✓ $($dotnetProcesses.Count) processus dotnet en cours d'exécution" -ForegroundColor Green
    foreach ($proc in $dotnetProcesses) {
        Write-Host "     - PID: $($proc.Id), CPU: $($proc.CPU), Mémoire: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠ Aucun processus dotnet trouvé" -ForegroundColor Yellow
}

# Vérifier le port 5192
Write-Host "`n6. Vérification du port 5192..." -ForegroundColor Yellow
$portConnection = Get-NetTCPConnection -LocalPort 5192 -ErrorAction SilentlyContinue
if ($portConnection) {
    $pid = $portConnection.OwningProcess
    Write-Host "   ✓ Port 5192 utilisé par le processus PID: $pid" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Port 5192 libre" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Vérification terminée!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

