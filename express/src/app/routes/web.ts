import { Router } from "express";
import { IRoute } from "../../interfaces/IRouter.js";
import Admin from "./groups/admin.js";

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

class Web implements IRoute {
	private admin: Admin;

	constructor() {
		this.admin = new Admin();
	}

	public getRoutes(): Router {
		const router = Router();

		/*-----------------------------------------Normal routes-----------------------------------------------*/
		router.get("/", (req, res) => {
			res.json({});
		});

		/* ----------------------------------------Admin routes----------------------------------------------*/
		router.use("/", this.admin.getRoutes());

		return router;
	}
}

export default Web;
