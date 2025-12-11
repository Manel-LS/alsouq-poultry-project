# Script à exécuter SUR LE SERVEUR pour installer BackendApi
# Usage: .\install-on-server.ps1

param(
    [string]$InstallPath = "C:\BackendApi",
    [string]$ServiceName = "BackendApi"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation BackendApi sur Serveur" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "✗ Erreur: Ce script nécessite les droits administrateur" -ForegroundColor Red
    Write-Host "Exécutez PowerShell en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# Vérifier .NET Runtime
Write-Host "=== 1. Vérification de .NET Runtime ===" -ForegroundColor Cyan
try {
    $dotnetVersion = dotnet --version 2>&1
    $runtimes = dotnet --list-runtimes 2>&1
    
    if ($runtimes -like "*Microsoft.AspNetCore.App*") {
        Write-Host "✓ .NET Runtime installé: $dotnetVersion" -ForegroundColor Green
        Write-Host "✓ ASP.NET Core Runtime trouvé" -ForegroundColor Green
    } else {
        Write-Host "✗ ASP.NET Core Runtime non trouvé" -ForegroundColor Red
        Write-Host "Téléchargez depuis: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ .NET Runtime non installé" -ForegroundColor Red
    Write-Host "Téléchargez depuis: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    exit 1
}

# Vérifier que BackendApi.dll existe
Write-Host "`n=== 2. Vérification des fichiers ===" -ForegroundColor Cyan
if (-not (Test-Path "$InstallPath\BackendApi.dll")) {
    Write-Host "✗ BackendApi.dll non trouvé dans $InstallPath" -ForegroundColor Red
    Write-Host "Assurez-vous d'avoir copié les fichiers publiés dans ce dossier" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ BackendApi.dll trouvé" -ForegroundColor Green

# Vérifier appsettings.json
if (-not (Test-Path "$InstallPath\appsettings.json")) {
    Write-Host "⚠ appsettings.json non trouvé" -ForegroundColor Yellow
    Write-Host "Créez-le avec la configuration appropriée" -ForegroundColor Yellow
} else {
    Write-Host "✓ appsettings.json trouvé" -ForegroundColor Green
}

# Créer le dossier wwwroot s'il n'existe pas
if (-not (Test-Path "$InstallPath\wwwroot")) {
    New-Item -ItemType Directory -Path "$InstallPath\wwwroot" | Out-Null
    Write-Host "✓ Dossier wwwroot créé" -ForegroundColor Green
}

# Vérifier NSSM
Write-Host "`n=== 3. Vérification de NSSM ===" -ForegroundColor Cyan
$nssmPath = "C:\nssm\win64\nssm.exe"
$useNSSM = $false

if (Test-Path $nssmPath) {
    Write-Host "✓ NSSM trouvé" -ForegroundColor Green
    $useNSSM = $true
} else {
    Write-Host "⚠ NSSM non trouvé" -ForegroundColor Yellow
    Write-Host "NSSM facilite la création de services Windows" -ForegroundColor Gray
    Write-Host "Téléchargez depuis: https://nssm.cc/download" -ForegroundColor Yellow
    
    $installNSSM = Read-Host "Voulez-vous utiliser sc.exe à la place? (O/N)"
    if ($installNSSM -ne "O" -and $installNSSM -ne "o") {
        Write-Host "Installation annulée" -ForegroundColor Yellow
        exit 0
    }
}

# Créer le service
Write-Host "`n=== 4. Création du service Windows ===" -ForegroundColor Cyan
$dotnetPath = (Get-Command dotnet).Source

# Vérifier si le service existe déjà
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠ Le service existe déjà" -ForegroundColor Yellow
    $action = Read-Host "Voulez-vous le supprimer et le recréer? (O/N)"
    if ($action -eq "O" -or $action -eq "o") {
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        if ($useNSSM) {
            & $nssmPath remove $ServiceName confirm
        } else {
            sc.exe delete $ServiceName | Out-Null
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Installation annulée" -ForegroundColor Yellow
        exit 0
    }
}

if ($useNSSM) {
    Write-Host "Création du service avec NSSM..." -ForegroundColor Yellow
    & $nssmPath install $ServiceName $dotnetPath "BackendApi.dll"
    & $nssmPath set $ServiceName AppDirectory $InstallPath
    & $nssmPath set $ServiceName DisplayName "BackendApi API Service"
    & $nssmPath set $ServiceName Description "Service Windows pour l'API BackendApi"
    & $nssmPath set $ServiceName Start SERVICE_AUTO_START
    Write-Host "✓ Service créé avec NSSM" -ForegroundColor Green
} else {
    Write-Host "Création du service avec sc.exe..." -ForegroundColor Yellow
    $binPath = "`"$dotnetPath`" `"$InstallPath\BackendApi.dll`""
    sc.exe create $ServiceName binPath= $binPath DisplayName= "BackendApi API Service" start= auto
    sc.exe description $ServiceName "Service Windows pour l'API BackendApi"
    Write-Host "✓ Service créé avec sc.exe" -ForegroundColor Green
}

# Configurer le firewall
Write-Host "`n=== 5. Configuration du Firewall ===" -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "BackendApi HTTP" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    try {
        New-NetFirewallRule -DisplayName "BackendApi HTTP" -Direction Inbound -LocalPort 5192 -Protocol TCP -Action Allow | Out-Null
        Write-Host "✓ Règle de firewall créée (port 5192)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Impossible de créer la règle de firewall: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Règle de firewall existe déjà" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Installation terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nCommandes utiles:" -ForegroundColor Yellow
Write-Host "  Démarrer:  Start-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Arrêter:   Stop-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Statut:    Get-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Logs:      Get-EventLog -LogName Application -Source $ServiceName -Newest 20" -ForegroundColor White
Write-Host "`nVoulez-vous démarrer le service maintenant? (O/N)" -ForegroundColor Yellow
$startNow = Read-Host

if ($startNow -eq "O" -or $startNow -eq "o") {
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    $status = Get-Service -Name $ServiceName
    Write-Host "`nStatut du service: $($status.Status)" -ForegroundColor $(if ($status.Status -eq "Running") { "Green" } else { "Yellow" })
    
    if ($status.Status -eq "Running") {
        Write-Host "`n✓ Service démarré avec succès!" -ForegroundColor Green
        Write-Host "L'API est accessible sur: http://localhost:5192" -ForegroundColor Yellow
        Write-Host "Swagger: http://localhost:5192/swagger" -ForegroundColor Yellow
    }
}

