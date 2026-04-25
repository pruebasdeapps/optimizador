/**
 * Servicio para la integración con Google Search Console API
 * Proporciona la arquitectura base para autenticación OAuth2 y extracción de datos.
 */

import { gapi } from 'gapi-script';

const SCOPES = 'https://www.googleapis.com/auth/webmasters.readonly';

export const initGapi = (clientId) => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: clientId,
        scope: SCOPES,
      }).then(() => {
        resolve(gapi.auth2.getAuthInstance());
      }).catch(err => {
        reject(err);
      });
    });
  });
};

/**
 * Obtiene los datos de rendimiento para una URL específica
 * @param {string} siteUrl - La URL de la propiedad en GSC
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 */
export const getSearchAnalytics = async (siteUrl, startDate, endDate) => {
  try {
    const response = await gapi.client.request({
      path: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      method: 'POST',
      body: {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: 10
      }
    });
    return response.result;
  } catch (error) {
    console.error('Error fetching GSC data:', error);
    throw error;
  }
};

/**
 * Lista todas las propiedades (sitios) disponibles en la cuenta
 */
export const listSites = async () => {
  try {
    const response = await gapi.client.request({
      path: 'https://www.googleapis.com/webmasters/v3/sites',
      method: 'GET'
    });
    return response.result.siteEntry || [];
  } catch (error) {
    console.error('Error listing GSC sites:', error);
    throw error;
  }
};
