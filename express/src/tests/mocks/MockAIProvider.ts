import { AIProvider } from "../../app/interfaces/AIProvider.js";

/**
 * Mock implementation of AIProvider for testing
 */
export default class MockAIProvider implements AIProvider {
  /**
   * Create a mock embedding vector
   * @param text The text to create an embedding for
   * @returns A mock embedding vector of specified dimension
   */
  public async createEmbedding(text: string): Promise<number[]> {
    // Generate a deterministic vector based on text length
    const dimension = 1536; // OpenAI's default embedding dimension
    const vector = new Array(dimension).fill(0).map((_, i) => 
      (Math.sin(i + text.length) + 1) / 2 // Values between 0-1
    );
    return vector;
  }
  
  /**
   * Generate a mock chat completion
   * @param messages Array of messages
   * @returns A mock response based on the last user message
   */
  public async createChatCompletion(messages: Array<{role: string; content: string}>): Promise<string> {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    
    if (lastUserMessage) {
      return `Mock response to: ${lastUserMessage.content.substring(0, 50)}...`;
    }
    
    return "This is a mock response from the AI provider.";
  }
  
  /**
   * Split text into mock chunks
   * @param text The text to split
   * @returns An array of text chunks
   */
  public async splitTextIntoChunks(text: string): Promise<string[]> {
    // Simple split by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.filter(p => p.trim().length > 0);
  }
  
  /**
   * Generate mock follow-up questions
   * @param messages Conversation history
   * @returns Mock follow-up questions
   */
  public async generateFollowUpQuestions(messages: Array<{role: string; content: string}>): Promise<any> {
    return [
      { question: "How can I fix this issue?", relevant: true },
      { question: "What does this error mean?", relevant: true },
      { question: "Can you explain more?", relevant: false }
    ];
  }
} 