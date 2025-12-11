# 🐛 Guide Rapide de Débogage .NET - Équivalent de `dd()` en PHP

## ⚡ Utilisation Rapide

### 1. Utiliser `DdHelper.Dd()` - Le plus simple (comme `dd()` en PHP)

```csharp
using BackendApi.Utilities;

// Dans votre méthode
DdHelper.Dd(variable, "Label optionnel"); // Arrête l'exécution et affiche
```

**Exemple :**
```csharp
[HttpPost("valider-journee")]
public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
{
    // Afficher et arrêter
    DdHelper.Dd(request, "Request reçue");
    
    // Afficher une propriété spécifique
    DdHelper.Dd(request.NomBaseStockSession, "Nom Base");
    
    // Afficher plusieurs variables
    DdHelper.Dd(request.NomBaseStockSession, request.DateJournee);
}
```

### 2. Utiliser `DdHelper.Dump()` - Sans arrêter (comme `dump()` en PHP)

```csharp
DdHelper.Dump(variable, "Label"); // Affiche mais continue l'exécution
```

### 3. Breakpoints dans VS Code

1. **Placer un breakpoint :** Cliquez à gauche du numéro de ligne ou `F9`
2. **Démarrer le débogage :** `F5`
3. **Navigation :**
   - `F10` : Ligne suivante
   - `F11` : Entrer dans la méthode
   - `Shift+F11` : Sortir de la méthode
   - `F5` : Continuer

### 4. Utiliser le Logger (déjà injecté)

```csharp
_logger.LogDebug("Valeur: {Valeur}", variable);
_logger.LogInformation("Request: {@Request}", request);
_logger.LogError(ex, "Erreur: {Message}", ex.Message);
```

## 📋 Comparaison Rapide

| Méthode | Syntaxe | Arrête l'exécution | Usage |
|---------|---------|-------------------|-------|
| `DdHelper.Dd()` | `DdHelper.Dd(var, "label")` | ✅ Oui | Comme `dd()` en PHP |
| `DdHelper.Dump()` | `DdHelper.Dump(var, "label")` | ❌ Non | Comme `dump()` en PHP |
| Breakpoint | `F9` sur la ligne | ✅ Oui (pause) | Débogage visuel |
| `Console.WriteLine()` | `Console.WriteLine(var)` | ❌ Non | Affichage simple |
| `_logger.LogDebug()` | `_logger.LogDebug("{var}", var)` | ❌ Non | Logging structuré |

## 🚀 Démarrage Rapide

1. **Ajoutez l'import :**
   ```csharp
   using BackendApi.Utilities;
   ```

2. **Utilisez dans votre code :**
   ```csharp
   DdHelper.Dd(maVariable);
   ```

3. **Exécutez en mode Debug :** L'application s'arrêtera et affichera la valeur

## 💡 Conseils

- ✅ Utilisez `DdHelper.Dd()` pour déboguer rapidement comme en PHP
- ✅ Utilisez des breakpoints pour un débogage approfondi
- ✅ Utilisez `_logger` pour le logging en production
- ✅ Les valeurs sont affichées dans la **Console** et la **fenêtre de débogage**

## 📖 Documentation Complète

Voir `DEBUG_GUIDE.md` pour plus de détails.











