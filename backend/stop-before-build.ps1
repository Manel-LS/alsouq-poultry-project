# Script pour arrêter BackendApi avant de builder
# Usage: .\stop-before-build.ps1
# Ou intégrez-le dans votre workflow de build

Write-Host "Arrêt des processus BackendApi avant le build..." -ForegroundColor Yellow

# Arrêter les processus BackendApi.exe
$backendApiProcesses = Get-Process -Name "BackendApi" -ErrorAction SilentlyContinue
if ($backendApiProcesses) {
    foreach ($proc in $backendApiProcesses) {
        Write-Host "Arrêt du processus BackendApi (PID: $($proc.Id))" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "✓ Processus BackendApi arrêtés" -ForegroundColor Green
} else {
    Write-Host "Aucun processus BackendApi.exe trouvé" -ForegroundColor Gray
}

# Arrêter les processus dotnet sur le port 5192
$portProcesses = Get-NetTCPConnection -LocalPort 5192 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcesses) {
    foreach ($pid in $portProcesses) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and ($proc.ProcessName -eq "dotnet" -or $proc.ProcessName -eq "BackendApi")) {
            Write-Host "Arrêt du processus sur le port 5192 (PID: $pid)" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
        }
    }
    Write-Host "✓ Port 5192 libéré" -ForegroundColor Green
} else {
    Write-Host "Port 5192 libre" -ForegroundColor Gray
}

# Attendre un peu pour que les fichiers soient libérés
Start-Sleep -Seconds 2

Write-Host "`n✓ Prêt pour le build!" -ForegroundColor Green

