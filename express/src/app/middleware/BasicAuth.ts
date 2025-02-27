import { NextFunction, Request, Response } from "express";
import auth from "basic-auth";
import ApiResponses from "../utils/ApiResponses.js";
import config from "../../config/security.js";

/**
 * Checks if basic authentication is correct.
 *
 * If it is not correct then the request fails.
 *
 * @param req
 * @param res
 * @param next
 */
export default async function basicAuth(req: Request, res: Response, next: NextFunction) {
	const user = await auth(req);

	// Check if user credentials are valid
	if (user && user.name === config.basicAuth.username && user.pass === config.basicAuth.password) {
		return next();
	}
	return ApiResponses.errorResponse(res, "authorizationInvalid");
}
