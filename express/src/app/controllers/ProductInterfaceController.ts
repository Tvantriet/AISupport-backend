import { Request, Response } from "express";
import { check, ValidationChain } from "express-validator";
import ApiResponses from "../utils/ApiResponses.js";
import Controller from "./Controller.js";
import QdrantService from "../services/QdrantService.js";
import DocumentProcessingService from "../services/DocumentProcessingService.js";

export default class ProductInterfaceController extends Controller {
	public qdrantService: QdrantService;
	public documentService: DocumentProcessingService;

	constructor() {
		super();
		this.qdrantService = new QdrantService();
		this.documentService = new DocumentProcessingService();
	}

	public validate(method: string) {
		let validation: ValidationChain[] = [];

		switch (method) {
			case "createCollectionWithDocuments":
				validation = [
					check("collectionName").notEmpty().withMessage("Collection name is required"),
					check("documents").isArray().withMessage("Documents must be an array"),
				];
				break;
			case "editCollection":
				validation = [check("settings").isObject().withMessage("Settings must be an object")];
				break;
			default: {
				throw new Error(`validation method '${method}' not found`);
			}
		}
		return this.validateRequest(validation);
	}

	/**
	 * Create an empty collection
	 * 
	 * @param req
	 * @param res
	 */
	public async createEmptyCollection(req: Request, res: Response) {
		const {
			collectionName,
			dimension = 3072, 
		} = req.body;
		
		try {
			const result = await this.qdrantService.createCollection(
				collectionName,
				dimension
			);
			
			ApiResponses.response(res, {
				success: true,
				message: result,
			});
		} catch (error: any) {
			console.error("Error creating collection:", error);
			ApiResponses.response(res, { success: false, message: error.message });
		}
	}

	/**
	 * Add documents to an existing collection
	 * 
	 * @param req
	 * @param res
	 */
	public async addDocumentsToCollection(req: Request, res: Response) {
		const {
			collectionName,
			documents,
		} = req.body;
		
		try {
			const result = await this.documentService.addDocumentsToCollection(
				collectionName,
				documents
			);
			
			ApiResponses.response(res, {
				success: true,
				message: `Added ${result.documentsAdded} documents (${result.chunksCreated} chunks) to collection ${collectionName}`,
				...result,
			});
		} catch (error: any) {
			console.error("Error adding documents:", error);
			ApiResponses.response(res, { success: false, message: error.message });
		}
	}

	/**
	 * Edit collection settings
	 *
	 * @param req
	 * @param res
	 */
	public async editCollection(req: Request, res: Response) {
		const { name } = req.params;
		const { settings } = req.body;

		try {
			await this.qdrantService.updateCollection(name, settings);
			ApiResponses.response(res, {
				success: true,
				message: `Collection ${name} updated successfully`,
				settings,
			});
		} catch (error: any) {
			ApiResponses.response(res, { success: false, message: error.message });
		}
	}

	/**
	 * Delete a collection from Qdrant
	 *
	 * @param req
	 * @param res
	 */
	public async deleteCollection(req: Request, res: Response) {
		const { name } = req.params;

		try {
			await this.qdrantService.deleteCollection(name);
			ApiResponses.response(res, {
				success: true,
				message: `Collection ${name} deleted successfully`,
			});
		} catch (error: any) {
			ApiResponses.response(res, { success: false, message: error.message });
		}
	}

	/**
	 * Check API status
	 *
	 * @param req
	 * @param res
	 */
	public async checkStatus(req: Request, res: Response) {
		try {
			// Check if Qdrant is accessible
			const collections = await this.qdrantService.getCollections();

			// Check if OpenAI is accessible
			const openaiStatus = await this.documentService.checkOpenAIStatus();

			ApiResponses.response(res, {
				success: true,
				status: "operational",
				qdrant: {
					status: "connected",
					collections: collections.collections.length,
				},
				openai: openaiStatus,
			});
		} catch (error: any) {
			console.error("Error checking API status:", error);
			ApiResponses.response(res, {
				success: false,
				status: "error",
				message: error.message,
			});
		}
	}
}
