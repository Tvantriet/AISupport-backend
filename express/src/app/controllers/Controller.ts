import { ValidationChain } from "express-validator";
import checkRequestErrors from "../middleware/RequestErrorCheck.js";
import { Middleware } from "express-validator/src/base.js";

export default abstract class Controller {
	public abstract validate(method: string): Middleware;

	protected validateRequest(validations: ValidationChain[]) {
		return checkRequestErrors(validations);
	}
}
