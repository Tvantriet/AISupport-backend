/**
 * Interface defining the contract for AI service providers
 * Focused on chat and text processing operations
 */
export interface AIProvider {
  /**
   * Generate a chat completion based on the provided messages
   * @param messages Array of messages with role and content
   * @returns Promise containing the generated response text
   */
  createChatCompletion(messages: Array<{role: string; content: string}>): Promise<string>;
  
  /**
   * Split text into semantically meaningful chunks for processing
   * @param text The text to split into chunks
   * @returns Promise containing an array of text chunks
   */
  splitTextIntoChunks(text: string): Promise<string[]>;
  
  /**
   * Generate follow-up questions based on conversation history
   * @param messages Conversation history messages
   * @returns Promise containing follow-up questions
   */
  generateFollowUpQuestions(messages: Array<{role: string; content: string}>): Promise<any>;
} 