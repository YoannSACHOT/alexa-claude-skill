import Alexa from "ask-sdk-core";
import { askClaude } from "./services/claudeService.js";
import { getSession, saveMessages, clearSession } from "./services/sessionService.js";
import { formatResponse } from "./utils/responseHelper.js";

// --- Handlers ---

/** Handler pour le lancement de la skill */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speech =
      "Bonjour ! Je suis ton assistant propulsé par Claude. Pose-moi n'importe quelle question.";
    const reprompt = "Alors, qu'est-ce que tu veux savoir ?";

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};

/** Handler principal : envoie la question à Claude avec contexte de session */
const AskClaudeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AskClaudeIntent"
    );
  },
  async handle(handlerInput) {
    const query =
      handlerInput.requestEnvelope.request.intent.slots?.query?.value;

    if (!query) {
      return handlerInput.responseBuilder
        .speak("Je n'ai pas compris ta question. Peux-tu répéter ?")
        .reprompt("Pose-moi une question.")
        .getResponse();
    }

    const sessionId = handlerInput.requestEnvelope.session.sessionId;

    // Récupérer l'historique de conversation
    const history = await getSession(sessionId);

    // Appeler Claude avec la question et l'historique
    const rawResponse = await askClaude(query, history);
    const response = formatResponse(rawResponse);

    // Sauvegarder l'échange dans la session
    const updatedHistory = [
      ...history,
      { role: "user", content: query },
      { role: "assistant", content: rawResponse },
    ];
    await saveMessages(sessionId, updatedHistory);

    return handlerInput.responseBuilder
      .speak(response)
      .reprompt("As-tu une autre question ?")
      .getResponse();
  },
};

/** Handler d'aide */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speech =
      "Je suis un assistant intelligent. Tu peux me poser n'importe quelle question " +
      "et je ferai de mon mieux pour y répondre. Par exemple, demande-moi d'expliquer " +
      "un concept, de raconter une histoire, ou de t'aider avec un problème.";

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt("Quelle est ta question ?")
      .getResponse();
  },
};

/** Handler pour arrêter/annuler la skill */
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  async handle(handlerInput) {
    // Nettoyer la session en quittant
    const sessionId = handlerInput.requestEnvelope.session.sessionId;
    await clearSession(sessionId);

    return handlerInput.responseBuilder
      .speak("Au revoir ! À bientôt.")
      .withShouldEndSession(true)
      .getResponse();
  },
};

/** Handler pour les requêtes non reconnues */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(
        "Je n'ai pas bien compris. Peux-tu reformuler ta question ?"
      )
      .reprompt("Essaie de me poser ta question autrement.")
      .getResponse();
  },
};

/** Handler de fin de session */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    const reason = handlerInput.requestEnvelope.request.reason;
    if (reason === "ERROR") {
      console.error(
        "Session terminée avec erreur:",
        handlerInput.requestEnvelope.request.error
      );
    }
    return handlerInput.responseBuilder.getResponse();
  },
};

/** Handler d'erreurs global */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error("Erreur non gérée:", error.message, error.stack);

    return handlerInput.responseBuilder
      .speak(
        "Désolé, une erreur s'est produite. Réessaie dans quelques instants."
      )
      .reprompt("Peux-tu répéter ta question ?")
      .getResponse();
  },
};

// --- Export du handler Lambda ---

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AskClaudeIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
