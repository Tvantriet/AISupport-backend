import OpenAIService from "./OpenAIService.js";
import QdrantService from "./QdrantService.js";

export default class ChatService {
    private openaiService: OpenAIService;
    private qdrantService: QdrantService;

    constructor() {
        this.openaiService = new OpenAIService();
        this.qdrantService = new QdrantService();
    }

    /**
     * Process a complete chat request with document search and response generation
     * 
     * @param query User's original query
     * @param collectionName Qdrant collection to search
     * @param conversationHistory Previous conversation history (optional)
     * @param limit Maximum number of document results to return
     * @returns Complete response with search results and chatbot answer
     */
    public async processUserRequest(query: string, collectionName: string, conversationHistory: any[] = [], limit: number = 5) {
        try {
            // Step 1: Enhance the query for better document search
            const enhancedQuery = await this.openaiService.enhanceUserQuery(query);
            
            // Step 2: Create embedding for the enhanced query
            const queryEmbedding = await this.openaiService.createEmbedding(enhancedQuery);
            
            // Step 3: Search for relevant document sections
            const searchResults = await this.qdrantService.search(collectionName, queryEmbedding, limit);
            
            // Step 4: Format the search results
            const formattedResults = searchResults.map((result: any) => ({
                score: result.score,
                text: result.payload.text,
                source: result.payload.source,
                metadata: result.payload.metadata
            }));
            
            // Step 5: Generate a chatbot response using the original query and retrieved documents
            const contextualDocuments = formattedResults.map(r => r.text).join("\n\n");
            
            // Create a prompt that includes the conversation history, retrieved documents, and user query
            const messages = [
                {
                    role: "system",
                    content: "You are a helpful support assistant. Use the provided document sections to answer the user's question. If you can't find relevant information in the documents, say so and provide a general response."
                },
                {
                    role: "user",
                    content: `I've found these relevant document sections that might help answer your question:\n\n${contextualDocuments}\n\nBased on this information, here's the answer to your question: "${query}"`
                }
            ];
            
            // Add conversation history if available
            if (conversationHistory && conversationHistory.length > 0) {
                // Insert conversation history before the final user message
                messages.splice(1, 0, ...conversationHistory);
            }
            
            // Use the OpenAIService to generate the response
            const chatbotResponse = await this.openaiService.createChatCompletion(messages);
            
            // Step 6: Return the complete response
            return {
                success: true,
                originalQuery: query,
                enhancedQuery,
                searchResults: formattedResults,
                response: chatbotResponse
            };
        } catch (error: any) {
            console.error('Error processing user request:', error);
            throw new Error(`Failed to process request: ${error.message}`);
        }
    }
} 