// Heurística simple para contar sílabas en español
const countSyllables = (word) => {
  word = word.toLowerCase().replace(/[^a-zñáéíóúü]/g, '');
  if (word.length <= 3) return 1;
  return word.split(/[aeiouáéíóúü]+/g).length - 1;
};

const calculateReadability = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const wordCount = words.length || 1;
  
  let syllables = 0;
  words.forEach(w => syllables += countSyllables(w));

  // Índice de Flesch-Szigriszt (Adaptado al español)
  const score = 206.84 - 60 * (syllables / wordCount) - 1.02 * (wordCount / sentences);
  
  if (score > 80) return { label: 'Muy fácil', score };
  if (score > 60) return { label: 'Fácil', score };
  if (score > 50) return { label: 'Normal', score };
  if (score > 30) return { label: 'Difícil', score };
  return { label: 'Muy difícil', score };
};

/**
 * @param {string} content - HTML del editor.
 * @param {string} level - Nivel de optimización (Leve, Moderado, Fuerte).
 * @param {string[]} brandKeywords - Keywords de la marca.
 * @param {string[]} semanticKeywords - Keywords semánticas LSI.
 * @param {object} settings - Configuración de la app.
 * @param {boolean} settings.enableReadability - Si el módulo de legibilidad está activo.
 * @param {boolean} settings.enableLSI - Si el módulo de entidades LSI está activo.
 * @param {number} settings.scoreThreshold - Umbral para considerar "verde" (ej: 70, 80, 90).
 */
export const analyzeSEO = (content, level, brandKeywords, semanticKeywords = [], settings = {}) => {
  const enableReadability = settings.enableReadability !== false;
  const enableLSI = settings.enableLSI !== false;

  const rawText = content.replace(/<[^>]*>/g, ' '); 
  const words = rawText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordCount = words.length;
  const mainKw = brandKeywords[0]?.toLowerCase() || '';

  let score = 0;
  let checks = [];
  let readability = null;
  let foundSemantics = [];

  // 1. Legibilidad (Flesch-Szigriszt) — Condicional
  if (enableReadability) {
    readability = calculateReadability(rawText);
    if (readability.score > 50) {
      score += 20;
      checks.push({ label: `Legibilidad: ${readability.label}`, status: 'pass' });
    } else {
      checks.push({ label: `Legibilidad: ${readability.label}`, status: 'fail' });
    }
  }

  // 2. Primer párrafo
  const firstParagraph = content.split(/<\/p>/)[0] || '';
  if (firstParagraph.toLowerCase().includes(mainKw)) {
    score += 15;
    checks.push({ label: 'Keyword en primer párrafo', status: 'pass' });
  } else {
    checks.push({ label: 'Keyword no detectada al inicio', status: 'fail' });
  }

  // 3. Entidades y Semántica (LSI) — Condicional
  if (enableLSI && semanticKeywords.length > 0) {
    foundSemantics = semanticKeywords.filter(kw => rawText.toLowerCase().includes(kw.toLowerCase()));
    const semanticPercentage = (foundSemantics.length / semanticKeywords.length) * 100;
    
    if (semanticPercentage >= 40) {
      score += 20;
      checks.push({ label: `Riqueza semántica (${foundSemantics.length} LSI)`, status: 'pass' });
    } else {
      checks.push({ label: `Faltan términos LSI (${foundSemantics.length}/${semanticKeywords.length})`, status: 'fail' });
    }
  }

  // 4. Densidad Keyword y Strong
  const kwMatches = (rawText.toLowerCase().match(new RegExp(mainKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const density = wordCount > 0 ? (kwMatches / wordCount) * 100 : 0;
  const hasStrongKw = content.toLowerCase().includes(`<strong>${mainKw}</strong>`);

  if (density >= 0.5 && density <= 2.5) {
    score += 15;
    checks.push({ label: `Densidad Keyword (${density.toFixed(1)}%)`, status: 'pass' });
  } else {
    checks.push({ label: `Densidad Keyword incorrecta`, status: 'fail' });
  }
  
  if (hasStrongKw) {
    score += 5;
    checks.push({ label: 'Keyword con strong OK', status: 'pass' });
  }

  // 5. Enlaces
  const linkCount = (content.match(/<a /g) || []).length;
  if (linkCount > 0) {
    score += 15;
    checks.push({ label: `Enlaces detectados (${linkCount})`, status: 'pass' });
  } else {
    checks.push({ label: 'Sin enlaces', status: 'fail' });
  }

  // 6. Extensión
  if (wordCount >= (level === 'Fuerte' ? 600 : 300)) {
    score += 10;
    checks.push({ label: 'Extensión adecuada', status: 'pass' });
  } else {
    checks.push({ label: 'Texto muy breve', status: 'fail' });
  }

  return { 
    score: Math.min(score, 100), 
    checks,
    readability,
    foundSemantics,
    totalSemantics: semanticKeywords.length
  };
};
