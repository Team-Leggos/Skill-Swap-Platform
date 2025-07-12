"""LangChain-powered helper functions for moderation and summarization.

All logic is implemented with LangChain abstractions only – no direct calls to the
Google Vertex AI SDK.

Environment variables required (same as before):
- GOOGLE_PROJECT_ID
- GOOGLE_LOCATION
- GOOGLE_MODEL_NAME (e.g. "gemini-1.5-flash")
- GOOGLE_APPLICATION_CREDENTIALS (service-account JSON path)

These are consumed implicitly by the `langchain_google_vertexai` provider, which
wraps the Vertex Generative AI models.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Dict

from langchain_core.prompts import PromptTemplate
from langchain_core.language_models import BaseChatModel

try:
    from langchain_google_genai  import ChatGoogleGenerativeAI
except ImportError as e:
    raise ImportError(
        "langchain_google_vertexai is required. Install with: pip install langchain-google-vertexai"
    ) from e

from .config import get_settings

_logger = logging.getLogger(__name__)


@lru_cache
def _get_llm() -> BaseChatModel:
    """Return a cached ChatGoogleGenerativeAI instance."""
    try:
        settings = get_settings()
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-001",
            temperature=0.2,
        )
        return model
    except Exception as e:
        _logger.error("Failed to initialize LLM: %s", e)
        raise


# Prompt templates
_MODERATION_TMPL = (
    "You are an AI moderation assistant. Analyse the following message for inappropriate "
    "content (harassment, hate speech, adult content). Respond with 'SAFE' or 'UNSAFE' "
    "and list categories flagged if unsafe.\n\nMessage: {message}"
)

_SUMMARY_TMPL = (
    "You are a meeting summary assistant. Summarise the following conversation transcript, "
    "highlighting key points, decisions, and any action items.\n\nTranscript: {transcript}"
)

_moderation_prompt = PromptTemplate.from_template(_MODERATION_TMPL)
_summary_prompt = PromptTemplate.from_template(_SUMMARY_TMPL)


def moderate_text(text: str) -> Dict[str, Any]:
    """Moderate a chat message.

    Returns a dict with keys:
    - label: "SAFE" or "UNSAFE"
    - categories: additional info if unsafe
    
    Raises:
        ValueError: If the input text is empty or None
        RuntimeError: If the LLM fails to return a valid response
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty")
    
    try:
        chain = _moderation_prompt | _get_llm()
        response = chain.invoke({"message": text})
        
        # Handle both string and AIMessage responses
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        if not response_text:
            raise RuntimeError("LLM returned empty response")
            
        lines = response_text.strip().split("\n")
        first_line = lines[0].strip().upper()
        
        # Validate the response format
        if first_line not in ["SAFE", "UNSAFE"]:
            _logger.warning("Unexpected moderation response format: %s", first_line)
            # Default to SAFE if format is unexpected
            return {"label": "SAFE", "categories": ""}
        
        details = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""
        return {"label": first_line, "categories": details}
        
    except Exception as e:
        _logger.error("Moderation failed for text: %s", text[:100] + "..." if len(text) > 100 else text)
        raise RuntimeError(f"Moderation failed: {str(e)}") from e


def summarize_text(transcript: str) -> str:
    """Return a concise summary of the transcript.
    
    Args:
        transcript: The conversation transcript to summarize
        
    Returns:
        A string summary of the transcript
        
    Raises:
        ValueError: If the transcript is empty or None
        RuntimeError: If the LLM fails to return a valid response
    """
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    try:
        chain = _summary_prompt | _get_llm()
        response = chain.invoke({"transcript": transcript})
        
        # Handle both string and AIMessage responses
        if hasattr(response, 'content'):
            summary = response.content
        else:
            summary = str(response)
        
        if not summary:
            raise RuntimeError("LLM returned empty summary")
            
        return summary.strip()
        
    except Exception as e:
        _logger.error("Summarization failed for transcript length: %d", len(transcript))
        raise RuntimeError(f"Summarization failed: {str(e)}") from e