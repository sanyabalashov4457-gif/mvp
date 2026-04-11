import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    legacy_ask_timeout: int = int(os.getenv("ASK_TIMEOUT_SECONDS", "10"))
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model_name: str = os.getenv("MODEL_NAME", "llama3")
    embed_model: str = os.getenv("EMBED_MODEL", "nomic-embed-text")
    docs_dir: Path = BASE_DIR / "data" / "docs"
    db_dir: Path = BASE_DIR / "db"
    chroma_collection: str = os.getenv("CHROMA_COLLECTION", "documents")
    ask_timeout_seconds: int = int(os.getenv("ASK_TIMEOUT_SECONDS", "10"))
    query_timeout_seconds: int = int(
        os.getenv(
            "QUERY_TIMEOUT_SECONDS",
            os.getenv("QUERY_EMBED_TIMEOUT_SECONDS", os.getenv("ASK_TIMEOUT_SECONDS", "10")),
        )
    )
    generate_timeout_seconds: int = int(
        os.getenv("GENERATE_TIMEOUT_SECONDS", os.getenv("ASK_TIMEOUT_SECONDS", "10"))
    )
    ingest_timeout_seconds: int = int(os.getenv("INGEST_TIMEOUT_SECONDS", "60"))

    @property
    def query_embed_timeout_seconds(self) -> int:
        """Backward-compatible alias for query timeout naming."""
        return self.query_timeout_seconds


settings = Settings()
