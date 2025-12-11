<template>
  <div :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- Sélecteur de langue -->
    <div style="text-align: right; margin-bottom: 20px;">
      <button 
        @click="lang = 'fr'"
        :style="{ 
          fontWeight: lang === 'fr' ? 'bold' : 'normal',
          backgroundColor: lang === 'fr' ? '#007bff' : '#f0f0f0'
        }"
      >
        Français
      </button>
      <button 
        @click="lang = 'ar'"
        :style="{ 
          fontWeight: lang === 'ar' ? 'bold' : 'normal',
          backgroundColor: lang === 'ar' ? '#007bff' : '#f0f0f0'
        }"
      >
        العربية
      </button>
    </div>

    <!-- Liste des bâtiments -->
    <div v-if="loading">Chargement...</div>
    <div v-else>
      <h1>{{ lang === 'fr' ? 'Liste des Bâtiments' : 'قائمة المباني' }}</h1>
      
      <div 
        v-for="batiment in batiments" 
        :key="batiment.numbat"
        style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc;"
      >
        <h2>{{ t(batiment, 'libelleCentre') }}</h2>
        <p>
          <strong>{{ lang === 'fr' ? 'Adresse:' : 'العنوان:' }}</strong>
          {{ t(batiment, 'adresse') }}
        </p>
        <p>
          <strong>{{ lang === 'fr' ? 'Bâtiment:' : 'المبنى:' }}</strong>
          {{ t(batiment, 'libellebat') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { getTranslatedField } from './translation-helper';

const lang = ref('fr');
const batiments = ref([]);
const loading = ref(true);

// Fonction de traduction
const t = (item, field) => getTranslatedField(item, field, lang.value);

onMounted(async () => {
  // Récupérer la langue depuis localStorage
  const savedLang = localStorage.getItem('lang') || 'fr';
  lang.value = savedLang;
  
  try {
    const res = await axios.get('/api/batiments', {
      params: { codeuser: 'USER001' }
    });
    batiments.value = res.data.batiments;
    loading.value = false;
  } catch (error) {
    console.error('Erreur:', error);
    loading.value = false;
  }
});

// Sauvegarder la langue quand elle change
watch(lang, (newLang) => {
  localStorage.setItem('lang', newLang);
});
</script>




