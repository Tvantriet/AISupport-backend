import CloudTasks from "./CloudTasks.js";
import Axios from "./Axios.js";
import Logger from "./Logger.js";
import { AxiosResponse } from "axios";

export default class QueuedRequest {
	public static async addItem(relativeUrl: string, payload: any, method = "POST", authHeader?: string) {
		if (method !== "POST" && method !== "PUT") throw new Error("QueuedRequest: Only POST and PUT are supported");

		const baseQueueUrl = process.env.CLOUDTASK_QUEUE_BASEURL;
		if (!baseQueueUrl) throw new Error("QueuedRequest: CLOUDTASK_QUEUE_BASEURL is not set");

		const separator = baseQueueUrl.endsWith("/") ? "" : "/";
		if (relativeUrl.startsWith("/")) relativeUrl = relativeUrl.substring(1);

		const url = baseQueueUrl + separator + relativeUrl;

		// Queue in Cloud Task if enabled
		if (process.env.CLOUDTASK_QUEUE_ENABLED === "1") {
			await CloudTasks.addItem(url, payload, method, authHeader);
			return;
		}

		Logger.debug("Sending with axios directly, because queueing is not enabled");

		// CloudTask wasn't enabled. Execute call directly. This is typically used the case for local dev.
		let axiosReply: AxiosResponse<any, any>;
		if (authHeader) axiosReply = await Axios.token(url, method, authHeader, payload);
		else axiosReply = await Axios.noAuth(url, method, payload);

		Logger.debug(`axiosReply data: '${JSON.stringify(axiosReply.data)}'`);
	}
}
