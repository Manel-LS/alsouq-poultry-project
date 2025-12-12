import apiFetcher from './apiFetcher.js';
import { API_ENDPOINTS } from '../config/api.js';

export const fetchBatiments = async () => {
  try {
    const result = await apiFetcher(API_ENDPOINTS.batiments, {
      method: 'GET',
      timeout: 10000,
    });

    if (result.success) {
      return result.data.batiments || result.data.data?.batiments || [];
    } else {
      console.error('Batiments API returned success: false', result.data?.error || result.error);
      throw new Error(result.data?.error || result.error || 'فشل في تحميل المباني');
    }
  } catch (error) {
    console.error('Error fetching batiments:', error);
    throw error;
  }
};
