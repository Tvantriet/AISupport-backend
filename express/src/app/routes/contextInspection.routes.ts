import { Router } from "express";
import ContextInspectionController from "../controllers/ContextInspectionController.js";
import { IRoute } from "../../interfaces/IRouter.js";

export default class ContextInspectionRoutes implements IRoute {
    private router: Router;
    private controller: ContextInspectionController;

    constructor() {
        this.router = Router();
        this.controller = new ContextInspectionController();
        this.setupRoutes();
    }

    private setupRoutes() {
        // Route for listing available documents for a product
        this.router.get(
            "/:productId/available-documents", 
            this.controller.listAvailableDocuments.bind(this.controller)
        );

        // Route for submitting a query, getting completion, and context
        this.router.post(
            "/:productId/query", 
            this.controller.submitQueryAndRetrieveContext.bind(this.controller)
        );
    }

    public getRoutes(): Router {
        return this.router;
    }
}