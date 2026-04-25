import * as Diff from 'diff';

/**
 * Compara el texto original con el optimizado y devuelve el HTML con el marcado de cambios.
 */
export const getDiffedHTML = (oldHTML, newHTML) => {
  // Para simplificar en esta fase, comparamos el texto plano
  // En una versión avanzada, compararíamos el árbol DOM
  const oldText = oldHTML.replace(/<[^>]*>/g, '\n');
  const newText = newHTML.replace(/<[^>]*>/g, '\n');

  const diff = Diff.diffWords(oldText, newText);
  
  let resultHTML = '';
  diff.forEach((part) => {
    const color = part.added ? 'var(--diff-add-text)' : part.removed ? 'var(--diff-remove-text)' : 'inherit';
    const bg = part.added ? 'var(--diff-add)' : part.removed ? 'var(--diff-remove)' : 'transparent';
    const decoration = part.removed ? 'line-through' : 'none';
    
    if (part.added || part.removed) {
      resultHTML += `<span style="color: ${color}; background-color: ${bg}; text-decoration: ${decoration}; padding: 0 2px; border-radius: 2px; cursor: pointer;" title="${part.added ? 'Nuevo' : 'Eliminado'}">${part.value}</span>`;
    } else {
      resultHTML += part.value;
    }
  });

  return resultHTML.replace(/\n/g, '<br>');
};

/**
 * Acepta todos los cambios eliminando el marcado visual.
 */
export const acceptAllChanges = (diffedHTML) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = diffedHTML;
  
  // Eliminar los nodos marcados como 'removed'
  const removed = tempDiv.querySelectorAll('span[style*="line-through"]');
  removed.forEach(el => el.remove());
  
  // Dejar solo el texto de los nodos marcados como 'added' (sin el span)
  const added = tempDiv.querySelectorAll('span');
  added.forEach(el => {
    const text = el.innerText;
    el.replaceWith(text);
  });

  return tempDiv.innerHTML;
};
