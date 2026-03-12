import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from config import embedder

# ==============================
# RETRIEVE CONTEXT
# ==============================

def retrieve_context(chunks, query, top_k=3):

    chunk_embeddings = embedder.encode(chunks)
    query_embedding = embedder.encode([query])

    scores = cosine_similarity(query_embedding, chunk_embeddings)[0]
    top_indices = np.argsort(scores)[-top_k:]

    relevant_chunks = [chunks[i] for i in top_indices]
    return "\n".join(relevant_chunks)
