import fetch from "node-fetch";
import prompts from "../config/prompts.js";

export default class OpenAIService {
	private apiKey: string;

	constructor() {
		this.apiKey = process.env.OPENAI_API_KEY || "";
		if (!this.apiKey) {
			console.warn("OpenAI API key is not set. Set OPENAI_API_KEY in your environment variables.");
		}
	}

	/**
	 * Create an embedding for the given text
	 *
	 * @param text The text to create an embedding for
	 * @param model The embedding model to use (default: text-embedding-3-small)
	 * @returns The embedding vector
	 */
	public async createEmbedding(text: string): Promise<number[]> {
		try {
			console.log(`Creating embedding for text (${text.length} chars, first 50 chars: "${text.substring(0, 50)}...")`);
			
			const requestBody = {
				model: "text-embedding-3-small",
				input: text,
			};
			
			console.log("Sending request to OpenAI embeddings API");
			const response = await fetch("https://api.openai.com/v1/embeddings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			console.log(`Received response with status: ${response.status} ${response.statusText}`);
			
			// Log response headers for debugging
			const headers: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});
			console.log("Response headers:", headers);
			
			// Get response as text first for safer handling
			const responseText = await response.text();
			console.log(`Raw response (first 200 chars): "${responseText.substring(0, 200)}..."`);
			
			// Check for HTML in response
			if (responseText.includes("<html") || responseText.includes("<!DOCTYPE")) {
				console.error("HTML detected in response, this indicates an error");
				throw new Error("OpenAI API returned HTML instead of JSON. Check API key and rate limits.");
			}
			
			// Try to parse the JSON
			let responseData;
			try {
				responseData = JSON.parse(responseText);
			} catch (parseError) {
				console.error("Failed to parse JSON response:", parseError);
				throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
			}
			
			// Check if the expected data is present
			if (!responseData.data || !responseData.data[0] || !responseData.data[0].embedding) {
				console.error("Unexpected response structure:", responseData);
				throw new Error("Invalid response format from OpenAI API");
			}

			console.log(`Successfully created embedding with ${responseData.data[0].embedding.length} dimensions`);
			return responseData.data[0].embedding;
		} catch (error: any) {
			console.error("Error creating embedding:", {
				message: error.message,
				stack: error.stack,
				response: error.response ? {
					status: error.response.status,
					headers: error.response.headers,
					data: error.response.data
				} : "No response data"
			});
			throw new Error(`Failed to create embedding: ${error.message}`);
		}
	}

	/**
	 * Split text into semantic chunks using GPT
	 *
	 * @param text The text to split
	 * @param model The model to use (default: gpt-4o-mini)
	 * @returns Array of text chunks
	 */
	public async splitTextIntoChunks(text: string): Promise<string[]> {
		try {
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: prompts.system.chunkingAgent
						},
						{
							role: "user",
							content: text
						},
					],
					response_format: { type: "json_object" },
				}),
			});

			const data: any = await response.json();

			if (!data.choices[0].message) {
				throw new Error("Invalid response from OpenAI API");
			}

			// Parse the response
			const content = data.choices[0].message.content;
			const parsedContent = JSON.parse(content);

			// Ensure the response has the expected format
			if (!Array.isArray(parsedContent.chunks)) {
				throw new Error("Invalid chunks format from OpenAI API");
			}

			// Extract just the text from each chunk
			return parsedContent.chunks.map((chunk: any) => chunk.text);
		} catch (error: any) {
			console.error("Error splitting text with GPT:", error);
			throw new Error(`Failed to split text: ${error.message}`);
		}
	}

	/**
	 * Enhance a user query using OpenAI
	 *
	 * @param query The original user query
	 * @returns Enhanced query
	 */
	public async enhanceUserQuery(query: string): Promise<string> {
		try {
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: prompts.system.queryEnhancer
						},
						{
							role: "user",
							content: prompts.user.enhanceQuery(query)
						},
					],
				}),
			});

			const data: any = await response.json();

			if (!data.choices || !data.choices[0] || !data.choices[0].message) {
				throw new Error("Invalid response from OpenAI API");
			}

			return data.choices[0].message.content;
		} catch (error: any) {
			console.error("Error enhancing query:", error);
			// If enhancement fails, return the original query
			return query;
		}
	}

	/**
	 * Create a chat completion
	 *
	 * @param messages Array of chat messages
	 * @param options Additional options for the API call
	 * @returns The generated message content
	 */
	public async createChatCompletion(
		messages: Array<{ role: string; content: string }>,
		options?: any,
	): Promise<any> {
		try {
			console.log(`Creating chat completion with ${messages.length} messages`);
			// Log the last message without exposing full history
			if (messages.length > 0) {
				const lastMessage = messages[messages.length - 1];
				console.log(`Last message role: ${lastMessage.role}, content length: ${lastMessage.content.length}`);
				console.log(`Last message preview: "${lastMessage.content}"`);
			}
			
			const requestBody = {
				model: options?.model || "gpt-4o",
				messages: messages,
				temperature: options?.temperature !== undefined ? options.temperature : 0.7,
				max_tokens: options?.max_tokens || 1000,
				// Add other parameters here as needed
			};
			
			console.log("Sending request to OpenAI chat completions API");
			console.log("Request parameters:", {
				model: requestBody.model,
				temperature: requestBody.temperature,
				max_tokens: requestBody.max_tokens,
				message_count: requestBody.messages.length
			});
			
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			console.log(`Received response with status: ${response.status} ${response.statusText}`);
			
			// Log response headers for debugging
			const headers: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});
			console.log("Response headers:", headers);
			
			// Get response as text first for safer handling
			const responseText = await response.text();
			console.log(`Raw response (first 200 chars): "${responseText.substring(0, 200)}..."`);
			
			// Check for HTML in response
			if (responseText.includes("<html") || responseText.includes("<!DOCTYPE")) {
				console.error("HTML detected in response, this indicates an error");
				throw new Error("OpenAI API returned HTML instead of JSON. Check API key and rate limits.");
			}
			
			// Try to parse the JSON
			let responseData;
			try {
				responseData = JSON.parse(responseText);
			} catch (parseError) {
				console.error("Failed to parse JSON response:", parseError);
				throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
			}
			
			// Check for error response
			if (responseData.error) {
				console.error("OpenAI API returned an error:", responseData.error);
				throw new Error(`OpenAI API error: ${responseData.error.message || "Unknown error"}`);
			}
			
			// Check if the expected data is present
			if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
				console.error("Unexpected response structure:", responseData);
				throw new Error("Invalid response format from OpenAI API");
			}

			console.log("Successfully received chat completion");
			return responseData.choices[0].message.content;
		} catch (error: any) {
			console.error("Error creating chat completion:", {
				message: error.message,
				stack: error.stack,
				response: error.response ? {
					status: error.response.status,
					headers: error.response.headers,
					data: error.response.data
				} : "No response data"
			});
			throw new Error(`Failed to create chat completion: ${error.message}`);
		}
	}
}
