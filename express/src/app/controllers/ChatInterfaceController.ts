import { Request, Response } from "express";
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
	 * Process a complete user request with document search, chatbot response,
	 * and follow-up questions in a single stateless request
	 *
	 * @param req
	 * @param res
	 */
	public async processUserRequest(req: Request, res: Response) {
		try {
			const { query, productId, conversationHistory } = req.body;

			if (!query || !conversationHistory || !productId) {
				return res.status(400).json({
					success: false,
					error: "Query, productId and conversation history name are required",
				});
			}

			// Process the user request using the ChatService
			const result = await this.chatService.processUserRequest(
				query, 
				productId,
				conversationHistory
			);

			// Send the response immediately
			return ApiResponses.response(res, result);
		} catch (error: any) {
			console.error("Error processing user request:", error);
			return ApiResponses.response(res, {
				success: false,
				message: error.message || "An error occurred while processing your request",
			});
		}
	}

	/**
	 * Generate follow-up questions for a conversation
	 * 
	 * @param req Request with conversation history, query, and response
	 * @param res Response object
	 */
	public async getFollowUpQuestions(req: Request, res: Response) {
		try {
			const { conversationHistory, query, response } = req.body;
			
			if (!query || !response) {
				return res.status(400).json({
					success: false,
					error: "Query and response are required"
				});
			}
			
			const followUpQuestions = await this.chatService.generateFollowUpQuestions(
				conversationHistory || [],
				query,
				response
			);
			
			return res.json({
				success: true,
				followUpQuestions
			});
		} catch (error: any) {
			console.error("Error getting follow-up questions:", error);
			return res.status(500).json({
				success: false,
				error: error.message || "An error occurred while generating follow-up questions"
			});
		}
	}
}
