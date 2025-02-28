import { Request, Response } from "express";
import { check, ValidationChain } from "express-validator";
import ApiResponses from "../utils/ApiResponses.js";
import Controller from "./Controller.js";
import QdrantService from "../services/QdrantService.js";
import DocumentProcessingService from "../services/DocumentProcessingService.js";

export default class ProductInterfaceController extends Controller {
    private qdrantService: QdrantService;
    private documentService: DocumentProcessingService;

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
                validation = [
                    check("settings").isObject().withMessage("Settings must be an object")
                ];
                break;
            default: {
                throw new Error(`validation method '${method}' not found`);
            }
        }
        return this.validateRequest(validation);
    }

    /**
     * Create a collection and add documents to it
     * 
     * @param req
     * @param res
     */
    public async createCollectionWithDocuments(req: Request, res: Response) {
        const { 
            collectionName, 
            dimension = 3072,  // Default dimension for text-embedding-3-large
            documents 
        } = req.body;
        
        try {
            const result = await this.documentService.createCollectionWithDocuments(
                collectionName, 
                dimension, 
                documents
            );
            
            ApiResponses.response(res, { 
                success: true, 
                message: `Collection ${collectionName} processed successfully`,
                ...result
            });
        } catch (error: any) {
            console.error('Error processing documents:', error);
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
                settings
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
                message: `Collection ${name} deleted successfully` 
            });
        } catch (error: any) {
            ApiResponses.response(res, { success: false, message: error.message });
        }
    }

} 