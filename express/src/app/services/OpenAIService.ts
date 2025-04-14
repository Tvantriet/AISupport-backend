import fetch from "node-fetch";
import prompts from "../config/prompts.js";
import { AIProvider } from "../interfaces/AIProvider.js";

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
	 * Create a chat completion using OpenAI API
	 *
	 * @param messages Array of chat messages
	 * @returns The generated message content
	 */
	public async createChatCompletion(
		messages: Array<{ role: string; content: string }>
	): Promise<string> {
		try {
			console.log(`Creating chat completion with ${messages.length} messages`);
			
			const requestBody = {
				model: process.env.OPENAI_CHAT_MODEL || "gpt-4o",
				messages: messages,
				temperature: 0.5,
				max_tokens: 1000,
			};
			
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			if (response.status !== 200) {
				console.error(`API error: ${response.status} ${response.statusText}`);
			}
			
			const responseText = await response.text();
			let responseData;
			
			try {
				responseData = JSON.parse(responseText);
			} catch (parseError) {
				throw new Error(`Invalid JSON response from OpenAI API: ${responseText.substring(0, 100)}...`);
			}
			
			if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
				throw new Error("Invalid response format from OpenAI API");
			}

			return responseData.choices[0].message.content;
		} catch (error: any) {
			console.error("Error creating chat completion:", error.message);
			throw error;
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
			
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: process.env.OPENAI_SECONDARY_MODEL || "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: prompts.system.chunkingAgentExplicit
						},
						{
							role: "user",
							content: text
						}
					],
					temperature: 0.2,
					response_format: { type: "json_object" }
				}),
			});

			const responseText = await response.text();
			
			try {
				const responseData = JSON.parse(responseText);
				
				if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
					throw new Error("Unexpected response structure");
				}

				// Parse the JSON response from the AI
				const content = responseData.choices[0].message.content;
				const parsedResponse = JSON.parse(content);
				
				if (!parsedResponse.chunks) {
					throw new Error("Invalid chunks format in response");
				}
				
				return parsedResponse.chunks.map((chunk: any) => chunk.text);
			} catch (error) {
				console.error("Error parsing chunking response:", error);
				throw error;
			}
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
	public async generateFollowUpQuestions(messages: Array<{ role: string; content: string }>): Promise<any> {
		try {
			console.log("Generating follow-up questions based on conversation history");
			
			// Create a new array with system prompt first followed by conversation history
			const promptMessages = [
				{
					role: "system",
					content: prompts.system.generateQuickFollowUps
				},
				...messages
			];
			
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: process.env.OPENAI_SECONDARY_MODEL || "gpt-4o-mini",
					messages: promptMessages,
					temperature: 0.6,
					response_format: { type: "json_object" },
				}),
			});

			const responseText = await response.text();
			
			try {
				const responseData = JSON.parse(responseText);
				
				if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
					throw new Error("Unexpected response structure");
				}

				// Parse the content which should be a JSON string
				const content = responseData.choices[0].message.content;
				return JSON.parse(content);
			} catch (parseError) {
				console.error("Failed to parse follow-up questions:", parseError);
				return [];
			}
		} catch (error: any) {
			console.error("Error generating follow-up questions:", error);
			return []; // Return empty array instead of throwing
		}
	}
}
