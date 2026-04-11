from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.rag.ingest import ingest_documents


if __name__ == "__main__":
    try:
        total_chunks = ingest_documents()
        print(f"Indexed chunks: {total_chunks}")
        print("Note: collection is forcibly recreated with cosine metric for stable similarity scores.")
        print("Run `python debug_chroma.py` to inspect saved collections and count.")
    except RuntimeError as exc:
        print(f"Ingest failed: {exc}")
        raise SystemExit(1) from exc
