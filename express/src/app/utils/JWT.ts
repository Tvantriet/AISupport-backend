import jwt from "jsonwebtoken";
import config from "../../config/security.js";

export default class JWT {
	public static async sign(content: any, expiresIn: number) {
		const o = {} as jwt.SignOptions;
		if (expiresIn > 0) o.expiresIn = expiresIn;

		return new Promise((resolve, reject) => {
			jwt.sign(content, config.jwtSecret as string, o, (err: any, token: any) => {
				if (err !== null) reject(err);
				else resolve(token);
			});
		});
	}

	public static async verify(token: string): Promise<any> {
		return new Promise((resolve, reject) => {
			jwt.verify(token, config.jwtSecret as string, (err, decoded) => {
				if (err !== null) reject(err);
				else resolve(decoded);
			});
		});
	}
}
