# Script pour arrêter l'API BackendApi
# Usage: .\stop-api.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Arrêt de l'API BackendApi" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier le fichier PID sauvegardé
$pidFile = "api-background.pid"
if (Test-Path $pidFile) {
    $savedPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($savedPid) {
        Write-Host "Arrêt du processus sauvegardé (PID: $savedPid)..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $savedPid -Force -ErrorAction Stop
            Write-Host "✓ Processus arrêté (PID: $savedPid)" -ForegroundColor Green
            Remove-Item $pidFile -Force
        } catch {
            Write-Host "⚠ Processus PID $savedPid non trouvé ou déjà arrêté" -ForegroundColor Yellow
            Remove-Item $pidFile -Force
        }
    }
}

# Arrêter tous les processus dotnet sur le port 5192
Write-Host "`nVérification du port 5192..." -ForegroundColor Yellow
$portProcesses = Get-NetTCPConnection -LocalPort 5192 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($portProcesses) {
    foreach ($pid in $portProcesses) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "dotnet") {
            Write-Host "Arrêt du processus sur le port 5192 (PID: $pid)..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
            Write-Host "✓ Processus arrêté (PID: $pid)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Aucun processus sur le port 5192" -ForegroundColor Gray
}

# Chercher d'autres processus dotnet liés à BackendApi
Write-Host "`nRecherche d'autres processus BackendApi..." -ForegroundColor Yellow
$allDotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue

$found = $false
foreach ($proc in $allDotnetProcesses) {
    try {
        $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        if ($commandLine -like "*BackendApi*" -or $commandLine -like "*BackendApi.dll*") {
            Write-Host "Arrêt du processus BackendApi (PID: $($proc.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force
            Write-Host "✓ Processus arrêté (PID: $($proc.Id))" -ForegroundColor Green
            $found = $true
        }
    } catch {
        # Ignorer les erreurs d'accès
    }
}

if (-not $found -and -not $portProcesses) {
    Write-Host "Aucun processus BackendApi trouvé" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ Arrêt terminé!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

