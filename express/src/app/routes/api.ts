import MainController from "../controllers/MainController.js";
import { IRoute } from "../../interfaces/IRouter.js";
import { Router } from "express";
import checkRequestErrors from "../middleware/RequestErrorCheck.js";
import QdrantService from "../services/QdrantService.js";
import DocumentProcessingService from "../services/DocumentProcessingService.js";
import ApiResponses from "../utils/ApiResponses.js";

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the index.ts within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

export default class Api implements IRoute {
	private readonly mainController: MainController;

	constructor() {
		this.mainController = new MainController();
	}

	public getRoutes(): Router {
		const router = Router({ mergeParams: true });
		const qdrantService = new QdrantService();
		const documentService = new DocumentProcessingService();

		router.get("/", (req, res) => {
			res.json({});
		});

		router.get("/main", this.mainController.main);

		router.post(
			"/postExample",
			this.mainController.validate("postExample"),
			checkRequestErrors,
			this.mainController.postExample,
		);

		// Global API status endpoint
		router.get("/status", async (req, res) => {
			console.log("checking status");
			try {
				// Check if Qdrant is accessible
				const collections = await qdrantService.getCollections();
				
				// Check if OpenAI is accessible
				const openaiStatus = await documentService.checkOpenAIStatus();
				
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
		});

		return router;
	}
}
