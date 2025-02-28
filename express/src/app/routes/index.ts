import apiRoutes from "../middleware/ApiRoutes.js";
import ApiRouter from "./api.js";
import WebRouter from "./web.js";
import ProductInterfaceRoutes from "./productInterface.routes.js";

import { Router } from "express";

export default (router: Router) => {
	const webRouter = new WebRouter();
	const apiRouter = new ApiRouter();
	router.use(webRouter.getRoutes());

	router.use(
		"/api",
		// Add midleware to check if cms routes should be available
		apiRoutes,
		apiRouter.getRoutes(),
	);

	router.use("/api/products", new ProductInterfaceRoutes().getRoutes());
};
