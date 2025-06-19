import fs from "fs";
import mammoth from "mammoth";
import { AIProvider } from "../interfaces/AIProvider.js";
import { PDFExtract } from 'pdf.js-extract';

/**
 * Service for text processing operations like chunking, 
 * file conversion, and semantic chunking
 */
export default class TextProcessingService {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Split text into semantic chunks using AI
   *
   * @param text Text to split
   * @returns Array of semantic chunks
   */
  public async splitTextIntoSemanticChunks(text: string): Promise<string[]> {
    try {
      // For very large texts, first do a basic split to avoid token limits
      if (text.length > 10000) {
        console.log(`Large text detected (${text.length} chars), performing initial chunking`);
        const initialChunks = this.chunkTextWithOverlap(text, 1500, 0.15);
        console.log(`Created ${initialChunks.length} initial chunks for parallel processing`);
        
        // Process all chunks in parallel instead of sequentially
        console.log(`Processing ${initialChunks.length} chunks in parallel with AI`);
        const chunkPromises = initialChunks.map(chunk => 
          this.aiProvider.splitTextIntoChunks(chunk)
        );
        
        // Wait for all chunks to be processed
        const semanticChunksArrays = await Promise.all(chunkPromises);
        
        // Flatten the array of arrays into a single array
        const allSemanticChunks = semanticChunksArrays.flat();
        
        console.log(`Parallel processing complete: ${initialChunks.length} initial chunks → ${allSemanticChunks.length} semantic chunks`);
        return allSemanticChunks;
      } else {
        // For smaller texts, directly use AI for semantic chunking
        return await this.aiProvider.splitTextIntoChunks(text);
      }
    } catch (error) {
      console.error("Error splitting text into chunks:", error);
      // Fallback to basic chunking if AI chunking fails
      const basicChunks = this.chunkTextWithOverlap(text, 1000, 0.1);
      console.log(`Falling back to basic chunking: created ${basicChunks.length} chunks`);
      return basicChunks;
    }
  }

  /**
   * Split text into chunks with overlap
   *
   * @param text Text to split
   * @param maxTokens Maximum tokens per chunk
   * @param overlapPercent Percentage of overlap between chunks
   * @returns Array of text chunks
   */
  private chunkTextWithOverlap(text: string, maxWords: number, overlapPercent: number): string[] {
    const words = text.split(/\s+/);
    const overlapTokens = Math.floor(maxWords * overlapPercent);
    const chunks = [];

    for (let i = 0; i < words.length; i += maxWords - overlapTokens) {
      const chunk = words.slice(i, i + maxWords).join(" ");
      chunks.push(chunk);
    }

    return chunks;
  }
  
  /**
   * Perform basic chunking by paragraphs and sentences
   * Used as a fallback when AI chunking fails
   * 
   * @param text Text to chunk
   * @returns Array of text chunks
   */
  private performBasicChunking(text: string): string[] {
    console.log("Performing basic chunking as fallback");
    
    // Simple paragraph-based chunking
    const paragraphs = text.split(/\n\s*\n/);
    
    // Combine small paragraphs
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;
      
      // If adding this paragraph would make the chunk too large, start a new chunk
      if (currentChunk.length + trimmedParagraph.length > 800) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        
        // If paragraph itself is too large, split it into sentences
        if (trimmedParagraph.length > 800) {
          const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
          let sentenceChunk = "";
          
          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length > 800) {
              chunks.push(sentenceChunk);
              sentenceChunk = sentence;
            } else {
              sentenceChunk += " " + sentence;
            }
          }
          
          if (sentenceChunk.length > 0) {
            chunks.push(sentenceChunk);
          }
        } else {
          currentChunk = trimmedParagraph;
        }
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Convert a file to text
   *
   * @param filePath Path to the file
   * @returns Extracted text
   */
  private async convertFileToText(content: Buffer, file_extension: string): Promise<string> {
    // Check file extension
    let text = '';

    if (file_extension === 'pdf') {
      const pdfExtract = new PDFExtract();
     const data = await pdfExtract.extractBuffer(content);
      text = data.pages.map(page => 
        page.content.map(item => item.str).join(' ')
      ).join('\n');
      
    } else if (file_extension === 'docx') {
      const docxData = await mammoth.extractRawText({ buffer: content });
      text = docxData.value;
    }
    else if (file_extension === 'txt') {
      text = content.toString('utf-8');
    }
    else {
      throw new Error(`Unsupported file extension: ${file_extension}`);
    }

    return text;
  }
  /**
   * Extract text and metadata from a document
   *
   * @param document Document (string path or object with text)
   * @returns Object with text, metadata, and source
   */
  public async extractDocumentContent(documentContent: Buffer, mimeType: string): Promise<string> {
    let text: string;

    try {
      text = await this.convertFileToText(documentContent, mimeType);
      console.log(`Extracted ${text.length} characters from Buffer`);
    } catch (error) {
      console.error("Error extracting document content:", error);
      throw error;
    }

    return text;
  }
} 