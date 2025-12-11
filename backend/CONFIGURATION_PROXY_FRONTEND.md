# Configuration Proxy Frontend pour BackendApi

## 🔴 Problème

Le frontend React essaie d'appeler `http://localhost:3000/api/databases` mais le backend tourne sur `http://localhost:5192`.

## ✅ Solutions

### Solution 1: Configuration Proxy Vite (Recommandé)

Si vous utilisez **Vite** comme bundler, créez/modifiez le fichier `vite.config.js` dans votre projet frontend :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5192',
        changeOrigin: true,
        secure: false,
        // Optionnel: réécrire le chemin si nécessaire
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

**Avantages:**
- ✅ Toutes les requêtes `/api/*` sont automatiquement redirigées vers `http://localhost:5192`
- ✅ Pas besoin de changer le code frontend
- ✅ Fonctionne en développement et production

**Utilisation dans le code frontend:**
```javascript
// Au lieu de: fetch('http://localhost:5192/api/databases')
// Utilisez simplement:
fetch('/api/databases')
```

---

### Solution 2: Configuration Proxy Create React App

Si vous utilisez **Create React App**, créez un fichier `setupProxy.js` dans le dossier `src` :

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5192',
      changeOrigin: true,
      secure: false,
    })
  );
};
```

**Installation de la dépendance:**
```bash
npm install http-proxy-middleware --save-dev
```

---

### Solution 3: Utiliser directement l'URL complète (Simple mais moins flexible)

Modifiez votre fichier de configuration API dans le frontend :

```javascript
// apiFetcher.js ou config.js
const API_BASE_URL = 'http://localhost:5192';

// Utilisation
fetch(`${API_BASE_URL}/api/databases`)
```

**Avantages:**
- ✅ Simple et direct
- ✅ Pas de configuration supplémentaire

**Inconvénients:**
- ⚠️ Nécessite de changer toutes les URLs dans le code
- ⚠️ Problèmes CORS possibles (mais déjà configuré dans le backend)

---

## 🔧 Configuration selon votre setup

### Si vous utilisez Vite

1. **Créez/modifiez `vite.config.js`** à la racine du projet frontend :
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5192',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

2. **Redémarrez le serveur de développement:**
```bash
npm run dev
# ou
yarn dev
```

3. **Dans votre code, utilisez simplement `/api` :**
```javascript
// ✅ Correct avec proxy
fetch('/api/databases')

// ❌ Ne fonctionne pas sans proxy
fetch('http://localhost:3000/api/databases')
```

---

### Si vous utilisez Create React App

1. **Installez http-proxy-middleware:**
```bash
npm install http-proxy-middleware --save-dev
```

2. **Créez `src/setupProxy.js` :**
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5192',
      changeOrigin: true,
    })
  );
};
```

3. **Redémarrez le serveur:**
```bash
npm start
```

---

## 📝 Exemple de code frontend corrigé

### Avant (ne fonctionne pas)
```javascript
// ❌ Appelle http://localhost:3000/api/databases
fetch('/api/databases')
```

### Après avec proxy Vite
```javascript
// ✅ Avec proxy configuré, redirige automatiquement vers http://localhost:5192/api/databases
fetch('/api/databases')
```

### Après sans proxy (URL complète)
```javascript
// ✅ Appelle directement le backend
const API_BASE_URL = 'http://localhost:5192';
fetch(`${API_BASE_URL}/api/databases`)
```

---

## 🧪 Test de la configuration

1. **Vérifiez que le backend est démarré:**
```powershell
# Dans le dossier BackendApi
.\check-status.ps1
```

2. **Testez directement le backend:**
```bash
# Dans un navigateur ou avec curl
curl http://localhost:5192/api/databases
```

3. **Testez depuis le frontend:**
```javascript
// Dans la console du navigateur (F12)
fetch('/api/databases')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## ⚠️ Erreurs courantes

### Erreur 500 Internal Server Error

**Causes possibles:**
1. Le backend n'est pas démarré
2. Problème de connexion à la base de données MySQL
3. Erreur dans le code backend

**Solution:**
1. Vérifiez les logs du backend dans la console où vous avez lancé `dotnet run`
2. Vérifiez que MySQL est démarré
3. Vérifiez la chaîne de connexion dans `appsettings.json`

### Erreur CORS

**Si vous voyez une erreur CORS:**
- Le backend a déjà CORS configuré pour accepter toutes les origines
- Si le problème persiste, vérifiez que le backend est bien démarré

### Proxy ne fonctionne pas

**Vérifications:**
1. Le fichier `vite.config.js` est bien à la racine du projet frontend
2. Le serveur de développement a été redémarré après modification
3. Vous utilisez bien `/api` et non `http://localhost:3000/api`

---

## 🚀 Configuration recommandée pour production

Pour la production, utilisez une variable d'environnement :

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5192',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**Fichier `.env` pour le développement:**
```
VITE_API_URL=http://localhost:5192
```

**Fichier `.env.production` pour la production:**
```
VITE_API_URL=https://api.votre-domaine.com
```

---

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs du backend (console où `dotnet run` est exécuté)
2. Vérifiez la console du navigateur (F12)
3. Testez directement le backend avec curl ou Postman

