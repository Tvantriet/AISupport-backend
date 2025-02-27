import { NextFunction, Request, Response } from "express";
import ApiResponses from "../utils/ApiResponses.js";
import config from "../../config/security.js";

/**
 * Checks if api secret is passed in request.
 *
 * If it is not passed then the request fails.
 *
 * @param req - express request
 * @param res - express response
 * @param next - express next function
 */
export default function apiSecret(req: Request, res: Response, next: NextFunction) {
	let secret = "";

	// Extract secret from either query, body or headers
	if (req.header("Authorization")) {
		secret = req.header("Authorization") as string;
	}

	// Validate secret
	if (config.secret && secret === config.secret) {
		return next();
	}

	return ApiResponses.errorResponse(res, "authorizationInvalid");
}
