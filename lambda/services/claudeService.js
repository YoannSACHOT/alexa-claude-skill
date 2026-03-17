import Anthropic from "@anthropic-ai/sdk";

// Prompt système pour des réponses vocales naturelles en français
const SYSTEM_PROMPT =
  "Tu es un assistant vocal intelligent et amical. Tu réponds toujours en français, " +
  "de manière concise et naturelle pour être lu à voix haute. Limite tes réponses à " +
  "3-4 phrases maximum. N'utilise jamais de markdown, de listes à puces, d'URLs ou " +
  "de formatage visuel.";

// Nombre maximum de messages d'historique envoyés à Claude
const MAX_HISTORY_MESSAGES = 10;

// Timeout pour l'appel API (6s pour rester sous les 8s d'Alexa)
const API_TIMEOUT_MS = 6000;

const client = new Anthropic();

/**
 * Envoie une requête à Claude avec l'historique de conversation.
 * @param {string} query - La question de l'utilisateur
 * @param {Array} history - Historique des messages précédents [{role, content}]
 * @returns {Promise<string>} La réponse de Claude
 */
export async function askClaude(query, history = []) {
  // Construire les messages avec l'historique (limité aux N derniers)
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  const messages = [
    ...recentHistory,
    { role: "user", content: query },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      },
      { signal: controller.signal }
    );

    // Extraire le texte de la réponse
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join(" ");

    return text || "Désolé, je n'ai pas pu formuler une réponse.";
  } catch (error) {
    if (error.name === "AbortError" || controller.signal.aborted) {
      console.error("Timeout de l'appel Claude API après", API_TIMEOUT_MS, "ms");
      return "Désolé, la réponse a pris trop de temps. Peux-tu reformuler ta question plus simplement ?";
    }

    console.error("Erreur Claude API:", error.message);
    return "Désolé, j'ai rencontré un problème technique. Réessaie dans quelques instants.";
  } finally {
    clearTimeout(timeout);
  }
}
