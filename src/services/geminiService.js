import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// La librería usa v1beta por defecto. 
// Según el curl del usuario, el modelo correcto es 'gemini-flash-latest'
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Función genérica para llamar a Gemini.
 */
async function callGemini(prompt) {
  try {
    // Usamos 'gemini-flash-latest' que es el nombre que funciona en v1beta según el usuario
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
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
    console.error(`[GeminiService] Error:`, error);
    throw error;
  }
}

/**
 * Optimización completa (RAE + Estilo + SEO)
 */
export async function optimizeFull(fullPrompt) {
  return callGemini(fullPrompt);
}

/**
 * Solo inserción de enlaces contextuales
 */
export async function injectLinks(keywords, links, htmlContent) {
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

  return callGemini(prompt);
}
