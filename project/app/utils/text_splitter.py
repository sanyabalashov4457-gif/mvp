from typing import List


def split_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks by character length."""
    cleaned = " ".join(text.split())
    if not cleaned:
        return []

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks: List[str] = []
    step = chunk_size - overlap
    start = 0
    text_len = len(cleaned)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == text_len:
            break
        start += step

    return chunks
