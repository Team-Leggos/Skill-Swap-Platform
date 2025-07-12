# Skill Swap AI Service

FastAPI micro-service providing AI utilities for the Skill Swap Platform.

## Endpoints

| Method | Path        | Body                               | Description                                   |
| ------ | ----------- | ---------------------------------- | --------------------------------------------- |
| POST   | `/moderate` | `{ "text": "string" }`            | Classify text as `SAFE` or `UNSAFE`            |
| POST   | `/summarize`| `{ "transcript": "string" }`      | Summarise a conversation transcript           |
| GET    | `/health`   | –                                  | Simple health check                           |

### Example cURL

```bash
curl -X POST http://localhost:8000/moderate \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello there!"}'

curl -X POST http://localhost:8000/summarize \
     -H "Content-Type: application/json" \
     -d '{"transcript":"User A: hi\nUser B: hello"}'
```

## Local Dev

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set environment (or create .env)
export GOOGLE_PROJECT_ID="your-project"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

uvicorn app.main:app --reload --port 8000
```

## Environment Variables

| Variable                        | Description                                        |
|--------------------------------|----------------------------------------------------|
| `GOOGLE_PROJECT_ID`            | GCP project where Vertex AI is enabled             |
| `GOOGLE_LOCATION`              | Vertex region (default `us-central1`)              |
| `GOOGLE_MODEL_NAME`            | Model ID (default `gemini-1.5-flash`)              |
| `GOOGLE_APPLICATION_CREDENTIALS`| Path to service-account key JSON                   |
| `ALLOWED_ORIGINS`              | CORS origins, comma-separated (default `*`)        |

## Prompt Templates

*Moderation*
```
You are an AI moderation assistant. Analyse the following message for inappropriate content (harassment, hate speech, adult content). Respond with 'SAFE' or 'UNSAFE' and list categories flagged if unsafe.

Message: {message}
```

*Summarization*
```
You are a meeting summary assistant. Summarise the following conversation transcript, highlighting key points, decisions, and any action items.

Transcript: {transcript}
```

These templates are defined in `app/gemini_client.py` and can be adjusted as needed.
