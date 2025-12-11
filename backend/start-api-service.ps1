# Script pour créer un service Windows pour BackendApi
# Cela permet à l'API de démarrer automatiquement au démarrage de Windows
# Usage: .\start-api-service.ps1
# Nécessite les droits administrateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création d'un service Windows pour BackendApi" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "✗ Erreur: Ce script nécessite les droits administrateur" -ForegroundColor Red
    Write-Host "Exécutez PowerShell en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    exit 1
}

# Publier le projet d'abord
Write-Host "=== Publication du projet ===" -ForegroundColor Cyan
if (Test-Path "./publish") {
    Remove-Item -Recurse -Force "./publish"
}

dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la publication" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Publication réussie" -ForegroundColor Green

# Vérifier si NSSM est disponible (recommandé pour créer des services Windows)
Write-Host "`n=== Vérification de NSSM ===" -ForegroundColor Cyan
$nssmPath = "C:\nssm\win64\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    $nssmPath = "C:\nssm\win32\nssm.exe"
}
if (-not (Test-Path $nssmPath)) {
    Write-Host "⚠ NSSM n'est pas installé" -ForegroundColor Yellow
    Write-Host "NSSM (Non-Sucking Service Manager) facilite la création de services Windows" -ForegroundColor Gray
    Write-Host "`nOption 1: Installer NSSM" -ForegroundColor Yellow
    Write-Host "  1. Téléchargez depuis: https://nssm.cc/download" -ForegroundColor White
    Write-Host "  2. Extrayez dans C:\nssm\" -ForegroundColor White
    Write-Host "  3. Relancez ce script" -ForegroundColor White
    Write-Host "`nOption 2: Utiliser sc.exe (Windows Service Control)" -ForegroundColor Yellow
    
    $useSc = Read-Host "Voulez-vous utiliser sc.exe à la place? (O/N)"
    if ($useSc -ne "O" -and $useSc -ne "o") {
        Write-Host "Installation annulée" -ForegroundColor Yellow
        exit 0
    }
}

$serviceName = "BackendApi"
$displayName = "BackendApi API Service"
$description = "Service Windows pour l'API BackendApi"
$publishPath = (Resolve-Path "./publish").Path
$dotnetPath = (Get-Command dotnet).Source

Write-Host "`n=== Configuration du service ===" -ForegroundColor Cyan
Write-Host "Nom du service: $serviceName" -ForegroundColor Gray
Write-Host "Chemin de publication: $publishPath" -ForegroundColor Gray
Write-Host "Chemin dotnet: $dotnetPath" -ForegroundColor Gray

# Vérifier si le service existe déjà
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "`n⚠ Le service existe déjà" -ForegroundColor Yellow
    $action = Read-Host "Voulez-vous le supprimer et le recréer? (O/N)"
    if ($action -eq "O" -or $action -eq "o") {
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        sc.exe delete $serviceName | Out-Null
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Installation annulée" -ForegroundColor Yellow
        exit 0
    }
}

if (Test-Path $nssmPath) {
    # Utiliser NSSM (plus facile)
    Write-Host "`n=== Création du service avec NSSM ===" -ForegroundColor Cyan
    
    & $nssmPath install $serviceName $dotnetPath "BackendApi.dll"
    & $nssmPath set $serviceName AppDirectory $publishPath
    & $nssmPath set $serviceName DisplayName $displayName
    & $nssmPath set $serviceName Description $description
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    
    Write-Host "✓ Service créé avec NSSM" -ForegroundColor Green
} else {
    # Utiliser sc.exe
    Write-Host "`n=== Création du service avec sc.exe ===" -ForegroundColor Cyan
    
    $binPath = "`"$dotnetPath`" `"$publishPath\BackendApi.dll`""
    sc.exe create $serviceName binPath= $binPath DisplayName= $displayName start= auto
    sc.exe description $serviceName $description
    
    Write-Host "✓ Service créé avec sc.exe" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Service créé avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nCommandes utiles:" -ForegroundColor Yellow
Write-Host "  Démarrer:  Start-Service -Name $serviceName" -ForegroundColor White
Write-Host "  Arrêter:   Stop-Service -Name $serviceName" -ForegroundColor White
Write-Host "  Statut:    Get-Service -Name $serviceName" -ForegroundColor White
Write-Host "  Supprimer: sc.exe delete $serviceName" -ForegroundColor White
Write-Host "`nVoulez-vous démarrer le service maintenant? (O/N)" -ForegroundColor Yellow
$startNow = Read-Host

if ($startNow -eq "O" -or $startNow -eq "o") {
    Start-Service -Name $serviceName
    Start-Sleep -Seconds 2
    $status = Get-Service -Name $serviceName
    Write-Host "`nStatut du service: $($status.Status)" -ForegroundColor $(if ($status.Status -eq "Running") { "Green" } else { "Yellow" })
}

