import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333", // Default URL
    apiKey: process.env.QDRANT_API_KEY || "", // Optional API key
});

export default qdrantClient; 