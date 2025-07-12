import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration settings.

    Environment variables (can be placed in a .env file):
    - GOOGLE_API_KEY (required for Google AI API)
    - GOOGLE_MODEL_NAME (defaults to "gemini-2.0-flash-001")
    - ALLOWED_ORIGINS (comma separated, defaults to "*")
    """

    def __init__(self):
        self.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
        self.GOOGLE_MODEL_NAME = os.getenv("GOOGLE_MODEL_NAME", "gemini-2.0-flash-001")
        
        self.ALLOWED_ORIGINS = (
            os.getenv("ALLOWED_ORIGINS", "*").split(",")
            if os.getenv("ALLOWED_ORIGINS")
            else ["*"]
        )
        
        # Validate required settings
        self._validate()
    
    def _validate(self):
        """Validate that required configuration is present."""
        if not self.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY environment variable is required")


@lru_cache
def get_settings() -> Settings:
    return Settings()