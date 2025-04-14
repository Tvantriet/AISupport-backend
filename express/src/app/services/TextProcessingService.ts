import fs from "fs";
import { PDFExtract } from "pdf.js-extract";
import mammoth from "mammoth";
import { AIProvider } from "../interfaces/AIProvider.js";

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
        console.log(`🔄 Large text detected (${text.length} chars), performing initial chunking`);
        const initialChunks = this.chunkTextWithOverlap(text, 800, 0.15);
        console.log(`📊 Created ${initialChunks.length} initial chunks for parallel processing`);
        
        // Process all chunks in parallel instead of sequentially
        console.log(`🚀 Processing ${initialChunks.length} chunks in parallel with AI`);
        const chunkPromises = initialChunks.map(chunk => 
          this.aiProvider.splitTextIntoChunks(chunk)
        );
        
        // Wait for all chunks to be processed
        const semanticChunksArrays = await Promise.all(chunkPromises);
        
        // Flatten the array of arrays into a single array
        const allSemanticChunks = semanticChunksArrays.flat();
        
        console.log(`✅ Parallel processing complete: ${initialChunks.length} initial chunks → ${allSemanticChunks.length} semantic chunks`);
        return allSemanticChunks;
      } else {
        // For smaller texts, directly use AI for semantic chunking
        return await this.aiProvider.splitTextIntoChunks(text);
      }
    } catch (error) {
      console.error("❌ Error splitting text into chunks:", error);
      // Fallback to basic chunking if AI chunking fails
      const basicChunks = this.chunkTextWithOverlap(text, 1000, 0.1);
      console.log(`⚠️ Falling back to basic chunking: created ${basicChunks.length} chunks`);
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
  public chunkTextWithOverlap(text: string, maxTokens: number, overlapPercent: number): string[] {
    const words = text.split(/\s+/);
    const overlapTokens = Math.floor(maxTokens * overlapPercent);
    const chunks = [];

    for (let i = 0; i < words.length; i += maxTokens - overlapTokens) {
      const chunk = words.slice(i, i + maxTokens).join(" ");
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
  public performBasicChunking(text: string): string[] {
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
  public async convertFileToText(filePath: string): Promise<string> {
    // Check file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    try {
      if (ext === 'pdf') {
        console.log(`📄 Processing PDF file: ${filePath}`);
        const pdfExtract = new PDFExtract();
        const data = await pdfExtract.extract(filePath, {});
        
        const text = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n\n');
        console.log(`📊 Extracted ${text.length} characters, ${data.pages.length} pages from PDF`);
        
        return text;
      } 
      else if (['docx', 'doc'].includes(ext || '')) {
        console.log(`📄 Processing DOCX file: ${filePath}`);
        const result = await mammoth.extractRawText({path: filePath});
        console.log(`📊 Extracted ${result.value.length} characters from DOCX`);
        
        return result.value;
      } 
      else if (['txt', 'md'].includes(ext || '')) {
        console.log(`📄 Processing text file: ${filePath}`);
        const text = fs.readFileSync(filePath, 'utf8');
        console.log(`📊 Extracted ${text.length} characters from text file`);
        
        return text;
      } 
      else {
        throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error(`Error converting file ${filePath} to text:`, error);
      throw error;
    }
  }

  /**
   * Extract text and metadata from a document
   *
   * @param document Document (string path or object with text)
   * @returns Object with text, metadata, and source
   */
  public async extractDocumentContent(document: any): Promise<{ text: string; metadata: any; source: string }> {
    let text: string;
    let metadata = {};
    let source = "unknown";

    try {
      if (typeof document === "string") {
        // Document is a file path
        text = await this.convertFileToText(document);
        source = document;
      } else if (document.text) {
        // Document is an object with text property
        text = document.text;
        metadata = document.metadata || {};
        source = document.source || "unknown";
      } else {
        throw new Error("Invalid document format. Expected a file path or an object with a text property.");
      }

      return { text, metadata, source };
    } catch (error) {
      console.error("Error extracting document content:", error);
      throw error;
    }
  }
} 