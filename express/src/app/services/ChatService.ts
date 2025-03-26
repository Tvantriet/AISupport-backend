import OpenAIService from "./OpenAIService.js";
import QdrantService from "./QdrantService.js";
import prompts from "../config/prompts.js";

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
	public async processUserRequest(query: string, collectionName: string, conversationHistory: any[] = []) {
		try {
			//FOR DEBUGGING
			collectionName = "default";
			// Step 1: Create embedding for query
			const queryEmbedding = await this.openaiService.createEmbedding(query);
			// Step 2: Search for relevant document sections
			const searchResults = await this.qdrantService.search(collectionName, queryEmbedding);
			// Step 3: Format the search results with the conversation history into a single prompt
			const messages = await this.formatFullContext(searchResults, conversationHistory, query);
			// Step 4: Use the OpenAIService to generate the response
			const chatbotResponse = await this.openaiService.createChatCompletion(messages);

			// Step 5: Return the response, with extra information for debugging
			return {
				success: true,
				fullContext: messages,
				response: chatbotResponse,
			};
		} catch (error: any) {
			console.error("Error processing user request:", error);
			throw new Error(`Failed to process request: ${error.message}`);
		}
	}

	private async formatFullContext(searchResults: any[], conversationHistory: any[], query: string) {
		const formattedResults = searchResults.map((result: any) => ({
			score: result.score,
			text: result.payload.text,
			source: result.payload.source,
			metadata: result.payload.metadata,
		}));

		// Use centralized prompts
		const contextualDocuments = formattedResults.map((r) => r.text).join("\n\n");
		
		const messages = [
			{
				role: "system",
				content: prompts.system.chatbot
			},
			{
				role: "system",
				content: prompts.system.documentContext(query, contextualDocuments)
			},
		];

		// Add conversation history if available
		if (conversationHistory && conversationHistory.length > 0) {
			messages.splice(1, 0, ...conversationHistory);
		}
		
		console.log("Messages:", messages);
		return messages;
	}

}
