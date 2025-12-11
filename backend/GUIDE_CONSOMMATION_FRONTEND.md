# Guide de Consommation de l'API BackendApi pour le Frontend

## 📍 URL de Base de l'API

```
http://localhost:5192
```

**En production**, remplacez `localhost:5192` par l'URL de votre serveur :
```
http://VOTRE_SERVEUR_IP:5192
ou
https://api.votre-domaine.com
```

---

## ✅ Configuration CORS

✅ **CORS est déjà configuré** pour accepter toutes les origines (`AllowAnyOrigin`), méthodes (`AllowAnyMethod`) et headers (`AllowAnyHeader`).

Le frontend peut donc faire des requêtes depuis n'importe quelle origine sans problème.

---

## 🔐 Authentification JWT

L'API utilise l'authentification JWT. Voici comment l'utiliser :

### 1. Login (Obtenir le token)

**Endpoint:** `POST /api/login`

**Body:**
```json
{
  "login": "votre_login",
  "motpasse": "votre_mot_de_passe",
  "database_choice": "CODE_DB"
}
```

**Réponse:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "code": "USER001",
    "login": "admin",
    "libelle": "Administrateur",
    "actif": 1
  },
  "database_choice": "CODE_DB",
  "available_databases": [...]
}
```

### 2. Utiliser le token dans les requêtes

Ajoutez le token dans le header `Authorization` :

```
Authorization: Bearer VOTRE_TOKEN_JWT
```

---

## 📚 Exemples de Consommation

### 🌐 JavaScript / Fetch API (Vanilla JS)

```javascript
// Configuration de base
const API_BASE_URL = 'http://localhost:5192';

// Fonction pour obtenir le token depuis localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Exemple 1: Login
async function login(login, motpasse, databaseChoice) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: login,
        motpasse: motpasse,
        database_choice: databaseChoice
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Sauvegarder le token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('database_choice', data.database_choice);
      return data;
    } else {
      throw new Error(data.error || 'Erreur de connexion');
    }
  } catch (error) {
    console.error('Erreur login:', error);
    throw error;
  }
}

// Exemple 2: Récupérer la liste des bons d'entrée
async function getStockEntries(numcentre, numbat, nomBaseStockSession, numlot = null, codeuser = null) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token non trouvé. Veuillez vous connecter.');
    }

    const params = new URLSearchParams({
      numcentre: numcentre,
      numbat: numbat,
      nomBaseStockSession: nomBaseStockSession
    });
    
    if (numlot) params.append('numlot', numlot);
    if (codeuser) params.append('codeuser', codeuser);

    const response = await fetch(`${API_BASE_URL}/api/liste-stock-entry?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur récupération stock entries:', error);
    throw error;
  }
}

// Exemple 3: Récupérer les bases de données disponibles
async function getDatabases() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/databases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur récupération databases:', error);
    throw error;
  }
}

// Utilisation
(async () => {
  // 1. Se connecter
  await login('admin', 'password', 'DB001');
  
  // 2. Récupérer les données
  const stockEntries = await getStockEntries('CENTRE001', 'BAT001', 'SOCERP');
  console.log('Stock entries:', stockEntries);
})();
```

---

### ⚛️ React avec Axios

```jsx
import axios from 'axios';

// Configuration Axios
const api = axios.create({
  baseURL: 'http://localhost:5192',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Hook React pour l'authentification
export const useAuth = () => {
  const login = async (login, motpasse, databaseChoice) => {
    try {
      const response = await api.post('/api/login', {
        login,
        motpasse,
        database_choice: databaseChoice
      });
      
      if (response.data.status === 'success') {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('database_choice', response.data.database_choice);
        return response.data;
      }
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('database_choice');
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('authToken');
  };

  return { login, logout, isAuthenticated };
};

// Hook React pour récupérer les stock entries
export const useStockEntries = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockEntries = async (numcentre, numbat, nomBaseStockSession, numlot = null, codeuser = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        numcentre,
        numbat,
        nomBaseStockSession
      };
      
      if (numlot) params.numlot = numlot;
      if (codeuser) params.codeuser = codeuser;

      const response = await api.get('/api/liste-stock-entry', { params });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchStockEntries };
};

// Exemple d'utilisation dans un composant
function StockEntryList() {
  const { fetchStockEntries, data, loading, error } = useStockEntries();
  const [numcentre, setNumcentre] = useState('');
  const [numbat, setNumbat] = useState('');
  const [nomBaseStockSession, setNomBaseStockSession] = useState('SOCERP');

  const handleFetch = async () => {
    try {
      await fetchStockEntries(numcentre, numbat, nomBaseStockSession);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div>
      <input 
        value={numcentre} 
        onChange={(e) => setNumcentre(e.target.value)} 
        placeholder="Numéro centre"
      />
      <input 
        value={numbat} 
        onChange={(e) => setNumbat(e.target.value)} 
        placeholder="Numéro bâtiment"
      />
      <button onClick={handleFetch}>Charger</button>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}
      {data && (
        <div>
          <h2>Résultats ({data.count} entrées)</h2>
          {data.data.map((entry, index) => (
            <div key={index}>
              <p>Numéro: {entry.nummvt}</p>
              <p>Fournisseur: {entry.libelleFournisseur}</p>
              <p>Date: {entry.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 🅰️ Angular

```typescript
// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5192';
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    // Récupérer le token depuis localStorage au démarrage
    const token = localStorage.getItem('authToken');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.tokenSubject.value || localStorage.getItem('authToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  login(login: string, motpasse: string, databaseChoice: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/login`, {
      login,
      motpasse,
      database_choice: databaseChoice
    }).pipe(
      tap((response: any) => {
        if (response.status === 'success') {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('database_choice', response.database_choice);
          this.tokenSubject.next(response.token);
        }
      })
    );
  }

  getStockEntries(
    numcentre: string,
    numbat: string,
    nomBaseStockSession: string,
    numlot?: string,
    codeuser?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('numcentre', numcentre)
      .set('numbat', numbat)
      .set('nomBaseStockSession', nomBaseStockSession);
    
    if (numlot) params = params.set('numlot', numlot);
    if (codeuser) params = params.set('codeuser', codeuser);

    return this.http.get(`${this.baseUrl}/api/liste-stock-entry`, {
      headers: this.getHeaders(),
      params
    });
  }

  getDatabases(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/databases`, {
      headers: this.getHeaders()
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('database_choice');
    this.tokenSubject.next(null);
  }
}
```

```typescript
// stock-entry.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-stock-entry',
  template: `
    <div>
      <input [(ngModel)]="numcentre" placeholder="Numéro centre" />
      <input [(ngModel)]="numbat" placeholder="Numéro bâtiment" />
      <button (click)="loadData()">Charger</button>

      <div *ngIf="loading">Chargement...</div>
      <div *ngIf="error" style="color: red;">Erreur: {{ error }}</div>
      
      <div *ngIf="data">
        <h2>Résultats ({{ data.count }} entrées)</h2>
        <div *ngFor="let entry of data.data">
          <p>Numéro: {{ entry.nummvt }}</p>
          <p>Fournisseur: {{ entry.libelleFournisseur }}</p>
        </div>
      </div>
    </div>
  `
})
export class StockEntryComponent implements OnInit {
  numcentre = '';
  numbat = '';
  nomBaseStockSession = 'SOCERP';
  data: any = null;
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Charger les données au démarrage si nécessaire
  }

  loadData() {
    this.loading = true;
    this.error = null;
    
    this.apiService.getStockEntries(
      this.numcentre,
      this.numbat,
      this.nomBaseStockSession
    ).subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
```

---

### 🟢 Vue.js avec Axios

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5192',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  async login(login, motpasse, databaseChoice) {
    const response = await api.post('/api/login', {
      login,
      motpasse,
      database_choice: databaseChoice
    });
    
    if (response.data.status === 'success') {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('database_choice', response.data.database_choice);
    }
    
    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('database_choice');
  }
};

export const stockEntryService = {
  async getStockEntries(numcentre, numbat, nomBaseStockSession, numlot = null, codeuser = null) {
    const params = {
      numcentre,
      numbat,
      nomBaseStockSession
    };
    
    if (numlot) params.numlot = numlot;
    if (codeuser) params.codeuser = codeuser;

    const response = await api.get('/api/liste-stock-entry', { params });
    return response.data;
  }
};

export default api;
```

```vue
<!-- StockEntryList.vue -->
<template>
  <div>
    <input v-model="numcentre" placeholder="Numéro centre" />
    <input v-model="numbat" placeholder="Numéro bâtiment" />
    <button @click="loadData" :disabled="loading">
      {{ loading ? 'Chargement...' : 'Charger' }}
    </button>

    <div v-if="error" style="color: red;">
      Erreur: {{ error }}
    </div>

    <div v-if="data">
      <h2>Résultats ({{ data.count }} entrées)</h2>
      <div v-for="entry in data.data" :key="entry.nummvt">
        <p>Numéro: {{ entry.nummvt }}</p>
        <p>Fournisseur: {{ entry.libelleFournisseur }}</p>
        <p>Date: {{ entry.date }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { stockEntryService } from '@/services/api';

const numcentre = ref('');
const numbat = ref('');
const nomBaseStockSession = ref('SOCERP');
const data = ref(null);
const loading = ref(false);
const error = ref(null);

const loadData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const result = await stockEntryService.getStockEntries(
      numcentre.value,
      numbat.value,
      nomBaseStockSession.value
    );
    data.value = result;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 📋 Endpoints Disponibles

### Authentification
- `POST /api/login` - Connexion et obtention du token JWT
- `GET /api/databases` - Liste des bases de données disponibles

### Stock Entries
- `GET /api/liste-stock-entry` - Liste des bons d'entrée
- `GET /api/detail-stock-entry/{nummvt}` - Détails d'un bon d'entrée
- `POST /api/stock-entry` - Créer un bon d'entrée

### Autres Controllers
- `GET /api/batiments` - Liste des bâtiments
- `GET /api/fournisseurs` - Liste des fournisseurs
- `GET /api/lots` - Liste des lots
- `GET /api/reports/...` - Rapports

---

## 🔍 Documentation Swagger

Une fois l'API démarrée, accédez à la documentation Swagger interactive :

```
http://localhost:5192/swagger
```

Swagger vous permet de :
- ✅ Voir tous les endpoints disponibles
- ✅ Tester les endpoints directement depuis le navigateur
- ✅ Voir les modèles de données (DTOs)
- ✅ Comprendre les paramètres requis

---

## ⚠️ Points Importants

1. **Token JWT** : Le token expire après 8 heures. Gérez le renouvellement si nécessaire.

2. **CORS** : Déjà configuré pour accepter toutes les origines. Pas besoin de configuration supplémentaire.

3. **Format des données** : L'API retourne les données en JSON avec le format camelCase.

4. **Gestion des erreurs** : Toutes les réponses d'erreur suivent ce format :
   ```json
   {
     "success": false,
     "error": "Message d'erreur",
     "message": "Détails supplémentaires"
   }
   ```

5. **Paramètres requis** : Certains endpoints nécessitent des paramètres obligatoires. Vérifiez la documentation Swagger pour les détails.

---

## 🚀 Exemple Complet : Application React Simple

```jsx
// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5192';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [stockEntries, setStockEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Fonction de login
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        login: formData.get('login'),
        motpasse: formData.get('motpasse'),
        database_choice: formData.get('database_choice')
      });

      if (response.data.status === 'success') {
        setToken(response.data.token);
        setIsLoggedIn(true);
        localStorage.setItem('authToken', response.data.token);
        alert('Connexion réussie !');
      }
    } catch (error) {
      alert('Erreur de connexion: ' + (error.response?.data?.error || error.message));
    }
  };

  // Fonction pour charger les stock entries
  const loadStockEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/liste-stock-entry`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          numcentre: 'CENTRE001',
          numbat: 'BAT001',
          nomBaseStockSession: 'SOCERP'
        }
      });

      setStockEntries(response.data.data || []);
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Connexion</h1>
        <form onSubmit={handleLogin}>
          <input name="login" placeholder="Login" required />
          <br /><br />
          <input name="motpasse" type="password" placeholder="Mot de passe" required />
          <br /><br />
          <input name="database_choice" placeholder="Code base de données" required />
          <br /><br />
          <button type="submit">Se connecter</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Liste des Bons d'Entrée</h1>
      <button onClick={loadStockEntries} disabled={loading}>
        {loading ? 'Chargement...' : 'Charger les données'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        {stockEntries.map((entry, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <p><strong>Numéro:</strong> {entry.nummvt}</p>
            <p><strong>Fournisseur:</strong> {entry.libelleFournisseur}</p>
            <p><strong>Date:</strong> {entry.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

---

## 📞 Support

Pour plus d'informations, consultez :
- La documentation Swagger : `http://localhost:5192/swagger`
- Les exemples dans le dossier `frontend-examples/`

