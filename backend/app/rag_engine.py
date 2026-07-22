import os
import chromadb
from chromadb.utils import embedding_functions
from .knowledge_base.documents import ENERGY_CRISIS_DOCUMENTS

class EnergyRAG:
    def __init__(self):
        # Initialize ChromaDB persistent client
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        
        # Initialize embedding function
        self.emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="energy_crisis_docs",
            embedding_function=self.emb_fn
        )
        
        # Seed documents if empty
        if self.collection.count() == 0:
            print("ChromaDB: Seeding RAG documents collection...")
            ids = [str(doc["id"]) for doc in ENERGY_CRISIS_DOCUMENTS]
            documents = [doc["content"] for doc in ENERGY_CRISIS_DOCUMENTS]
            metadatas = [
                {
                    "title": doc["title"],
                    "source": doc["source"],
                    "date": doc["date"]
                }
                for doc in ENERGY_CRISIS_DOCUMENTS
            ]
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            print(f"ChromaDB: Successfully seeded {self.collection.count()} documents.")
        else:
            print(f"ChromaDB: Collection already initialized with {self.collection.count()} documents.")
            
    def query(self, question: str, n_results: int = 3) -> dict:
        results = self.collection.query(
            query_texts=[question],
            n_results=n_results
        )
        
        retrieved_docs = []
        context_parts = []
        
        if results and "documents" in results and results["documents"] and len(results["documents"][0]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            for doc_text, meta in zip(docs, metas):
                retrieved_docs.append({
                    "title": meta.get("title", ""),
                    "source": meta.get("source", ""),
                    "date": meta.get("date", ""),
                    "snippet": doc_text[:200]
                })
                context_parts.append(doc_text)
                
        context_text = "\n\n".join(context_parts)
        
        return {
            "retrieved_docs": retrieved_docs,
            "context_text": context_text,
            "query": question
        }
        
    def augment_prompt(self, base_prompt: str, question: str) -> str:
        q_res = self.query(question)
        context = q_res["context_text"]
        return f"RETRIEVED CONTEXT:\n{context}\n\nQUESTION: {question}\n\n{base_prompt}"
