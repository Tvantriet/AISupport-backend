import { Request, Response } from "express";
import { ValidationChain, body } from "express-validator";
import Controller from "./Controller.js";
import JWT from "../utils/JWT.js";
import CmsUser from "../models/CmsUser.entity.js";
import Bcrypt from "../utils/Bcrypt.js";
import MailModule from "../modules/MailModule.js";
import app from "../../config/app.js";

export enum AuthMethods {
	PasswordRecovery = "PasswordRecovery",
	PasswordReset = "PasswordReset",
}

export default class AuthController extends Controller {
	public validate(method: string) {
		let validation: ValidationChain[] = [];

		switch (method) {
			case AuthMethods.PasswordRecovery:
				validation = [body("email").notEmpty().isEmail().withMessage("Email is invalid")];
				break;
			case AuthMethods.PasswordReset:
				validation = [
					body("token").notEmpty().withMessage("Token is invalid"),
					body("password").notEmpty().isString().withMessage("Password is invalid"),
					body("confirmPassword").notEmpty().isString().withMessage("Password is invalid"),
				];
				break;
			default: {
				throw new Error(`validation method '${method}' not found`);
			}
		}

		return this.validateRequest(validation);
	}

	public async showPasswordRecovery(req: Request, res: Response) {
		res.render("login/password-recovery", {
			errorMessage: null,
			requestSuccess: null,
		});
	}

	public async passwordRecovery(req: Request, res: Response) {
		const { email } = req.body;

		// Check user account in db
		const user = await CmsUser.findByEmail(email);

		if (user) {
			// Generate jwt token
			const recoveryToken = await JWT.sign({ email }, 900); // 15 min token

			// Save to user
			user.passwordRecoveryToken = recoveryToken as string;
			await user.save();

			// Trigger send flow
			MailModule.addCid("images/logo.png", "logo.png", "logo");
			MailModule.send({
				view: "reset-password",
				to: user.email,
				subject: "Password recovery",
				data: { name: user.name, appUrl: app.url, recoveryToken },
			});
		}
		return res.render("login/password-recovery", { errorMessage: null, requestSuccess: true });
	}

	public async showPasswordReset(req: Request, res: Response) {
		const { token } = req.query;
		// Decode jwt token
		const decodedToken = await JWT.verify(token as string);
		const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Huidige tijd in seconden

		if (decodedToken?.exp && decodedToken?.exp > currentTimeInSeconds) {
			return res.render("login/password-reset", { errorMessage: null, requestSuccess: null, token });
		}
		// Token is expired
		return res.render("login/password-reset", {
			errorMessage: "Your recovery token is expired, please request again",
			requestSuccess: null,
			token,
		});
	}

	public async passwordReset(req: Request, res: Response) {
		const { password, confirmPassword, token } = req.body;
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		// Check password
		if (password !== confirmPassword) {
			return res.render("login/password-reset", {
				errorMessage: "Password confirmation is different",
				requestSuccess: null,
				token,
			});
		}
		if (!passwordRegex.test(password)) {
			return res.render("login/password-reset", {
				errorMessage:
					"Password needs to contain 1 lowercase, uppercase, number and special character and needs to be at least 8 characters long",
				requestSuccess: null,
				token,
			});
		}
		// Decode jwt token
		const decodedToken = await JWT.verify(token); // 15 min token
		if (!decodedToken?.email) {
			return res.render("login/password-reset", {
				errorMessage: "Login token invalid or expired.",
				requestSuccess: null,
				token,
			});
		}
		const user = await CmsUser.findOne({ where: { email: decodedToken.email } });
		if (!user) {
			return res.render("login/password-reset", {
				errorMessage: "Something went wrong, try again",
				requestSuccess: null,
				token,
			});
		}

		user.password = Bcrypt.make(password);
		await user?.save();
		return res.redirect("/admin/login");
	}
}
