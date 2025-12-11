# Script pour déployer BackendApi sur un serveur
# Usage: .\deploy-to-server.ps1 -ServerPath "\\SERVEUR\C$\BackendApi" -ServerIP "192.168.1.100"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerPath,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [string]$Configuration = "Release"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Déploiement BackendApi sur Serveur" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "BackendApi.csproj")) {
    Write-Host "✗ Erreur: BackendApi.csproj non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'exécuter ce script depuis le dossier du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== 1. Publication du projet ===" -ForegroundColor Cyan
Write-Host "Configuration: $Configuration" -ForegroundColor Yellow

# Nettoyer l'ancien dossier publish
if (Test-Path "./publish") {
    Write-Host "Nettoyage de l'ancien dossier publish..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "./publish"
}

# Publier
dotnet publish -c $Configuration -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erreur lors de la publication" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Publication réussie" -ForegroundColor Green

Write-Host "`n=== 2. Vérification des fichiers ===" -ForegroundColor Cyan
$requiredFiles = @("BackendApi.dll", "appsettings.json")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path "./publish/$file")) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "✗ Fichiers manquants: $($missingFiles -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Tous les fichiers requis sont présents" -ForegroundColor Green

Write-Host "`n=== 3. Copie sur le serveur ===" -ForegroundColor Cyan
Write-Host "Destination: $ServerPath" -ForegroundColor Yellow

# Créer le dossier sur le serveur s'il n'existe pas
if (-not (Test-Path $ServerPath)) {
    Write-Host "Création du dossier sur le serveur..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ServerPath -Force | Out-Null
}

# Copier les fichiers
try {
    Copy-Item -Path "./publish\*" -Destination $ServerPath -Recurse -Force
    Write-Host "✓ Fichiers copiés avec succès" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la copie: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Déploiement terminé!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nProchaines étapes sur le serveur:" -ForegroundColor Yellow
Write-Host "1. Vérifiez que .NET Runtime 8.0 est installé" -ForegroundColor White
Write-Host "2. Configurez appsettings.json avec les bonnes informations" -ForegroundColor White
Write-Host "3. Créez le service Windows (optionnel):" -ForegroundColor White
Write-Host "   .\start-api-service.ps1" -ForegroundColor Gray
Write-Host "4. Ou exécutez directement:" -ForegroundColor White
Write-Host "   cd $ServerPath" -ForegroundColor Gray
Write-Host "   dotnet BackendApi.dll" -ForegroundColor Gray
Write-Host "`nL'API sera accessible sur: http://$ServerIP:5192" -ForegroundColor Yellow
Write-Host "Swagger: http://$ServerIP:5192/swagger" -ForegroundColor Yellow

