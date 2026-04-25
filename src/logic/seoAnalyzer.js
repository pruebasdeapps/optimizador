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
  // 206.84 - 60 * (sílabas/palabras) - 1.02 * (palabras/frases)
  const score = 206.84 - 60 * (syllables / wordCount) - 1.02 * (wordCount / sentences);
  
  if (score > 80) return { label: 'Muy fácil', score };
  if (score > 60) return { label: 'Fácil', score };
  if (score > 50) return { label: 'Normal', score };
  if (score > 30) return { label: 'Difícil', score };
  return { label: 'Muy difícil', score };
};

export const analyzeSEO = (content, level, brandKeywords, semanticKeywords = []) => {
  const rawText = content.replace(/<[^>]*>/g, ' '); 
  const words = rawText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordCount = words.length;
  const mainKw = brandKeywords[0].toLowerCase();

  let score = 0;
  let checks = [];

  // 1. Legibilidad (Flesch-Szigriszt)
  const readability = calculateReadability(rawText);
  if (readability.score > 50) {
    score += 20;
    checks.push({ label: `Legibilidad: ${readability.label}`, status: 'pass' });
  } else {
    checks.push({ label: `Legibilidad: ${readability.label}`, status: 'fail' });
  }

  // 2. Primer párrafo
  const firstParagraph = content.split(/<\/p>/)[0] || '';
  if (firstParagraph.toLowerCase().includes(mainKw)) {
    score += 15;
    checks.push({ label: 'Keyword en primer párrafo', status: 'pass' });
  } else {
    checks.push({ label: 'Keyword no detectada al inicio', status: 'fail' });
  }

  // 3. Entidades y Semántica (LSI)
  const foundSemantics = semanticKeywords.filter(kw => rawText.toLowerCase().includes(kw.toLowerCase()));
  const semanticPercentage = (foundSemantics.length / semanticKeywords.length) * 100;
  
  if (semanticPercentage >= 40) {
    score += 20;
    checks.push({ label: `Riqueza semántica (${foundSemantics.length} LSI)`, status: 'pass' });
  } else {
    checks.push({ label: `Faltan términos LSI (${foundSemantics.length}/${semanticKeywords.length})`, status: 'fail' });
  }

  // 4. Densidad Keyword y Strong
  const kwMatches = (rawText.toLowerCase().match(new RegExp(mainKw, 'g')) || []).length;
  const density = (kwMatches / wordCount) * 100;
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

  // 5. Enlaces (Seguimiento de Follow/Nofollow se hará en la UI)
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
