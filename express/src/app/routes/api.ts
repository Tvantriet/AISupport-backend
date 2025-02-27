import MainController from "../controllers/MainController.js";
import { IRoute } from "../../interfaces/IRouter.js";
import { Router } from "express";
import checkRequestErrors from "../middleware/RequestErrorCheck.js";

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the index.ts within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

export default class Api implements IRoute {
	private readonly mainController: MainController;

	constructor() {
		this.mainController = new MainController();
	}

	public getRoutes(): Router {
		const router = Router({ mergeParams: true });

		router.get("/", (req, res) => {
			res.json({});
		});

		router.get("/main", this.mainController.main);

		router.post(
			"/postExample",
			this.mainController.validate("postExample"),
			checkRequestErrors,
			this.mainController.postExample,
		);

		return router;
	}
}
