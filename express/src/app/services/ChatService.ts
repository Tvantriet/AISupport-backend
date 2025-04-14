import { AIProvider } from "../interfaces/AIProvider.js";
import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import OpenAIService from "./OpenAIService.js";
import OpenAIEmbeddingService from "./OpenAIEmbeddingService.js";
import QdrantService from "./QdrantService.js";
import prompts from "../config/prompts.js";

// Create a proper return type for the service
interface ChatResponse {
	success: boolean;
	fullContext: Array<{ role: string; content: string }>;
	response: string;
}

export default class ChatService {
	private aiProvider: AIProvider;
	private embeddingProvider: EmbeddingProvider;
	private qdrantService: QdrantService;

	constructor(
		aiProvider?: AIProvider, 
		embeddingProvider?: EmbeddingProvider,
		qdrantService?: QdrantService
	) {
		this.aiProvider = aiProvider || new OpenAIService();
		this.embeddingProvider = embeddingProvider || new OpenAIEmbeddingService();
		this.qdrantService = qdrantService || new QdrantService();
	}

	/**
	 * Process a complete chat request with document search and response generation
	 *
	 * @param query User's original query
	 * @param collectionName Qdrant collection to search
	 * @param productId Product ID to search
	 * @param conversationHistory Previous conversation history (optional)
	 * @returns Complete response with search results, chatbot answer, and a promise for follow-up questions
	 */
	public async processUserRequest(query: string, collectionName: string, productId: string, conversationHistory: any[] = []): Promise<ChatResponse> {
		try {
			// Step 1: Create embedding for query
			const queryEmbedding = await this.embeddingProvider.createEmbedding(query);
			// Step 2: Search for relevant document sections
			const searchResults = await this.qdrantService.search(productId, queryEmbedding);
			// Step 3: Format the search results with the conversation history into a single prompt
			const messages = await this.formatFullContext(searchResults, conversationHistory, query);
			// Step 4: Use the AIProvider to generate the response
			const chatbotResponse = await this.aiProvider.createChatCompletion(messages);			
			// Step 5: Return the response with a promise for follow-up questions
			return {
				success: true,
				fullContext: messages,
				response: chatbotResponse,
			};
		} catch (error: any) {
			console.error("Error processing chat request:", error);
			throw new Error(`Failed to process chat request: ${error.message}`);
		}
	}

	/**
	 * Format search results and conversation history into a full context for the AI
	 *
	 * @param searchResults Results from vector search
	 * @param conversationHistory Previous conversation history
	 * @param query Current user query
	 * @returns Formatted array of messages for the AI
	 */
	private async formatFullContext(searchResults: any[], conversationHistory: any[], query: string): Promise<Array<{ role: string; content: string }>> {
		// Extract text from search results
		const documentSections = searchResults
			.map((result) => result.payload.text)
			.join("\n\n");

		// Create system message with document context
		const systemMessage = {
			role: "system",
			content: prompts.system.chatbot,
		};

		// Format conversation history (if any)
		let conversation = [];
		if (conversationHistory && conversationHistory.length > 0) {
			conversation = conversationHistory;
		}

		// Add document context + current query
		const contextMessage = {
			role: "user",
			content: prompts.system.documentContext(query, documentSections),
		};

		// Combine everything
		return [systemMessage, ...conversation, contextMessage];
	}

	/**
	 * Get follow-up questions based on conversation history and current exchange
	 *
	 * @param conversationHistory Previous conversation history
	 * @param query Most recent user query
	 * @param response Most recent assistant response
	 * @returns Follow-up questions promise
	 */
	private async getFollowUpQuestions(
		conversationHistory: any[] = [], 
		query: string, 
		response: string
	): Promise<any> {
		// Add current exchange to conversation history
		const currentExchange = [
			{ role: "user", content: query },
			{ role: "assistant", content: response }
		];
		
		// Limit history to recent messages only to avoid exceeding token limits
		const recentHistory = conversationHistory && conversationHistory.length > 0 ? 
			[...conversationHistory].slice(-3) : // Take last 3 messages from history
			[];
		
		// Combine recent history with current exchange for a total of 5 messages max
		const limitedHistory = [...recentHistory, ...currentExchange];
		
		console.log(`Using ${limitedHistory.length} recent messages for follow-up questions`);
		
		// Generate follow-up questions based on limited history
		return this.aiProvider.generateFollowUpQuestions(limitedHistory);
	}

	/**
	 * Generate follow-up questions directly without bundling with main chat response
	 * 
	 * @param conversationHistory Previous conversation history
	 * @param query Most recent user query
	 * @param response Most recent assistant response
	 * @returns Array of follow-up question objects (only relevant ones)
	 */
	public async generateFollowUpQuestions(
		conversationHistory: any[] = [], 
		query: string, 
		response: string
	): Promise<any> {
		try {
			const allFollowUps = await this.getFollowUpQuestions(conversationHistory, query, response);
			
			// Filter to only include relevant follow-up questions
			// Check for both boolean true and string "true" to be safe
			const relevantFollowUps = Array.isArray(allFollowUps) 
				? allFollowUps.filter(q => q.relevant === true || q.relevant === "true") 
				: [];
			
			console.log(`Generated ${allFollowUps.length} follow-ups, ${relevantFollowUps.length} relevant`);
			return relevantFollowUps;
		} catch (error: any) {
			console.error("Error generating follow-up questions:", error);
			throw new Error(`Failed to generate follow-up questions: ${error.message}`);
		}
	}
}
