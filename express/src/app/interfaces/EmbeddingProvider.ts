/**
 * Interface for services that provide embedding functionality
 */
export interface EmbeddingProvider {
  /**
   * Create an embedding vector for the given text
   * @param text The text to create an embedding for
   * @returns Promise containing the embedding vector
   */
  createEmbedding(text: string): Promise<number[]>;
} 