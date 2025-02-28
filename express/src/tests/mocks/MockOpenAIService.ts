export default class MockOpenAIService {
    private apiKey: string = "mock-api-key";
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            console.warn('OpenAI API key is not set. Set OPENAI_API_KEY in your environment variables.');
        }
    }

    public async createEmbedding(text: string, model: string = 'text-embedding-3-large'): Promise<number[]> {
        // Return a fixed-length mock embedding vector
        // The length should match what your real service would return
        return Array(1536).fill(0).map(() => Math.random());
    }

    public async splitTextIntoChunks(text: string, model: string = 'gpt-4o-mini'): Promise<string[]> {
        // Simple mock implementation that splits text by paragraphs
        // and then further splits long paragraphs
        const paragraphs = text.split(/\n\s*\n/);
        const chunks: string[] = [];
        
        for (const paragraph of paragraphs) {
            if (paragraph.length < 300) {
                chunks.push(paragraph);
            } else {
                // Split longer paragraphs into roughly equal parts
                const sentenceBreaks = paragraph.match(/[.!?]+\s+/g) || [];
                let currentChunk = '';
                let sentences = paragraph.split(/[.!?]+\s+/);
                
                for (const sentence of sentences) {
                    if ((currentChunk + sentence).length < 300) {
                        currentChunk += (currentChunk ? ' ' : '') + sentence + '.';
                    } else {
                        if (currentChunk) chunks.push(currentChunk);
                        currentChunk = sentence + '.';
                    }
                }
                
                if (currentChunk) chunks.push(currentChunk);
            }
        }
        
        return chunks;
    }

    /**
     * Enhance a user query (mock implementation)
     * 
     * @param query The original user query
     * @returns Enhanced query
     */
    public async enhanceUserQuery(query: string): Promise<string> {
        // Simple mock implementation that adds some technical terms
        return `${query} (enhanced with technical terms)`;
    }
} 