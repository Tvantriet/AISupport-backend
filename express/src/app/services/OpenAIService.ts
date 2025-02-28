import fetch from 'node-fetch';

export default class OpenAIService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            console.warn('OpenAI API key is not set. Set OPENAI_API_KEY in your environment variables.');
        }
    }

    /**
     * Create an embedding for the given text
     * 
     * @param text The text to create an embedding for
     * @param model The embedding model to use (default: text-embedding-3-large)
     * @returns The embedding vector
     */
    public async createEmbedding(text: string): Promise<number[]> {
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'text-embedding-3-large',
                    input: text
                })
            });

            const responseData: any = await response.json();
            
            if (!responseData.data[0].embedding) {
                throw new Error('Invalid response from OpenAI API');
            }
            
            return responseData.data[0].embedding;
        } catch (error: any) {
            console.error('Error creating embedding:', error);
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
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a document processing assistant. Split the following text into smaller, semantically meaningful chunks of about 200-300 words each. Return the chunks as a JSON array of objects with "text" field.'
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    response_format: { type: 'json_object' }
                })
            });

            const data: any = await response.json();
            
            if (!data.choices[0].message) {
                throw new Error('Invalid response from OpenAI API');
            }
            
            // Parse the response
            const content = data.choices[0].message.content;
            const parsedContent = JSON.parse(content);
            
            // Ensure the response has the expected format
            if (!Array.isArray(parsedContent.chunks)) {
                throw new Error('Invalid chunks format from OpenAI API');
            }
            
            // Extract just the text from each chunk
            return parsedContent.chunks.map((chunk: any) => chunk.text);
        } catch (error: any) {
            console.error('Error splitting text with GPT:', error);
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
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a technical support assistant. Your task is to enhance user queries to find the most relevant sections in product support documentation. Expand the query with technical terms and specific details that might help locate the right information.'
                        },
                        {
                            role: 'user',
                            content: `Enhance this support document search query: "${query}"`
                        }
                    ]
                })
            });

            const data: any = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from OpenAI API');
            }
            
            return data.choices[0].message.content;
        } catch (error: any) {
            console.error('Error enhancing query:', error);
            // If enhancement fails, return the original query
            return query;
        }
    }

    /**
     * Generate a chat completion response
     * 
     * @param messages Array of message objects with role and content
     * @param model The model to use (default: gpt-4o-mini)
     * @returns The generated response text
     */
    public async createChatCompletion(messages: Array<{role: string, content: string}>): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages
                })
            });

            const data: any = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response from OpenAI API');
            }
            
            return data.choices[0].message.content;
        } catch (error: any) {
            console.error('Error creating chat completion:', error);
            throw new Error(`Failed to create chat completion: ${error.message}`);
        }
    }
} 