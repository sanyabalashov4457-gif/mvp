from app.rag.generator import generate_answer
from app.rag.retriever import retrieve


def answer_question(question: str) -> dict:
    context_chunks = retrieve(question)
    generation_result = generate_answer(question, context_chunks)
    return {"answer": generation_result["answer"], "sources": context_chunks}
