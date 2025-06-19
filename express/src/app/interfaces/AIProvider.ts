/**
 * Interface defining the contract for AI service providers
 * Focused on chat and text processing operations
 */
export interface AIProvider {
  /**
   * Generate a chat completion with configurable parameters
   * @param options Chat completion configuration
   * @returns Promise containing the generated response
   */
  createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  
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

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  systemPrompt?: string;
  tools?: Tool[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
    description?: string;
    parameters: Record<string, any>;
  };
}

export interface Tool{
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}
export interface ChatCompletionResponse {
  content: string;
  toolCalls: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
} 