import fetch from "node-fetch";
import prompts from "../config/prompts.js";
import { AIProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from "../interfaces/AIProvider.js";

/**
 * Service for interacting with OpenAI API
 * Implements AIProvider interface for chat operations
 */
export default class OpenAIService implements AIProvider {
	private apiKey: string;

	constructor() {
		this.apiKey = process.env.OPENAI_API_KEY || "";
		if (!this.apiKey) {
			console.warn("OpenAI API key is not set. Set OPENAI_API_KEY in your environment variables.");
		}
	}
	/**
	 * Create a chat completion using OpenAI API with configurable parameters
	 */
	public async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		try {
			const {
				messages,
				model = process.env.OPENAI_CHAT_MODEL || "o4-mini",
				responseFormat = 'text',
				systemPrompt,
				tools
			} = options;

			// Add system prompt if provided
			const finalMessages = systemPrompt 
				? [{ role: 'system', content: systemPrompt }, ...messages]
				: messages;

			console.log(`Creating chat completion with ${finalMessages.length} messages`);
			
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model,
					messages: finalMessages,
					tools: tools,
					...(responseFormat === 'json_object' && {
						response_format: { type: "json_object" }
					})
				}),
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
			}

			const responseData = await response.json();
			const message = (responseData as any).choices?.[0]?.message;


			if (!message || (!message.content && !message.tool_calls)) {
				console.error("Unexpected response from OpenAI:", JSON.stringify(responseData, null, 2));
				throw new Error("Unexpected response structure from OpenAI API");
			}
			console.log((responseData as any).choices[0].message);

			return {
				toolCalls: (responseData as any).choices[0].message.tool_calls || [],
				content: (responseData as any).choices[0].message.content,
				usage: (responseData as any).usage && { // for future use
					promptTokens: (responseData as any).usage.prompt_tokens,
					completionTokens: (responseData as any).usage.completion_tokens,
					totalTokens: (responseData as any).usage.total_tokens
				}
			};
		} catch (error) {
			console.error("Error in chat completion:", error);
			throw error instanceof Error 
				? error 
				: new Error('Unknown error in chat completion');
		}
	}
	
	/**
	 * Split text into semantically meaningful chunks using OpenAI
	 * 
	 * @param text The text to split
	 * @returns Promise containing array of text chunks
	 */
	public async splitTextIntoChunks(text: string): Promise<string[]> {
		try {
			console.log(`Splitting text (${text.length} chars) into semantic chunks with AI`);
			
			const response = await this.createChatCompletion({
				messages: [{
					role: "user",
					content: text
				}],
				model: process.env.OPENAI_SECONDARY_MODEL || "gpt-4o-mini", 
				temperature: 0.2,
				responseFormat: "json_object",
				systemPrompt: prompts.system.chunkingAgentExplicit
			});

			// Parse the JSON response from the AI
			const parsedResponse = JSON.parse(response.content);
			
			if (!parsedResponse.chunks) {
				throw new Error("Invalid chunks format in response");
			}
			
			return parsedResponse.chunks.map((chunk: any) => chunk.text);
		} catch (error) {
			console.error("Error splitting text with AI:", error);
			throw error;
		}
	}

	/**
	 * Generate follow-up questions based on conversation history
	 * 
	 * @param messages Previous conversation messages
	 * @returns Array of follow-up questions in JSON format
	 */
	public async generateFollowUpQuestions(messages: ChatMessage[]): Promise<any> {
		try {
			console.log("Generating follow-up questions based on conversation history");
			
			const response = await this.createChatCompletion({
				messages: messages,
				model: process.env.OPENAI_SECONDARY_MODEL || "gpt-4o-mini",
				temperature: 0.6, 
				responseFormat: "json_object",
				systemPrompt: prompts.system.generateQuickFollowUps
			});

			return JSON.parse(response.content);
		} catch (error: any) {
			console.error("Error generating follow-up questions:", error);
			return []; // Return empty array instead of throwing
		}
	}
}