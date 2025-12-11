# Script pour tester si le port 7054 est accessible
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test de connexion au port 7054" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier si le port est utilisé
Write-Host "=== Vérification du port 7054 ===" -ForegroundColor Yellow
$portConnection = Get-NetTCPConnection -LocalPort 7054 -ErrorAction SilentlyContinue

if ($portConnection) {
    Write-Host "✓ Le port 7054 est utilisé par un processus" -ForegroundColor Green
    $processId = $portConnection | Select-Object -First 1 -ExpandProperty OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "  Processus: $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Aucun processus n'écoute sur le port 7054" -ForegroundColor Red
    Write-Host "  L'application n'est probablement pas démarrée" -ForegroundColor Yellow
}

# Tester la connexion HTTP
Write-Host "`n=== Test de connexion HTTP ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7054/swagger" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Connexion réussie !" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "  L'API est accessible sur: http://localhost:7054/swagger" -ForegroundColor Green
} catch {
    Write-Host "✗ Impossible de se connecter à http://localhost:7054" -ForegroundColor Red
    Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Message -like "*refusée*" -or $_.Exception.Message -like "*refused*") {
        Write-Host "`n  → L'application n'est probablement pas démarrée" -ForegroundColor Yellow
        Write-Host "  → Lancez: dotnet run --launch-profile http" -ForegroundColor Cyan
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "`n  → Le port est peut-être bloqué par le pare-feu" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan

