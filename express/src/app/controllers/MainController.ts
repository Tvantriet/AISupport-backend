import { Response } from "express";
import { check, ValidationChain } from "express-validator";
import ApiResponses from "../utils/ApiResponses.js";
import Controller from "./Controller.js";

export default class MainController extends Controller {
	public validate(method: string) {
		let validation: ValidationChain[] = [];

		switch (method) {
			case "postExample":
				validation = [check("uid").isUUID().notEmpty().withMessage("Uid is required")];
				break;
			default: {
				throw new Error(`validation method '${method}' not found`);
			}
		}
		return this.validateRequest(validation);
	}

	/**
	 * Login without email
	 *
	 * @param req
	 * @param res
	 */
	public async main(req: any, res: Response) {
		ApiResponses.response(res, { success: true, data: { ok: "ok" } });
	}

	/**
	 * Custom registration
	 *
	 * @param req
	 * @param res
	 */
	public async postExample(req: any, res: Response) {
		ApiResponses.response(res, { success: true, uid: req.body.uid });
	}
}
