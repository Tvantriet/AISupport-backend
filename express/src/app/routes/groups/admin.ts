import { Router } from "express";
import { IRoute } from "../../../interfaces/IRouter.js";
import AuthController, { AuthMethods } from "../../controllers/AuthController.js";
import checkRequestErrors from "../../middleware/RequestErrorCheck.js";

/* =======================
 *  Extend AdminJS router with custom routes
 * ======================= */
class Admin implements IRoute {
	private readonly authController: AuthController;

	constructor() {
		this.authController = new AuthController();
	}

	getRoutes(): Router {
		const router = Router();

		/*-----------------------------------------Auth routes-----------------------------------------------*/
		router.get("/password-recovery", this.authController.showPasswordRecovery);

		router.get("/password-reset", this.authController.showPasswordReset);

		router.post(
			"/password-recovery",
			this.authController.validate(AuthMethods.PasswordRecovery),
			this.authController.passwordRecovery,
		);

		router.post(
			"/password-reset",
			this.authController.validate(AuthMethods.PasswordReset),
			checkRequestErrors,
			this.authController.passwordReset,
		);

		return router;
	}
}

export default Admin;
