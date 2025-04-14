import { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import fetch from "node-fetch";

export default class OpenAIEmbeddingService implements EmbeddingProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    if (!this.apiKey) {
      console.warn("OpenAI API key is not set. Set OPENAI_API_KEY in your environment variables.");
    }
  }

  /**
   * Create an embedding for the given text using OpenAI
   *
   * @param text The text to create an embedding for
   * @returns The embedding vector
   */
  public async createEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`Creating embedding for text (${text.length} chars): "${text.substring(0, 30)}..."`);
      
      const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";
      
      const requestBody = {
        model: model,
        input: text,
      };
      
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Only log status - no headers
      if (response.status !== 200) {
        console.log(`⚠️ Embedding API response status: ${response.status} ${response.statusText}`);
      }
      
      // Get response as text first for safer handling
      const responseText = await response.text();
      
      // Try to parse the JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error: Failed to parse JSON response");
        throw new Error(`Invalid JSON response from OpenAI API`);
      }
      
      // Check if the expected data is present
      if (!responseData.data || !responseData.data[0] || !responseData.data[0].embedding) {
        console.error("Error: Unexpected response structure");
        throw new Error("Invalid response format from OpenAI API");
      }
      
      return responseData.data[0].embedding;
    } catch (error: any) {
      console.error("Error creating embedding:", error.message);
      throw error;
    }
  }
} 