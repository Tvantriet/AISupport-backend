import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../database/typeorm-db.js'
import { Product } from '../app/models/Product.entity.js';
import { Category } from '../app/models/Category.entity.js';

// --- Configuration ---
const OUTPUT_FILE_NAME = 'openai_batch_requests.jsonl';

const SYSTEM_PROMPT_TEMPLATE = `You are an expert assistant for generating realistic, diverse, and synthetic support ticket data.
Your entire response MUST be a single JSON object. The root of this JSON object MUST be an array. Each element in the array represents one full support ticket conversation.
Each ticket conversation itself MUST be an array of message pair objects. Each message pair object MUST have two keys: 'userMessage' (string) and 'assistantMessage' (string).

Example of the required output structure for ONE ticket conversation (your final output will be an array of these, if multiple are requested):
\`[{"userMessage": "User's first message...", "assistantMessage": "Assistant's first reply..."}, {"userMessage": "User's follow-up...", "assistantMessage": "Assistant's next reply..."}]\`

If asked to generate multiple ticket conversations, your final output should look like this (an array of ticket conversations):
\`[ [{"userMessage": "Ticket 1 User Msg 1", "assistantMessage": "Ticket 1 Asst Msg 1"}, ...], [{"userMessage": "Ticket 2 User Msg 1", "assistantMessage": "Ticket 2 Asst Msg 1"}, ...] ]\`

When generating the content:
The user's messages should vary in technical detail and clarity: some users will be vague, some moderately clear, and some very detailed.
The assistant's responses should be helpful and aim to resolve the user's issue.
CRITICAL: If the assistant, in a real-world scenario, would not know the definitive answer to a user's question or if the information provided by the user is insufficient for a specific solution, the assistant MUST NOT invent technical details or steps. Instead, the assistant should: 1. Ask clarifying questions to gather more information. 2. Suggest general troubleshooting steps. 3. State that it cannot provide a specific solution without more details. 4. If appropriate, suggest consulting official documentation or escalating the issue. DO NOT MAKE UP ANSWERS OR SOLUTIONS if uncertain.`;

const USER_MESSAGE_TEMPLATE = `Please generate {num_tickets_to_generate} synthetic support ticket conversation(s) on the specific topic of: '{topic}'.
Each generated ticket conversation MUST be a complete interaction with approximately {num_exchanges_per_ticket} user-assistant message pairs. So the conversation should complete and in a spot where the ticket would be closed.`

function formatUserMessage(
    topic: string,
    refName: string,
    numExchanges: number,
    numTicketsToGenerate: number
): string {
    return USER_MESSAGE_TEMPLATE
        .replace(/{topic}/g, topic)
        .replace(/{ref_name}/g, refName)
        .replace(/{num_exchanges_per_ticket}/g, numExchanges.toString())
        .replace(/{num_tickets_to_generate}/g, numTicketsToGenerate.toString());
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 1): number {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
}

interface BatchRequestItem {
    name: string;
    type: 'product' | 'category';
    id: string;
}

function createOpenAIBatchRequest(
    item: BatchRequestItem,
    numExchanges: number,
    numTicketsToGenerate: number,
    temperature: number,
    customId: string
): object {
    const topic = item.name;
    const refName = item.name;

    const userMessageContent = formatUserMessage(
        topic,
        refName,
        numExchanges,
        numTicketsToGenerate
    );

    return {
        custom_id: customId,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
            model: 'gpt-4.1',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_TEMPLATE },
                { role: 'user', content: userMessageContent }
            ],
            temperature: temperature,
            response_format: { type: "json_object" },
            max_tokens: 10000
        }
    };
}

async function generateBatchFile() {
    if (!AppDataSource.isInitialized) {
        console.log('Initializing data source...');
        await AppDataSource.initialize();
        console.log('Data source initialized.');
    } else {
        console.log('Data source already initialized.');
    }

    const productRepository = AppDataSource.getRepository(Product);
    const categoryRepository = AppDataSource.getRepository(Category);

    // Fetching product_name for products and name for categories
    const products = await productRepository.find({ select: { product_name: true, id: true } });
    const categories = await categoryRepository.find({ select: { name: true, id: true } });

    const outputFilePath = 'C:\\Users\\Timvt\\Downloads\\batch\\openai_batch_requests3.jsonl';
    const writeStream = fs.createWriteStream(outputFilePath, { flags: 'w' });
    let requestIdCounter = 0;

    const itemsToProcess: BatchRequestItem[] = [];

    if (products && Array.isArray(products)) {
        products.forEach(p => {
            if (p && typeof p.product_name === 'string' && p.id) { // Ensure product_name and id exist
                itemsToProcess.push({ name: p.product_name, type: 'product', id: p.id });
            }
        });
    }

    if (categories && Array.isArray(categories)) {
        categories.forEach(c => {
            if (c && typeof c.name === 'string' && c.id) { // Ensure name and id exist
                itemsToProcess.push({ name: c.name, type: 'category', id: c.id });
            }
        });
    }

    console.log(`Processing ${itemsToProcess.length} items...`);

    for (const item of itemsToProcess) {
        const numExchanges = getRandomInt(3, 5);         // Random ticket length 1-5 exchanges
        const temperature = getRandomFloat(0.4, 1.1); // Random temperature 0.4-0.8
        const numTicketsToGenerate = getRandomInt(2, 6);

        // Create a unique custom_id for each request
        const customId = `req_${item.type}_${item.id.substring(0,8)}_${item.name}_${requestIdCounter++}`;
        
        const batchRequest = createOpenAIBatchRequest(
            item,
            numExchanges,
            numTicketsToGenerate,
            temperature,
            customId
        );

        writeStream.write(JSON.stringify(batchRequest) + '\n');
    }

    writeStream.end();

    await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', (err) => {
            console.error("Error writing to file:", err);
            reject(err);
        });
    });

    console.log(`Successfully generated ${requestIdCounter} batch requests to ${outputFilePath}`);

    if (AppDataSource.isInitialized) {
        console.log('Destroying data source...');
        await AppDataSource.destroy();
        console.log('Data source destroyed.');
    }
}

generateBatchFile().catch(error => {
    console.error("Error generating batch file:", error);
    if (AppDataSource && AppDataSource.isInitialized) {
        AppDataSource.destroy().then(() => console.log("Data source destroyed after error."))
            .catch(destroyError => console.error("Error destroying data source after error:", destroyError));
    }
    process.exit(1);
});