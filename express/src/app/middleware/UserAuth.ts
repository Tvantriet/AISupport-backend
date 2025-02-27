import { NextFunction, Request, Response } from "express";
import ApiResponses from "../utils/ApiResponses.js";
import JWT from "../utils/JWT.js";
import Logger from "../utils/Logger.js";
import getErrorMessage from "../utils/ErrorMessage.js";

/**
 * Checks if login credentials are correct.
 * If it is not correct then the req fails.
 * @param req
 * @param res
 * @param next - express next function
 */
export default async function appUserAuth(req: Request, res: Response, next: NextFunction) {
	// Authenticate local
	const token = req.headers["x-access-token"] || req.headers.authorization;
	if (typeof token === "string" && token.length > 10) {
		try {
			const decoded = await JWT.verify(token.split(" ")[1]);
			req.userId = decoded.id;

			return next();
		} catch (err) {
			Logger.error(
				`route: ${req.originalUrl} token: ${token.split(" ")[1]} not accepted with error: ${getErrorMessage(err)}`,
			);
			return ApiResponses.errorResponse(res, "authorizationInvalid");
		}
	}
	return ApiResponses.errorResponse(res, "forbidden");
}
