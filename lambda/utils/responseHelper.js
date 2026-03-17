// Limite de caractères safe pour les réponses Alexa
const MAX_RESPONSE_LENGTH = 6000;

/**
 * Nettoie le texte pour une lecture vocale naturelle.
 * Supprime le markdown, les URLs et les caractères non prononçables.
 * @param {string} text - Texte brut à nettoyer
 * @returns {string} Texte nettoyé
 */
function cleanText(text) {
  return (
    text
      // Supprimer les blocs de code
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Supprimer le markdown (gras, italique, titres)
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Supprimer les URLs
      .replace(/https?:\/\/[^\s)]+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Supprimer les listes à puces
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Supprimer les caractères spéciaux non prononçables
      .replace(/[<>{}|\\^~]/g, "")
      // Normaliser les espaces
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

/**
 * Tronque intelligemment le texte à la limite Alexa.
 * Coupe à la dernière phrase complète avant la limite.
 * @param {string} text - Texte à tronquer
 * @returns {string} Texte tronqué
 */
function truncate(text) {
  if (text.length <= MAX_RESPONSE_LENGTH) {
    return text;
  }

  // Couper au dernier point/exclamation/interrogation avant la limite
  const truncated = text.substring(0, MAX_RESPONSE_LENGTH);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );

  if (lastSentenceEnd > 0) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // Fallback : couper au dernier espace
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "."
    : truncated + ".";
}

/**
 * Prépare la réponse pour Alexa : nettoyage, troncature et wrapping SSML.
 * @param {string} text - Réponse brute de Claude
 * @returns {string} Réponse SSML prête pour Alexa
 */
export function formatResponse(text) {
  const cleaned = cleanText(text);
  const truncated = truncate(cleaned);
  return truncated;
}

/**
 * Wrap le texte dans une balise SSML <speak>.
 * @param {string} text - Texte à wrapper
 * @returns {string} Texte SSML
 */
export function wrapSsml(text) {
  // Échapper les caractères réservés SSML
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return `<speak>${escaped}</speak>`;
}
