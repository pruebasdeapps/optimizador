/**
 * Directrices maestras de optimización SEO y corrección RAE.
 */

const BASE_GUIDELINES = `
# Condicionantes de optimización SEO para textos

## Principio general de intervención

La aplicación debe trabajar siempre sobre el **contenido de partida proporcionado por el usuario**. El texto original será la base obligatoria de cualquier optimización y deberá conservarse en intención, enfoque, estructura general y sentido principal.

La optimización debe aplicar **solo los cambios necesarios** según el nivel seleccionado. No se debe reescribir, ampliar, reorganizar o transformar el texto más de lo imprescindible, salvo que el usuario lo solicite expresamente en la sección de **“Instrucciones adicionales”**.

En todos los niveles de optimización se deberán garantizar los siguientes criterios:
- Corrección lingüística, cohesión textual y coherencia interna.
- Claridad expositiva y naturalidad en la redacción.
- Respeto por el contenido original y adecuación al español estándar.
- Mantenimiento del tono y la intención comunicativa del texto de partida.
- Optimización proporcionada al nivel seleccionado y ausencia de cambios innecesarios.

La aplicación no debe sustituir el texto original por una versión completamente nueva. Debe intervenir sobre él con precisión, aplicando las mejoras de forma controlada y manteniendo siempre el contenido de partida como referencia principal.
`;

const LEVEL_DEFINITIONS = {
  Leve: `
# Nivel 1: Optimización leve (Intervención mínima)
## Objetivo
Corregir errores formales, mejorar la legibilidad básica y asegurar la normativa del español estándar (RAE/Libro de estilo 2018), sin alterar estructura, estilo o desarrollo de ideas.
## Alcance
- Corrección ortotipográfica, gramatical, puntuación, tildes y concordancias.
- Revisión de mayúsculas/minúsculas y signos ortográficos.
- Corrección de usos incorrectos del gerundio (posterioridad, especificativo, etc.).
- Mejora de frases confusas solo si es necesario para la comprensión.
## Restricciones estrictas
- NO añadir información ni ampliar explicaciones.
- NO reorganizar apartados ni reescribir bloques completos.
- NO cambiar el tono ni la intención comunicativa.
`,
  Moderado: `
# Nivel 2: Optimización moderada (Enriquecimiento natural)
## Objetivo
Incluye Nivel 1 + mejora semántica, conceptual y expresiva. Enriquecer el texto de forma natural sin alejarse del original.
## Alcance
- Todas las acciones de la optimización leve.
- Revisión de precisión conceptual y mejora de explicaciones poco desarrolladas.
- Ampliación moderada de ideas e incorporación de matices informativos.
- Enriquecimiento léxico (evitar repeticiones) y mejora de fluidez/cohesión.
- Ajuste de tono (profesional/divulgativo) y mejora SEO orgánica.
## Restricciones estrictas
- NO inventar datos ni introducir afirmaciones no verificadas.
- NO reescribir desde cero ni añadir bloques extensos ajenos al original.
- NO cambiar el enfoque principal ni el sentido de las ideas.
`,
  Fuerte: `
# Nivel 3: Optimización fuerte (Reescritura parcial controlada)
## Objetivo
Incluye Niveles 1 y 2 + reescritura parcial para mejorar estructura, evitar redundancias y reforzar la respuesta a encabezados.
## Alcance
- Todas las acciones de niveles leve y moderado.
- Reescritura parcial de frases o párrafos donde sea necesario para la claridad.
- Reorganización interna de ideas y ajuste de contenido a sus encabezados (H2, H3...).
- Eliminación de repeticiones entre secciones y refuerzo de la progresión lógica.
- Optimización SEO completa y mejora de la profundidad explicativa.
## Restricciones estrictas
- NO redactar un texto nuevo desde cero.
- NO eliminar ideas relevantes del contenido de partida.
- NO aplicar reescritura total salvo petición expresa del usuario.
`
};

const OPERATIONAL_LOGIC = `
# Regla de prioridad
La sección “Instrucciones adicionales” del usuario podrá modificar el alcance siempre que no contradiga la calidad. Si el usuario pide explícitamente una intervención mayor, se podrá exceder el nivel seleccionado. Si no indica nada, se respeta estrictamente el alcance del nivel.

# Formato de entrega
Devuelve únicamente el texto corregido en HTML puro. No incluyas explicaciones, comentarios ni bloques de código markdown (\`\`\`html).
`;

/**
 * Ensambla el prompt completo basado en el nivel y contenido.
 */
export function buildPrompt(keywords, links, htmlContent, customInstructions = '', level = 'Moderado') {
  const levelInstruction = LEVEL_DEFINITIONS[level] || LEVEL_DEFINITIONS.Moderado;
  
  return `
${BASE_GUIDELINES}
${levelInstruction}

# Tareas específicas de esta sesión:

## 1. Integración de Keywords
Integra de forma natural estas palabras en las secciones pertinentes sin forzar el texto:
${keywords.map(k => `- ${k}`).join('\n')}

## 2. Enlaces sugeridos (Contextualización)
Si es pertinente, inserta estos enlaces con anchors naturales:
${links.map(l => `- ${l}`).join('\n')}

## 3. Instrucciones adicionales del usuario
${customInstructions || 'Ninguna (respetar estrictamente el nivel seleccionado).'}

${OPERATIONAL_LOGIC}

---
**TEXTO DE PARTIDA A OPTIMIZAR (HTML):**
${htmlContent}
`;
}
