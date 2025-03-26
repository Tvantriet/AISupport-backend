import { NextFunction, Request, Response } from "express";
import ApiResponses from "../utils/ApiResponses.js";
import config from "../../config/app.js";

/**
 * Checks if deployment is api or cms and handle access occording to the set variable *
 *
 * @param req - express request
 * @param res - express response
 * @param next - express next function
 */
export default function apiRoutes(req: Request, res: Response, next: NextFunction) {
	const loadRoutes = config.loadRoutes as string;
	console.log(req.path);

	if (!["api", "all"].includes(loadRoutes)) return ApiResponses.errorResponse(res, "forbidden", {}, 405);

	// Skip authentication for status endpoint
	if (req.path === '/status') {
		console.log("test");
		return next();
	}

	return next();
}
