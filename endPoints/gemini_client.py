"""Wrapper around Google Vertex AI Gemini 2.5 Flash model.

This module exposes two helper functions:
- moderate_text(text: str) -> dict
- summarize_text(text: str) -> str

Both rely on Vertex AI. If the environment variables are not configured, the
functions will raise a RuntimeError so the caller can handle it (e.g. return
HTTP 500).
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict

from google.cloud import aiplatform
from google.cloud.aiplatform.gapic import PredictionServiceClient
from google.oauth2 import service_account

from .config import get_settings

_logger = logging.getLogger(__name__)
_settings = get_settings()


class _GeminiClient:
    def __init__(self) -> None:
        if not _settings.GOOGLE_PROJECT_ID:
            raise RuntimeError("GOOGLE_PROJECT_ID not set. Gemini client cannot initialise.")

        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and os.path.isfile(credentials_path):
            creds = service_account.Credentials.from_service_account_file(credentials_path)
            aiplatform.init(project=_settings.GOOGLE_PROJECT_ID, location=_settings.GOOGLE_LOCATION, credentials=creds)
        else:
            aiplatform.init(project=_settings.GOOGLE_PROJECT_ID, location=_settings.GOOGLE_LOCATION)

        self.endpoint = (
            f"projects/{_settings.GOOGLE_PROJECT_ID}/locations/{_settings.GOOGLE_LOCATION}/publishers/google/models/{_settings.GOOGLE_MODEL_NAME}"
        )
        self.prediction_client: PredictionServiceClient = PredictionServiceClient()

    def generate(self, prompt: str, **kwargs: Any) -> str:
        """Send a text prompt and return generated text."""
        instances = [{"content": prompt}]
        parameters = {"temperature": 0.2, "maxOutputTokens": 2048}
        parameters.update(kwargs)
        _logger.debug("Sending request to Gemini: %s", prompt[:200])
        response = self.prediction_client.predict(name=self.endpoint, instances=instances, parameters=parameters)
        _logger.debug("Received response from Gemini (%d candidates)", len(response.predictions))
        return response.predictions[0].get("content", "")


# Use a module-level singleton to avoid repeated auth initialisation
_client: _GeminiClient | None = None

def _get_client() -> _GeminiClient:
    global _client
    if _client is None:
        _client = _GeminiClient()
    return _client


MODERATION_PROMPT = (
    "You are an AI moderation assistant. Analyse the following message for inappropriate "
    "content (harassment, hate speech, adult content). Respond with 'SAFE' or 'UNSAFE' and "
    "list categories flagged if unsafe.\n\nMessage: {message}"
)

SUMMARY_PROMPT = (
    "You are a meeting summary assistant. Summarise the following conversation transcript, "
    "highlighting key points, decisions, and any action items.\n\nTranscript: {transcript}"
)

def moderate_text(text: str) -> Dict[str, Any]:
    """Return moderation result as a dict with keys: 'label' (SAFE/UNSAFE) and 'categories'."""
    prompt = MODERATION_PROMPT.format(message=text)
    raw_response = _get_client().generate(prompt)
    # Very naive parse; expects 'SAFE' or 'UNSAFE' first token then optional details.
    first_line, *rest = raw_response.strip().split("\n", 1)
    label = first_line.strip().upper()
    details = rest[0].strip() if rest else ""
    return {"label": label, "categories": details}

def summarize_text(transcript: str) -> str:
    """Return a concise summary of the transcript."""
    prompt = SUMMARY_PROMPT.format(transcript=transcript)
    return _get_client().generate(prompt)
