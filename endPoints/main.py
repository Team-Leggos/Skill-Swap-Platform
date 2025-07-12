"""FastAPI application exposing AI utilities for the Skill Swap Platform.

Endpoints:
- POST /moderate  { text: str }
    -> { label: "SAFE" | "UNSAFE", categories: str }
- POST /summarize { transcript: str }
    -> { summary: str }

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
import traceback

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import get_settings
from .ai_chains import moderate_text, summarize_text

settings = get_settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="SkillSwap AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ModerationRequest(BaseModel):
    text: str = Field(..., description="Message text to classify.")


class ModerationResponse(BaseModel):
    label: str = Field(..., description="SAFE or UNSAFE")
    categories: str | None = None


class SummarizeRequest(BaseModel):
    transcript: str = Field(..., description="Conversation transcript to summarise.")


class SummarizeResponse(BaseModel):
    summary: str


@app.post("/moderate", response_model=ModerationResponse)
async def moderate(req: ModerationRequest):
    """Classify text as SAFE or UNSAFE using Gemini model via Vertex AI."""
    try:
        result = moderate_text(req.text)
        return ModerationResponse(**result)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Moderation failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail="Moderation failed") from exc


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    """Return a concise summary of the transcript using Gemini model."""
    try:
        summary = summarize_text(req.transcript)
        return SummarizeResponse(summary=summary)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Summarization failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail="Summarization failed") from exc


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
