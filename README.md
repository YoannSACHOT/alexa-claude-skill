# Alexa Claude Skill

Une skill Alexa propulsee par [Claude](https://www.anthropic.com/claude) -- un assistant vocal conversationnel et intelligent en francais.

Posez n'importe quelle question en disant **"Alexa, demande a mon assistant claude..."** et obtenez des reponses naturelles et parlees grace a l'intelligence de Claude.

## Informations du projet

| Element | Valeur |
|---------|--------|
| **Skill ID** | `amzn1.ask.skill.1ca6fa67-a7d0-419b-9ed9-40cd7e8e6ca6` |
| **Lambda ARN** | `arn:aws:lambda:eu-west-3:905418417336:function:alexa-claude-skill-AlexaClaudeFunction-HT0fKFEjj06t` |
| **Region AWS** | `eu-west-3` (Paris) |
| **Statut** | En mode developpement, non publiee |

> **IMPORTANT** : ne jamais commiter de secrets (cles API, credentials AWS, mots de passe) dans le depot.

## Fonctionnalites

- **Conversation naturelle** -- Claude repond de maniere concise en francais parle, sans markdown ni formatage visuel
- **Contexte multi-tour** -- Se souvient de la conversation au sein d'une session (jusqu'a 10 echanges stockes dans DynamoDB)
- **Rapide et fiable** -- Timeout API de 6 secondes pour rester dans la limite de 8 secondes d'Alexa, avec replis gracieux
- **Serverless** -- Deploye en tant que Lambda AWS via SAM, avec DynamoDB pour le stockage de session (nettoyage automatique via TTL)

## Architecture

```
                  +--------------+
                  |  Alexa Echo  |
                  +------+-------+
                         | voix
                  +------v-------+
                  | Service Alexa|
                  +------+-------+
                         | JSON
              +----------v----------+
              |   AWS Lambda        |
              |   (Node.js 20 ESM)  |
              |                     |
              |  +---------------+  |
              |  | index.js      |  |  Handlers Alexa SDK
              |  | claudeService |--|--> API Claude (timeout 6s)
              |  | sessionService|--|--> DynamoDB (TTL 24h)
              |  | responseHelper|  |  Nettoyage et troncature du texte
              |  +---------------+  |
              +---------------------+
```

```
├── template.yaml                          # Template SAM (Lambda + DynamoDB)
├── lambda/
│   ├── index.js                           # Handlers de requetes Alexa
│   ├── services/
│   │   ├── claudeService.js               # Integration API Claude
│   │   └── sessionService.js              # Gestion de session DynamoDB
│   └── utils/
│       └── responseHelper.js              # Formatage des reponses pour la voix
└── skill-package/
    └── interactionModels/custom/
        └── fr-FR.json                     # Modele d'interaction en francais
```

## Prerequis

- [Node.js](https://nodejs.org/) 20+
- [AWS CLI](https://aws.amazon.com/cli/) configure (`aws configure`)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Un compte [Alexa Developer](https://developer.amazon.com/alexa/console/ask)
- Une [cle API Anthropic](https://console.anthropic.com/)

## Deploiement

### 1. Installer les dependances

```bash
cd lambda
npm install
```

### 2. Deployer avec SAM

```bash
sam build
sam deploy --guided
```

SAM demandera :
- **Stack Name** : `alexa-claude-skill`
- **AnthropicApiKey** : votre cle API Anthropic

Deploiements suivants :

```bash
sam build && sam deploy
```

### 3. Configurer la skill Alexa

1. Aller sur la [Console Alexa Developer](https://developer.amazon.com/alexa/console/ask)
2. Creer une nouvelle skill :
   - Nom : **Mon Assistant Claude**
   - Langue : **Francais (France)**
   - Modele : **Custom**
   - Hebergement : **Provision your own**
3. Dans **Interaction Model > JSON Editor** : coller le contenu de `skill-package/interactionModels/custom/fr-FR.json`
4. Dans **Endpoint** : selectionner **AWS Lambda ARN** et coller l'ARN affiche dans la sortie de `sam deploy`
5. **Sauvegarder** et **Compiler le modele**

### 4. Lier le Skill ID a la Lambda

Copier le Skill ID depuis la console Alexa (`amzn1.ask.skill.xxx`) et l'ajouter en tant que declencheur autorise sur la fonction Lambda dans la console AWS.

## Tests en local

```bash
sam local invoke AlexaClaudeFunction \
  --parameter-overrides "AnthropicApiKey=VOTRE_CLE" \
  -e events/launch.json
```

Exemple de fichier `events/launch.json` :

```json
{
  "version": "1.0",
  "session": { "new": true, "sessionId": "test-session-123" },
  "request": {
    "type": "LaunchRequest",
    "requestId": "test-request-1",
    "timestamp": "2026-03-17T12:00:00Z",
    "locale": "fr-FR"
  }
}
```

## Exemples d'utilisation

| Vous dites | Claude repond |
|------------|---------------|
| "Alexa, demande a mon assistant claude c'est quoi la photosynthese" | Une explication concise et parlee |
| "Alexa, demande a mon assistant claude raconte-moi une blague" | Une courte blague en francais |
| "Alexa, demande a mon assistant claude et pourquoi c'est important ?" | Continue la conversation en utilisant le contexte |

## Depannage

| Probleme | Solution |
|----------|----------|
| Timeout Alexa (8s) | Claude a un timeout de 6s. Verifier la latence reseau ou simplifier la question |
| "There was a problem with the requested skill's response" | Verifier les logs CloudWatch de la Lambda |
| DynamoDB AccessDenied | La politique IAM devrait etre auto-configuree par SAM. Verifier dans la console AWS |
| Skill introuvable | S'assurer que le Skill ID est ajoute comme declencheur de la Lambda |
| Reponse tronquee | Les reponses sont limitees a 6000 caracteres -- comportement normal pour les longues reponses |

## Stack technique

- **Runtime** : Node.js 20, modules ESM
- **IA** : API Claude (SDK Anthropic)
- **Infrastructure** : AWS SAM, Lambda, DynamoDB
- **Voix** : SDK Alexa Skills Kit

## Licence

MIT
