import { AIProvider, ChatCompletionResponse, ChatMessage, Tool } from "../interfaces/AIProvider.js";
import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import OpenAIService from "./OpenAIService.js";
import OpenAIEmbeddingService from "./OpenAIEmbeddingService.js";
import prompts from "../config/prompts.js";
import ProductService from "./ProductService.js";
import PointService from "./PointService.js";
import { Product } from "../dtos/product.dto.js"
import ToolCallingService from "./ToolCallingService.js";
// Create a proper return type for the service
export interface ChatResponse {
	success: boolean;
	response: string;
	toolCalls: ChatMessage[];
}

export default class ChatService {
	private aiProvider: AIProvider;
	private embeddingProvider: EmbeddingProvider;
	private productService: ProductService;
	private pointService: PointService;
	private toolCallingService: ToolCallingService;
	constructor(
		aiProvider?: AIProvider, 
		embeddingProvider?: EmbeddingProvider,
		pointService?: PointService,
		productService?: ProductService,
		toolCallingService?: ToolCallingService
	) {
		this.aiProvider = aiProvider || new OpenAIService();
		this.embeddingProvider = embeddingProvider || new OpenAIEmbeddingService();
		this.pointService = pointService || new PointService();
		this.productService = productService || new ProductService();
		this.toolCallingService = toolCallingService || new ToolCallingService();
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
	public async processUserRequest(query: string, productId: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
		try {
			const queryEmbedding = await this.embeddingProvider.createEmbedding(query);

			const productPromise: Promise<Product> = this.productService.getProductById(productId);
			const categoryIds : string[] = await this.productService.getCategoryIds(productId);
			const searchResults = await this.pointService.findNearestNeighbors(productId, categoryIds, queryEmbedding, 10);
			const product: Product = await productPromise;
			const tools: Tool[] = await this.toolCallingService.getAvailableTools();
			const messages = await this.formatFullContext(searchResults, conversationHistory, query, product);

			const completion = await this.CreateCompletion(messages, tools);
			const toolResponse = await this.toolCallingService.processToolCalls(completion.toolCalls);
			console.log(completion);
			return {
				success: true,
				response: completion.content,
				toolCalls: toolResponse
			};
		} catch (error: any) {
			console.error("Error processing chat request:", error);
			throw new Error(`Failed to process chat request: ${error.message}`);
		}
	}
	public async retrieveContext(query: string, productId: string, conversationHistory: any[] = [], queryEmbedding): Promise<any[]> {
		//Step 2: Get product and category ids
		const productPromise: Promise<Product> = this.productService.getProductById(productId);
		const categoryIds : string[] = await this.productService.getCategoryIds(productId);
		//Step 3: Search for relevant document sections
		const searchResults = await this.pointService.findNearestNeighbors(productId, categoryIds, queryEmbedding, 10);
		const product: Product = await productPromise;
		//Step 4: Format the search results with the conversation history into a single prompt
		const messages = await this.formatFullContext(searchResults, conversationHistory, query, product);
		return messages;
	}

	public async CreateCompletion(messages: ChatMessage[], tools: Tool[]): Promise<ChatCompletionResponse> {
		const chatResponse = await this.aiProvider.createChatCompletion({
			messages: messages as ChatMessage[],
			temperature: 0.7,
			systemPrompt: prompts.system.chatbot,
			maxTokens: 1000,
			tools: tools
		});
		return chatResponse;
	}
	/**
	 * Format search results and conversation history into a full context for the AI
	 *
	 * @param searchResults Results from vector search
	 * @param conversationHistory Previous conversation history
	 * @param query Current user query
	 * @returns Formatted array of messages for the AI
	 */
	public async formatFullContext(searchResults: any[], conversationHistory: ChatMessage[], query: string, product: Product): Promise<ChatMessage[]> {
		// Extract text from search results
		const documentSections = searchResults
			.map((result) => result?.payload?.text)
			.filter(Boolean)  // Remove any null/undefined values
			.join("\n\n");

		// Create system message with document context
		const systemMessage = {
			role: "system",
			content: prompts.system.chatbot,
		};

		const productContextMessage = {
			role: "system",
			content: prompts.system.productContext(product.name, product.description),
		};

		// Base messages array
		const messages = [systemMessage, productContextMessage];

		// Only add document context if we have relevant sections
		if (documentSections.trim()) {
			messages.push({
				role: "system",
				content: prompts.system.documentContext(documentSections),
			});
		}

		// Format conversation history
		const conversation = [...(conversationHistory || [])];
		conversation.push({
			role: "user",
			content: query,
		});

		return [...messages, ...conversation] as ChatMessage[];
	}

	/**
	 * 
	 */















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
		conversationHistory: ChatMessage[] = [], 
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
