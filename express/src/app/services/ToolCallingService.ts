import { ToolCall, Tool, ChatMessage, ChatCompletionResponse } from "../interfaces/AIProvider.js"; // Assuming AIProvider.ts defines these


// Define the signature for a function that can create an AI completion
// This will be passed in from ChatService so ToolCallingService can make follow-up AI calls
export type CreateCompletionFunction = (
    messages: ChatMessage[],
    tools?: Tool[],
    tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } },
    customSystemPrompt?: string | null
) => Promise<ChatCompletionResponse>;


// Example Opening Hours (Consider moving to a config file/service if more complex)
const SUPPORT_OPENING_HOURS = {
    // Using UTC days and hours. 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
    days: {
        1: { open: 9, close: 17 },  // Monday 9 AM - 5 PM UTC
        2: { open: 9, close: 17 },  // Tuesday
        3: { open: 9, close: 17 },  // Wednesday
        4: { open: 9, close: 17 },  // Thursday
        5: { open: 9, close: 12 },  // Friday 9 AM - 12 PM UTC
    } as Record<number, { open: number; close: number }>,
    closedMessageForAI: "Human support is available Monday to Thursday from 9 AM to 5 PM UTC, and Friday from 9 AM to 12 PM UTC.",
};

export default class ToolCallingService {
    constructor() {
    }

    /**
     * Returns a list of tools available for the AI to call.
     */
    public getAvailableTools(): Tool[] {
        return [
            {
                type: "function",
                function: {
                    name: "contact_customer_service",
                    description: "Use this function when: 1. You dont have the needed information to answer the question that user asked 2. The users expresses wanting to contact customer service or the user expresses significant frustration. Make sure you give a response prior to calling the tool",
                    parameters: {
                        type: "object",
                        required: [
                            "reason",
                            "content"
                        ],
                        properties: {
                            reason: {
                                type: "string",
                                description: "A brief reason why human takeover is being requested by the user or AI. e.g., 'User requested to speak to an agent.'"
                            },
                            content: {
                                type: "string",
                                description: "This is a short message the users where you tell them you are referring them to customer service, when applicable additionaly acknowledge their situation. Take the system prompt into account when writing this"
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
        ];
    }

    /**
     * Processes a tool call for a human takeover.
     * @param toolCall The tool call to process.
     * @returns A promise with the processed tool call result.
     */
    private requestHumanTakeover(toolCall: ToolCall): ChatMessage
    {
        const now = new Date();
        const currentDayUTC = now.getUTCDay();
        const currentHourUTC = now.getUTCHours();

        const dayHours = SUPPORT_OPENING_HOURS.days[currentDayUTC];
        const toolCallArguments = JSON.parse(toolCall.function.arguments);
        const toolCallResponse = toolCallArguments?.content || ""; // The response from the AI to the user
        const toolCallReason = toolCallArguments?.reason || "";
        if (dayHours && currentHourUTC >= dayHours.open && currentHourUTC < dayHours.close) {
            return {
                role: "tool",
                content: JSON.stringify({
                    tool: "contact_customer_service",
                    success: true,
                    isOpen: true,
                    assistantCompletionResponse: toolCallResponse,
                    message: 'Human support is currently available through a chat link or phone number.'
                })
            }
        }

        return {
            role: "tool",
            content: JSON.stringify({
                tool: "contact_customer_service",
                success: true,
                isOpen: false,
                message: 'Human support is currently unavailable. ' + SUPPORT_OPENING_HOURS.closedMessageForAI,
                assistantCompletionResponse: toolCallResponse,
                openingHours: SUPPORT_OPENING_HOURS.days[currentDayUTC]
            })        
        };
    }

    /**
     * Processes tool calls requested by the AI.
     * Handles internal tools directly (e.g., checking support hours) and
     * identifies tools meant for frontend execution.
     * 
     * @param toolCalls The tool_calls array from the AI's response.
     * @param currentMessages Conversation history up to and including the assistant's message with tool_calls.
     * @param originalAICallTools The tools that were available for the AI call that produced these tool_calls.
     * @param createCompletionFunction A function (likely from ChatService) to make further AI calls.
     * @returns A promise with the processed tool call results.
     */
    public async processToolCalls(
        toolCalls: ToolCall[],
    ): Promise<ChatMessage[]> {
        const results: ChatMessage[] = [];
        for(const toolCall of toolCalls){
            if(toolCall.function.name === "contact_customer_service"){
                const result = await this.requestHumanTakeover(toolCall);
                results.push(result);
            }
        }
        return results;
    }
}