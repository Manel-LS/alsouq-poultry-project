# Guide de Dépannage - BackendApi

## Problème : L'application ne fonctionne pas sur le port 7054

### Étape 1 : Vérifier que .NET est installé
```powershell
dotnet --version
```
**Doit afficher :** 8.0.x ou supérieur

### Étape 2 : Vérifier que vous êtes dans le bon dossier
```powershell
cd D:\xampp\htdocs\backend_project\dotnet\BackendApi
ls BackendApi.csproj
```
**Doit afficher :** Le fichier BackendApi.csproj

### Étape 3 : Restaurer les packages
```powershell
dotnet restore
```

### Étape 4 : Builder le projet
```powershell
dotnet build
```

### Étape 5 : Lancer avec le profil HTTP explicite
```powershell
dotnet run --launch-profile http
```

OU simplement :
```powershell
dotnet run
```

### Étape 6 : Tester la connexion
Ouvrir dans le navigateur : **http://localhost:7054/swagger**

Ou utiliser le script de test :
```powershell
.\tester-port.ps1
```

---

## Problèmes courants

### 1. "Le port 7054 est déjà utilisé"
**Solution :**
```powershell
# Trouver le processus qui utilise le port
Get-NetTCPConnection -LocalPort 7054 | Select-Object OwningProcess

# Arrêter le processus (remplacer PID par le numéro)
Stop-Process -Id PID -Force
```

### 2. "dotnet n'est pas reconnu"
**Solution :**
- Vérifier que .NET SDK 8.0 est installé
- Fermer et rouvrir PowerShell
- Vérifier le PATH : `$env:PATH`

### 3. "Erreur de connexion à la base de données"
**Solution :**
- Vérifier que MySQL/XAMPP est démarré
- Vérifier la chaîne de connexion dans `appsettings.json`
- Tester la connexion MySQL manuellement

### 4. "L'application démarre mais n'est pas accessible"
**Solution :**
- Vérifier le pare-feu Windows
- Vérifier que le port 7054 n'est pas bloqué
- Essayer d'accéder via `http://127.0.0.1:7054/swagger`

### 5. "Avertissement HTTPS toujours présent"
**Solution :**
- Vérifier que `Program.cs` contient la condition pour désactiver HTTPS en développement
- Rebuilder le projet : `dotnet clean` puis `dotnet build`

---

## Commandes utiles

### Vérifier les processus sur le port 7054
```powershell
Get-NetTCPConnection -LocalPort 7054
```

### Arrêter tous les processus BackendApi
```powershell
Get-Process -Name "BackendApi" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Nettoyer et rebuilder
```powershell
dotnet clean
dotnet restore
dotnet build
```

### Voir les logs détaillés
```powershell
dotnet run --verbosity detailed
```

---

## Test rapide

Exécutez ce script pour diagnostiquer automatiquement :
```powershell
.\tester-port.ps1
```

