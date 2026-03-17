import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.SESSION_TABLE || "AlexaClaudeSessions";

// TTL de 24 heures en secondes
const TTL_SECONDS = 24 * 60 * 60;

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Récupère la session d'un utilisateur depuis DynamoDB.
 * @param {string} sessionId - Identifiant de la session Alexa
 * @returns {Promise<Array>} Liste des messages [{role, content}]
 */
export async function getSession(sessionId) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { sessionId },
      })
    );

    return result.Item?.messages || [];
  } catch (error) {
    console.error("Erreur lecture session DynamoDB:", error.message);
    return [];
  }
}

/**
 * Sauvegarde un échange (question + réponse) dans la session.
 * @param {string} sessionId - Identifiant de la session Alexa
 * @param {Array} messages - Liste complète des messages à sauvegarder
 */
export async function saveMessages(sessionId, messages) {
  const now = Math.floor(Date.now() / 1000);

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          sessionId,
          messages,
          lastUpdated: now,
          ttl: now + TTL_SECONDS,
        },
      })
    );
  } catch (error) {
    console.error("Erreur écriture session DynamoDB:", error.message);
  }
}

/**
 * Supprime la session d'un utilisateur.
 * @param {string} sessionId - Identifiant de la session Alexa
 */
export async function clearSession(sessionId) {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { sessionId },
      })
    );
  } catch (error) {
    console.error("Erreur suppression session DynamoDB:", error.message);
  }
}
