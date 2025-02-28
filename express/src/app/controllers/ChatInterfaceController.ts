import { Request, Response } from 'express';
import Controller from "./Controller.js";
import ChatService from "../services/ChatService.js";
import ApiResponses from "../utils/ApiResponses.js";

export default class ChatInterfaceController extends Controller {
    private chatService: ChatService;
    
    constructor() {
        super();
        this.chatService = new ChatService();
    }
    
    public validate(method: string) {
        return this.validateRequest([]);
    }
    
    /**
     * Process a complete user request with document search and chatbot response
     * 
     * @param req
     * @param res
     */
    public async processUserRequest(req: Request, res: Response) {
        try {
            const { 
                query, 
                productName, 
                conversationHistory, 
                limit = 5 
            } = req.body;
            
            if (!query || !productName) {
                return res.status(400).json({
                    success: false,
                    error: 'Query and collection name are required'
                });
            }
            
            const result = await this.chatService.processUserRequest(
                query, 
                productName, 
                conversationHistory,
                limit
            );
            
            return ApiResponses.response(res, result);
        } catch (error: any) {
            console.error('Error processing user request:', error);
            return ApiResponses.response(res, { 
                success: false, 
                message: error.message || 'An error occurred while processing your request'
            });
        }
    }
}