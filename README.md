# Alexa Claude Skill

An Alexa skill powered by [Claude](https://www.anthropic.com/claude) — a smart, conversational voice assistant in French.

Ask anything by saying **"Alexa, demande à mon assistant claude..."** and get natural, spoken answers powered by Claude's intelligence.

## Features

- **Natural conversation** — Claude responds concisely in spoken French, no markdown or visual formatting
- **Multi-turn context** — Remembers the conversation within a session (up to 10 exchanges stored in DynamoDB)
- **Fast & safe** — 6-second API timeout to stay within Alexa's 8-second limit, with graceful fallbacks
- **Serverless** — Deploys as an AWS Lambda via SAM, with DynamoDB for session storage (auto-cleanup via TTL)

## Architecture

```
                  ┌─────────────┐
                  │  Alexa Echo  │
                  └──────┬───────┘
                         │ voice
                  ┌──────▼───────┐
                  │ Alexa Service│
                  └──────┬───────┘
                         │ JSON
              ┌──────────▼──────────┐
              │   AWS Lambda        │
              │   (Node.js 20 ESM)  │
              │                     │
              │  ┌───────────────┐  │
              │  │ index.js      │  │  Alexa SDK handlers
              │  │ claudeService │──│──► Claude API (6s timeout)
              │  │ sessionService│──│──► DynamoDB (24h TTL)
              │  │ responseHelper│  │  Text cleanup & truncation
              │  └───────────────┘  │
              └─────────────────────┘
```

```
├── template.yaml                          # SAM template (Lambda + DynamoDB)
├── lambda/
│   ├── index.js                           # Alexa request handlers
│   ├── services/
│   │   ├── claudeService.js               # Claude API integration
│   │   └── sessionService.js              # DynamoDB session management
│   └── utils/
│       └── responseHelper.js              # Response formatting for voice
└── skill-package/
    └── interactionModels/custom/
        └── fr-FR.json                     # French interaction model
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- An [Alexa Developer](https://developer.amazon.com/alexa/console/ask) account
- An [Anthropic API key](https://console.anthropic.com/)

## Deployment

### 1. Install dependencies

```bash
cd lambda
npm install
```

### 2. Deploy with SAM

```bash
sam build
sam deploy --guided
```

SAM will prompt for:
- **Stack Name**: `alexa-claude-skill`
- **AnthropicApiKey**: your Anthropic API key

Subsequent deploys:

```bash
sam build && sam deploy
```

### 3. Configure the Alexa skill

1. Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create a new skill:
   - Name: **Mon Assistant Claude**
   - Locale: **French (France)**
   - Model: **Custom**
   - Hosting: **Provision your own**
3. In **Interaction Model > JSON Editor**: paste the contents of `skill-package/interactionModels/custom/fr-FR.json`
4. In **Endpoint**: select **AWS Lambda ARN** and paste the ARN from `sam deploy` output
5. **Save** and **Build Model**

### 4. Link the Skill ID to Lambda

Copy the Skill ID from the Alexa console (`amzn1.ask.skill.xxx`) and add it as an authorized trigger on your Lambda function in the AWS console.

## Local testing

```bash
sam local invoke AlexaClaudeFunction \
  --parameter-overrides "AnthropicApiKey=YOUR_KEY" \
  -e events/launch.json
```

Example `events/launch.json`:

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

## Usage examples

| You say | Claude answers |
|---------|---------------|
| "Alexa, demande à mon assistant claude c'est quoi la photosynthèse" | A concise spoken explanation |
| "Alexa, demande à mon assistant claude raconte-moi une blague" | A short joke in French |
| "Alexa, demande à mon assistant claude et pourquoi c'est important ?" | Follows up using conversation context |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Alexa timeout (8s) | Claude has a 6s timeout. Check network latency or simplify the question |
| "There was a problem with the requested skill's response" | Check CloudWatch logs for the Lambda |
| DynamoDB AccessDenied | IAM policy should be auto-configured by SAM. Verify in the AWS console |
| Skill not found | Ensure the Skill ID is added as a Lambda trigger |
| Response cut off | Responses are truncated at 6000 characters — normal for long answers |

## Tech stack

- **Runtime**: Node.js 20, ESM modules
- **AI**: Claude API (Anthropic SDK)
- **Infrastructure**: AWS SAM, Lambda, DynamoDB
- **Voice**: Alexa Skills Kit SDK

## License

MIT
