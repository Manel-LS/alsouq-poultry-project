# Guide de Débogage en .NET - Équivalent de `dd()` en PHP

Ce guide explique comment déboguer votre application .NET étape par étape, similaire à `dd()` en PHP/Laravel.

## 📋 Table des Matières

1. [Méthodes de Débogage](#méthodes-de-débogage)
2. [Utilisation de DdHelper](#utilisation-de-ddhelper)
3. [Breakpoints dans VS Code/Visual Studio](#breakpoints)
4. [Logging avec ILogger](#logging)
5. [Débogage Pas à Pas](#débogage-pas-à-pas)

---

## 🛠️ Méthodes de Débogage

### 1. **DdHelper.Dd()** - Équivalent de `dd()` en PHP ⭐ RECOMMANDÉ

La méthode `Dd()` arrête l'exécution et affiche la valeur, exactement comme `dd()` en PHP.

```csharp
using BackendApi.Utilities;

// Dans votre contrôleur
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    // Afficher une variable et arrêter
    DdHelper.Dd(request, "Request reçue");
    
    // Afficher plusieurs variables
    DdHelper.Dd(request.NomBaseStockSession, "Nom Base");
    DdHelper.Dd(request.DateJournee, "Date");
    
    // ... reste du code (ne sera jamais exécuté après Dd())
}
```

**Avantages :**
- ✅ Arrête l'exécution comme `dd()` en PHP
- ✅ Affiche les objets de manière lisible (JSON formaté)
- ✅ Montre le type et l'emplacement dans le code
- ✅ Fonctionne avec tous les types d'objets

### 2. **DdHelper.Dump()** - Équivalent de `dump()` en PHP

Affiche la valeur sans arrêter l'exécution :

```csharp
DdHelper.Dump(request, "Request"); // Continue l'exécution
// Code suivant sera exécuté
```

### 3. **Console.WriteLine()** - Affichage simple

```csharp
Console.WriteLine($"Valeur: {request.NomBaseStockSession}");
Console.WriteLine($"Request complète: {JsonSerializer.Serialize(request)}");
```

### 4. **ILogger** - Logging structuré

Vous avez déjà `ILogger` injecté dans vos contrôleurs :

```csharp
_logger.LogInformation("Nom Base: {NomBase}", request.NomBaseStockSession);
_logger.LogDebug("Request complète: {@Request}", request);
_logger.LogError("Erreur: {Error}", ex.Message);
```

### 5. **Debugger.Break()** - Pause manuelle

```csharp
using System.Diagnostics;

// Arrête l'exécution et ouvre le débogueur
Debugger.Break();

// Afficher dans la fenêtre de débogage
Debug.WriteLine($"Valeur: {request.NomBaseStockSession}");
```

---

## 🎯 Breakpoints

### Dans VS Code :

1. **Placer un breakpoint :**
   - Cliquez à gauche du numéro de ligne (un point rouge apparaît)
   - Ou appuyez sur `F9` sur la ligne

2. **Démarrer le débogage :**
   - Appuyez sur `F5`
   - Ou allez dans Run > Start Debugging
   - Ou créez un fichier `.vscode/launch.json` (voir ci-dessous)

3. **Navigation :**
   - `F10` : Step Over (ligne suivante)
   - `F11` : Step Into (entrer dans la méthode)
   - `Shift+F11` : Step Out (sortir de la méthode)
   - `F5` : Continue (reprendre)

### Configuration launch.json pour VS Code

Créez le fichier `.vscode/launch.json` :

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": ".NET Core Launch (web)",
            "type": "coreclr",
            "request": "launch",
            "preLaunchTask": "build",
            "program": "${workspaceFolder}/bin/Debug/net8.0/BackendApi.dll",
            "args": [],
            "cwd": "${workspaceFolder}",
            "stopAtEntry": false,
            "serverReadyAction": {
                "action": "openExternally",
                "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
            },
            "env": {
                "ASPNETCORE_ENVIRONMENT": "Development"
            },
            "sourceFileMap": {
                "/Views": "${workspaceFolder}/Views"
            }
        },
        {
            "name": ".NET Core Attach",
            "type": "coreclr",
            "request": "attach"
        }
    ]
}
```

---

## 📝 Logging avec ILogger

Votre contrôleur a déjà `ILogger` injecté. Utilisez-le ainsi :

```csharp
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    _logger.LogInformation("Début de validation pour: {NomBase}", request.NomBaseStockSession);
    
    try
    {
        // Votre code
        _logger.LogDebug("Données reçues: {@Request}", request);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erreur lors de la validation");
        throw;
    }
}
```

**Niveaux de log :**
- `LogTrace` : Détails très fins
- `LogDebug` : Informations de débogage
- `LogInformation` : Informations générales
- `LogWarning` : Avertissements
- `LogError` : Erreurs
- `LogCritical` : Erreurs critiques

---

## 🔍 Débogage Pas à Pas

### Méthode 1 : Utiliser DdHelper.Dd()

```csharp
[HttpPost("valider-journee")]
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    // Étape 1 : Vérifier ce qui est reçu
    DdHelper.Dd(request, "1. Request initiale");
    
    // Étape 2 : Vérifier une propriété spécifique
    DdHelper.Dd(request.NomBaseStockSession, "2. Nom Base");
    
    // Étape 3 : Vérifier après traitement
    var processedData = ProcessData(request);
    DdHelper.Dd(processedData, "3. Données traitées");
}
```

### Méthode 2 : Utiliser des Breakpoints

1. Placez un breakpoint sur la première ligne de votre méthode
2. Démarrez le débogage (`F5`)
3. Utilisez `F10` pour avancer ligne par ligne
4. Survolez les variables pour voir leur valeur
5. Utilisez la **Watch Window** pour surveiller des variables spécifiques

### Méthode 3 : Combinaison Breakpoint + DdHelper

```csharp
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    // Breakpoint ici - inspectez 'request' dans le débogueur
    if (string.IsNullOrWhiteSpace(request.NomBaseStockSession))
    {
        // Utilisez DdHelper pour voir pourquoi c'est vide
        DdHelper.Dd(request, "Request vide détectée");
        return BadRequest();
    }
}
```

---

## 💡 Exemples Pratiques

### Exemple 1 : Déboguer une requête API

```csharp
[HttpPost("valider-journee")]
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    // Voir exactement ce qui est reçu
    DdHelper.Dd(request);
    
    // Voir les valeurs individuelles
    DdHelper.Dump(request.NomBaseStockSession, "Nom Base");
    DdHelper.Dump(request.DateJournee, "Date");
    
    return Ok();
}
```

### Exemple 2 : Déboguer une requête SQL

```csharp
var query = "SELECT * FROM table WHERE id = @id";
DdHelper.Dump(query, "SQL Query");
DdHelper.Dump(parameters, "Parameters");

var results = await db.QueryAsync(query, parameters);
DdHelper.Dd(results, "Résultats SQL");
```

### Exemple 3 : Déboguer une boucle

```csharp
foreach (var item in items)
{
    DdHelper.Dump(item, $"Item {items.IndexOf(item)}");
    // Ou utilisez un breakpoint conditionnel
}
```

---

## ⚙️ Configuration

### Activer les logs détaillés dans appsettings.Development.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Debug"
    }
  }
}
```

---

## 🚀 Résumé Rapide

| Méthode | Usage | Arrête l'exécution |
|---------|-------|-------------------|
| `DdHelper.Dd()` | ⭐ Comme `dd()` en PHP | ✅ Oui |
| `DdHelper.Dump()` | Comme `dump()` en PHP | ❌ Non |
| `Console.WriteLine()` | Affichage simple | ❌ Non |
| `_logger.LogDebug()` | Logging structuré | ❌ Non |
| Breakpoints (`F9`) | Débogage visuel | ✅ Oui (pause) |
| `Debugger.Break()` | Pause manuelle | ✅ Oui |

---

## 📚 Ressources

- [Documentation Microsoft - Débogage](https://docs.microsoft.com/dotnet/core/diagnostics/debugging)
- [VS Code - Débogage .NET](https://code.visualstudio.com/docs/languages/csharp#_debugging)

---

**Note :** `DdHelper.Dd()` utilise `Debugger.Break()` qui ne fonctionne qu'en mode Debug. En mode Release, il n'arrêtera pas l'exécution mais affichera toujours les valeurs dans la console.











