import { NextFunction, Request, Response } from "express";
import { validationResult, ErrorFormatter, ValidationChain } from "express-validator";
import ApiResponses from "../utils/ApiResponses.js";
import { Middleware } from "express-validator/src/base.js";

/**
 * Checks if request contains validation errors.
 * If so, the request fails.
 * @param validationChains
 */

const RequestErrorCheck = (validationChains: ValidationChain[]): Middleware => {
	return async function (req: Request, res: Response, next: NextFunction) {
		const errorFormatter: ErrorFormatter = (error) => {
			const { location, msg, param } = error;
			return `${location}[${param}]: ${msg}`;
		};

		// Perform validation checks
		await Promise.all(validationChains.map((validationChain) => validationChain.run(req)));

		const errors = validationResult(req).formatWith(errorFormatter);

		if (!errors.isEmpty()) {
			return ApiResponses.errorResponse(res, "badRequest", errors.array());
		}

		return next();
	};
};

export default RequestErrorCheck;
