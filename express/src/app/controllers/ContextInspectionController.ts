import { Request, Response } from "express";
import Controller from "./Controller.js"; // Assuming Controller.js is in the same directory
import ContextInspectionService from "../services/ContextInspectionService.js";
import { ValidationChain } from "express-validator";
import DocumentService from "../services/DocumentService.js";
import ProductService from "../services/ProductService.js";
import CategoryService from "../services/CategoryService.js";
import PointService from "../services/PointService.js";
import { Middleware } from "express-validator/src/base.js";

export default class ContextInspectionController extends Controller {
  private contextInspectionService: ContextInspectionService;

  constructor() {
    super();
    // Instantiate services here or expect them to be injected if using a DI container
    const documentService = new DocumentService();
    const productService = new ProductService();
    const categoryService = new CategoryService();
    const pointService = new PointService();
    this.contextInspectionService = new ContextInspectionService(
      documentService,
      productService,
      categoryService,
      pointService
    );
  }

  // Basic validation, can be expanded per method
  public validate(method: string): Middleware {
    let validations: ValidationChain[] = [];
    switch (method) {
      case "getAvailableContext":
        // Example: validations = [check('productId').isUUID()];
        break;
      case "getUsedContext":
        // Example: validations = [check('chatId').isString().notEmpty()];
        break;
      case "getContextRelevance":
        // Example: validations = [check('productId').isUUID(), check('query').isString().notEmpty()];
        break;
      default:
        validations = [];
    }
    return this.validateRequest(validations);
  }

  /**
   * Endpoint for Tab 1: Get Available Context
   */
  public listAvailableDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = req.params.productId;
      if (!productId) {
        res.status(400).json({ success: false, message: "Product ID is required." });
        return;
      }
      const data = await this.contextInspectionService.getAllDocuments(productId);
      if (!data || data.length === 0) {
        res.status(404).json({ success: false, message: `No documents found for Product ID: ${productId}` });
        return;
      }
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`[ContextInspectionController] Error in listAvailableDocuments for productId ${req.params.productId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available documents.',
        error: error.message,
      });
    }
  };

  /**
   * Endpoint for submitting a query, getting a chat completion, 
   * the full conversation history (including system prompt), and retrieved document chunks.
   * This maps to the "Messages" and "Retrieved Chunks" tabs.
   */
  public submitQueryAndRetrieveContext = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, conversationHistory, productId } = req.body;

      if (!productId) {
        res.status(400).json({ success: false, message: "Product ID is required in URL parameters." });
        return;
      }
      if (!query) {
        res.status(400).json({ success: false, message: "Query is required in the request body." });
        return;
      }

      // conversationHistory is optional, default to empty array if not provided
      const history = conversationHistory || [];

      const data = await this.contextInspectionService.getCompletionWithContext(query, productId, history);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`[ContextInspectionController] Error in submitQueryAndRetrieveContext for productId ${req.body.productId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to process query and retrieve context.',
        error: error.message,
      });
    }
  };

}