# Alexa Claude Skill

Skill Alexa qui utilise Claude comme assistant vocal intelligent en français.

## Prérequis

- Node.js 20+
- AWS CLI configuré (`aws configure`)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Compte [Alexa Developer](https://developer.amazon.com/alexa/console/ask)
- Clé API [Anthropic](https://console.anthropic.com/)

## Déploiement

### 1. Installer les dépendances

```bash
cd lambda
npm install
```

### 2. Déployer avec SAM

```bash
sam build
sam deploy --guided
```

Au premier déploiement, SAM demande les paramètres :
- **Stack Name** : `alexa-claude-skill`
- **AnthropicApiKey** : ta clé API Anthropic (`sk-ant-...`)

Pour les déploiements suivants :

```bash
sam build && sam deploy
```

### 3. Configurer la skill Alexa

1. Aller sur [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Créer une nouvelle skill :
   - Nom : "Mon Assistant Claude"
   - Langue : Français (France)
   - Modèle : Custom
   - Backend : Alexa-hosted (Node.js) → changer pour **Provision your own**
3. Dans **Interaction Model > JSON Editor** : copier le contenu de `skill-package/interactionModels/custom/fr-FR.json`
4. Dans **Endpoint** : sélectionner **AWS Lambda ARN** et coller l'ARN affiché en sortie du `sam deploy`
5. Sauvegarder et **Build Model**

### 4. Ajouter le Skill ID dans Lambda

Récupérer le Skill ID depuis la console Alexa (format `amzn1.ask.skill.xxx`) et l'ajouter comme trigger autorisé sur la Lambda dans la console AWS.

## Test local

```bash
# Invoquer la Lambda localement avec un événement de test
sam local invoke AlexaClaudeFunction \
  --parameter-overrides "AnthropicApiKey=sk-ant-..." \
  -e events/launch.json
```

Créer un fichier `events/launch.json` pour tester :

```json
{
  "version": "1.0",
  "session": {
    "new": true,
    "sessionId": "test-session-123"
  },
  "request": {
    "type": "LaunchRequest",
    "requestId": "test-request-1",
    "timestamp": "2026-03-17T12:00:00Z",
    "locale": "fr-FR"
  }
}
```

## Architecture

```
├── template.yaml              # Template SAM (Lambda + DynamoDB)
├── lambda/
│   ├── index.js               # Handlers Alexa (Launch, Intent, Error)
│   ├── services/
│   │   ├── claudeService.js   # Appel API Claude avec timeout
│   │   └── sessionService.js  # Gestion sessions DynamoDB
│   └── utils/
│       └── responseHelper.js  # Nettoyage et formatage réponses
└── skill-package/
    └── interactionModels/
        └── custom/
            └── fr-FR.json     # Modèle d'interaction français
```

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Timeout Alexa (8s) | Claude a 6s max de timeout. Vérifier la latence réseau et la complexité des questions |
| "There was a problem with the requested skill's response" | Vérifier les logs CloudWatch de la Lambda |
| DynamoDB AccessDenied | Vérifier que la policy IAM est bien attachée (le template SAM le fait automatiquement) |
| Skill non trouvée | Vérifier que le Skill ID est ajouté comme trigger de la Lambda |
| Réponse coupée | Le texte est tronqué à 6000 caractères. Normal pour les réponses longues |
