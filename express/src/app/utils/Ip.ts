import { Request } from "express";

export default class Ip {
	/**
	 * Get current ip
	 *
	 * @return {string}
	 * @param request
	 */
	public static get(request: Request) {
		return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress);
	}
}
