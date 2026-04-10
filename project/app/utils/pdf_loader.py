from pathlib import Path
from typing import Dict, List

import fitz


def load_pdf_pages(pdf_path: Path) -> List[Dict]:
    pages: List[Dict] = []
    with fitz.open(pdf_path) as document:
        for index, page in enumerate(document, start=1):
            text = page.get_text("text").strip()
            if not text:
                continue
            pages.append({"page": index, "text": text, "source": pdf_path.name})
    return pages


def load_pdf_documents(docs_dir: Path) -> List[Dict]:
    pages: List[Dict] = []
    for pdf_path in sorted(docs_dir.glob("*.pdf")):
        pages.extend(load_pdf_pages(pdf_path))
    return pages
