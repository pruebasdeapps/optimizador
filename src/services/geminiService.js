import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Función genérica para llamar a Gemini con configuración dinámica.
 * @param {string} prompt - El prompt completo.
 * @param {object} options - Opciones de configuración.
 * @param {string} options.apiKey - Clave de API de Gemini.
 * @param {string} options.model - Nombre del modelo (ej: 'gemini-flash-latest').
 * @param {number} options.temperature - Temperatura de la IA (0.1 a 1.0).
 */
async function callGemini(prompt, options = {}) {
  const apiKey = options.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const modelName = options.model || 'gemini-flash-latest';
  const temperature = options.temperature ?? 0.3;

  if (!apiKey) {
    throw new Error('API Key de Gemini no configurada. Revisa la Configuración.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar markdown fences
    text = text
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return text;
  } catch (error) {
    console.error(`[GeminiService] Error con modelo ${modelName}:`, error);
    throw error;
  }
}

/**
 * Optimización completa (RAE + Estilo + SEO)
 */
export async function optimizeFull(fullPrompt, options = {}) {
  return callGemini(fullPrompt, options);
}

/**
 * Solo inserción de enlaces contextuales
 */
export async function injectLinks(keywords, links, htmlContent, options = {}) {
  const prompt = `Actúa como un experto en SEO editorial. Tu tarea es insertar enlaces internos de forma natural en el texto HTML proporcionado.

## Instrucciones:
1. Usa solo los enlaces proporcionados en la lista.
2. Crea anchors descriptivos y naturales que encajen semánticamente en el texto. No fuerces los enlaces.
3. Devuelve el HTML completo con los enlaces insertados.
4. Usa <strong> para las negritas si necesitas resaltar algo cerca del enlace.
5. NO modifiques el estilo ni la estructura general del texto, solo inserta los enlaces.

## Enlaces a insertar:
${links.map(l => `- ${l}`).join('\n')}

## Keywords de referencia (contexto):
${keywords.join(', ')}

## Formato de entrega:
Devuelve SOLO el código HTML resultante, sin bloques de código markdown ni explicaciones.

---
**Texto original:**
${htmlContent}`;

  return callGemini(prompt, options);
}
